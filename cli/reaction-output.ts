import { table, truncate } from './output.ts';
import type { Opportunity, Reaction } from './types.ts';

/** The provenance label for a reaction. Absent metadata is "unknown", never assumed human. */
export function reactionKindLabel(
  reaction: Pick<Reaction, 'review_source' | 'reviewer_is_seed'>,
): string {
  switch (reaction.review_source) {
    case 'automated':
      return 'automated';
    case 'seeded':
      return 'seeded';
    case 'member':
      return 'member';
    default:
      if (reaction.reviewer_is_seed === true) return 'seeded';
      if (reaction.reviewer_is_seed === false) return 'member';
      return 'unknown';
  }
}

/** A listing's reactions as a table: where each was said, its provenance, when, and the words. */
export function formatReactions(reactions: Reaction[]): string {
  return table(reactions, [
    { header: 'WHERE', get: (r) => truncate(r.source, 24) },
    { header: 'KIND', get: reactionKindLabel },
    { header: 'WHEN', get: (r) => r.created_at.slice(0, 10) },
    { header: 'REACTION', get: (r) => truncate(r.body.replace(/\s+/g, ' '), 70) },
  ]);
}

/** Board cards in full, best fit first as the server sent them: the draft is the point. */
export function formatOpportunities(cards: Opportunity[]): string {
  return cards
    .map((c) =>
      [
        `[${c.leverage}] ${c.source} · ${c.title}`,
        `  ${c.url}`,
        c.why ? `  Why it fits: ${c.why}` : '',
        c.draft ? `  Suggested reply:\n${indent(c.draft, 4)}` : '',
        c.link ? `  If someone asks for the app: ${c.link}` : '',
        c.reply_url ? `  Your post: ${c.reply_url}` : '',
        `  id: ${c.id}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n');
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line ? pad + line : line))
    .join('\n');
}
