// reviews commands: list / add / mine
//
// Reviews are the public comments on a project. Any authenticated user can post
// one (≥20 chars); the project owner is notified. `mine` lists what you've written.
import { parse, requireAuth, str, num, UsageError, type Values } from '../shared.ts';
import { print, printJson, info, table, truncate } from '../output.ts';
import type { ListParams } from '../types.ts';

export async function reviewsCommand(argv: string[]): Promise<void> {
  const verb = argv[0];
  const rest = argv.slice(1);
  switch (verb) {
    case 'list':
    case 'ls':
      return list(rest);
    case 'add':
    case 'post':
      return add(rest);
    case 'mine':
      return mine(rest);
    case undefined:
    case 'help':
      return reviewsHelp();
    default:
      throw new UsageError(`Unknown reviews command: ${verb}. Try \`shipyard reviews help\`.`);
  }
}

async function list(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv, {
    limit: { type: 'string' },
    offset: { type: 'string' },
  });
  if (values.help || !positionals[0])
    return print('Usage: shipyard reviews list <project-id> [--limit N] [--offset N]');

  const params: ListParams = { limit: num(values.limit), offset: num(values.offset) };
  const result = await requireAuth(values).listReviews(positionals[0], params);
  if (values.json) return printJson(result);
  if (!result.data.length) {
    info('No reviews yet.');
    return;
  }
  print(
    table(result.data, [
      { header: 'REVIEWER', get: (r) => '@' + r.reviewer_handle },
      { header: 'PAID', get: (r) => (r.paid ? 'paid' : '') },
      { header: 'WHEN', get: (r) => r.created_at.slice(0, 10) },
      { header: 'REVIEW', get: (r) => truncate(r.body.replace(/\s+/g, ' '), 70) },
    ]),
  );
  const pg = result.pagination;
  if (pg.has_more) info(`… more — re-run with --offset ${pg.offset + pg.limit}`);
}

async function add(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv, {
    body: { type: 'string', short: 'b' },
    'body-file': { type: 'string' },
  });
  if (values.help || !positionals[0]) return addHelp();

  const body = await resolveBody(values);
  if (!body) throw new UsageError('Provide the review text with --body "…" or --body-file PATH.');
  if (body.trim().length < 20) {
    throw new UsageError('Reviews must be at least 20 characters — say something useful.');
  }

  const review = await requireAuth(values).createReview(positionals[0], body);
  if (values.json) return printJson(review);
  info(`✓ Posted review as @${review.reviewer_handle}`);
  print(review.html_url);
}

async function mine(argv: string[]): Promise<void> {
  const { values } = parse(argv);
  if (values.help) return print('Usage: shipyard reviews mine');
  const result = await requireAuth(values).myReviews();
  if (values.json) return printJson(result);
  if (!result.data.length) {
    info("You haven't written any reviews yet.");
    return;
  }
  print(
    table(result.data, [
      { header: 'PROJECT', get: (r) => truncate(r.project_title, 30) },
      { header: 'WHEN', get: (r) => r.created_at.slice(0, 10) },
      { header: 'REVIEW', get: (r) => truncate(r.body.replace(/\s+/g, ' '), 60) },
    ]),
  );
}

async function resolveBody(values: Values): Promise<string | undefined> {
  const file = str(values['body-file']);
  if (file !== undefined) return await Bun.file(file).text();
  return str(values.body);
}

function reviewsHelp(): void {
  print(
    [
      'Usage: shipyard reviews <command>',
      '',
      '  list   List a project’s reviews: shipyard reviews list <project-id>',
      '  add    Post a review:           shipyard reviews add <project-id> -b "honest, ≥20 chars"',
      '  mine   List reviews you’ve written',
    ].join('\n'),
  );
}

function addHelp(): void {
  print(
    [
      'Usage: shipyard reviews add <project-id> (-b TEXT | --body-file PATH)',
      '',
      '  -b, --body TEXT     The review text (at least 20 characters)',
      '      --body-file F   Read the review text from a file',
      '',
      '  Be honest and specific — reviews notify the maker and are public.',
    ].join('\n'),
  );
}
