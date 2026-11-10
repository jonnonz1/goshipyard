// opportunities commands: list / mark
//
// A listing's board: threads where people are asking about what the app does,
// each with a suggested first reply. Shipyard never posts for anyone — the maker
// posts from their own account, then marks the card so replies are watched.
// The board is a paid plan; without one the API answers 402.
import { parse, requireAuth, str, UsageError } from '../shared.ts';
import { print, printJson, info } from '../output.ts';
import { formatOpportunities } from '../reaction-output.ts';
import type { OpportunityStatus, OpportunityView } from '../types.ts';

const VIEWS: OpportunityView[] = ['live', 'posted', 'dismissed'];
const STATUSES: OpportunityStatus[] = ['posted', 'dismissed', 'live'];

export async function opportunitiesCommand(argv: string[]): Promise<void> {
  const verb = argv[0];
  const rest = argv.slice(1);
  switch (verb) {
    case 'list':
    case 'ls':
      return list(rest);
    case 'mark':
      return mark(rest);
    case undefined:
    case 'help':
      return opportunitiesHelp();
    default:
      throw new UsageError(
        `Unknown opportunities command: ${verb}. Try \`shipyard opportunities help\`.`,
      );
  }
}

async function list(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv, { view: { type: 'string' } });
  if (values.help || !positionals[0]) {
    return print('Usage: shipyard opportunities list <project-id> [--view live|posted|dismissed]');
  }
  const view = str(values.view) as OpportunityView | undefined;
  if (view !== undefined && !VIEWS.includes(view)) {
    throw new UsageError(`--view must be one of: ${VIEWS.join(', ')}.`);
  }
  const result = await requireAuth(values).listOpportunities(positionals[0], view);
  if (values.json) return printJson(result);
  if (!result.data.length) {
    info(`Nothing ${view ?? 'live'} on this board right now.`);
    return;
  }
  print(formatOpportunities(result.data));
  info(
    '\nPost replies yourself, from your own account. Then: shipyard opportunities mark <id> posted --reply-url URL',
  );
}

async function mark(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv, { 'reply-url': { type: 'string' } });
  const [id, status] = positionals;
  if (values.help || !id || !status) return markHelp();
  if (!STATUSES.includes(status as OpportunityStatus)) {
    throw new UsageError(`Status must be one of: ${STATUSES.join(', ')}.`);
  }
  const replyUrl = str(values['reply-url']);
  if (replyUrl && status !== 'posted') {
    throw new UsageError('--reply-url only goes with `posted`.');
  }
  const res = await requireAuth(values).markOpportunity(id, status as OpportunityStatus, replyUrl);
  if (values.json) return printJson(res);
  info(
    res.status === 'posted'
      ? replyUrl
        ? '✓ Marked posted — Shipyard will watch your post for replies.'
        : '✓ Marked posted. Add --reply-url with the link to your post to have replies watched.'
      : `✓ Marked ${res.status}.`,
  );
}

function opportunitiesHelp(): void {
  print(
    [
      'Usage: shipyard opportunities <command>',
      '',
      '  list   Threads to answer, with a suggested reply each:',
      '           shipyard opportunities list <project-id> [--view live|posted|dismissed]',
      '  mark   Record what you did with a card:',
      '           shipyard opportunities mark <id> posted [--reply-url URL]',
      '           shipyard opportunities mark <id> dismissed | live',
      '',
      '  Shipyard never posts for you. The board is a paid plan: https://goshipyard.app/pricing',
    ].join('\n'),
  );
}

function markHelp(): void {
  print(
    [
      'Usage: shipyard opportunities mark <opportunity-id> <posted|dismissed|live> [--reply-url URL]',
      '',
      '      --reply-url URL   With `posted`: the link to your own reply, so Shipyard',
      '                        watches it for answers',
    ].join('\n'),
  );
}
