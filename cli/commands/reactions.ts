// reactions command: what people said about a listing.
//
// Reactions are replies the maker chose to show from threads where they posted,
// plus the reviews brought over from Shipyard v1. Nobody writes one through the
// CLI: `reviews add` and `reviews mine` ended with v1 and say so.
import { parse, requireAuth, num, UsageError } from '../shared.ts';
import { print, printJson, info } from '../output.ts';
import { formatReactions } from '../reaction-output.ts';
import type { ListParams } from '../types.ts';

const USAGE = 'Usage: shipyard reactions <project-id> [--limit N] [--offset N]';

export async function reactionsCommand(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv, {
    limit: { type: 'string' },
    offset: { type: 'string' },
  });
  if (values.help || !positionals[0]) return print(USAGE);

  const params: ListParams = { limit: num(values.limit), offset: num(values.offset) };
  const result = await requireAuth(values).listReactions(positionals[0], params);
  if (values.json) return printJson(result);
  if (!result.data.length) {
    info('No reactions yet.');
    return;
  }
  print(formatReactions(result.data));
  const pg = result.pagination;
  if (pg?.has_more) info(`… more — re-run with --offset ${pg.offset + pg.limit}`);
}

// `shipyard reviews …` from before 0.4.0: listing still works, writing ended with v1.
export async function reviewsCommand(argv: string[]): Promise<void> {
  const verb = argv[0];
  switch (verb) {
    case 'list':
    case 'ls':
      return reactionsCommand(argv.slice(1));
    case 'add':
    case 'post':
    case 'mine':
      throw new UsageError(
        'Writing reviews ended with Shipyard v1. Reactions now come from threads where the ' +
          'maker posted — read them with `shipyard reactions <project-id>`.',
      );
    default:
      return print(
        [USAGE, '', '`shipyard reviews list <project-id>` still works as an alias.'].join('\n'),
      );
  }
}
