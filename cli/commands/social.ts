// social commands: like / unlike (upvote a project).
//
// "Like" is an upvote. Both are idempotent on the server, so repeating them is
// safe — liking twice keeps the count at one.
import { parse, requireAuth } from '../shared.ts';
import { print, printJson, info } from '../output.ts';

export async function like(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv);
  if (values.help || !positionals[0]) return print('Usage: shipyard like <project-id>');
  const res = await requireAuth(values).upvote(positionals[0]);
  if (values.json) return printJson(res);
  info(`✓ Liked — ${res.upvotes} upvote${res.upvotes === 1 ? '' : 's'}.`);
}

export async function unlike(argv: string[]): Promise<void> {
  const { values, positionals } = parse(argv);
  if (values.help || !positionals[0]) return print('Usage: shipyard unlike <project-id>');
  const res = await requireAuth(values).removeUpvote(positionals[0]);
  if (values.json) return printJson(res);
  info(`✓ Removed your like — ${res.upvotes} upvote${res.upvotes === 1 ? '' : 's'}.`);
}
