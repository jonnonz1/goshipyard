import { expect, test } from 'bun:test';
import { formatOpportunities, formatReactions, reactionKindLabel } from './reaction-output.ts';
import type { Opportunity, Reaction } from './types.ts';

const reaction: Reaction = {
  id: 'r1',
  project_id: 'p1',
  source: 'Hacker News',
  source_url: 'https://news.ycombinator.com/item?id=1',
  body: 'Works on my phone.',
  sentiment: 'ok',
  created_at: '2026-11-09T00:00:00Z',
};

const card: Opportunity = {
  id: 'o1',
  project_id: 'p1',
  type: 'conversation',
  channel: 'reddit',
  source: 'r/German',
  url: 'https://www.reddit.com/r/German/comments/abc/',
  title: 'How do I prepare for B1 in six weeks?',
  why: 'They ask for a study plan the app builds.',
  draft: 'Six weeks is tight but doable.\nStart with a mock exam.',
  leverage: 8.2,
  status: 'live',
  link: 'https://goshipyard.app/r/o1',
  reply_url: null,
  thread_at: null,
  expires_at: null,
  decided_at: null,
};

test('kind labels preserve provenance and never infer a person from absent metadata', () => {
  expect(reactionKindLabel({ review_source: 'automated' })).toBe('automated');
  expect(reactionKindLabel({ review_source: 'seeded' })).toBe('seeded');
  expect(reactionKindLabel({ review_source: 'member' })).toBe('member');
  expect(reactionKindLabel({ reviewer_is_seed: true })).toBe('seeded');
  expect(reactionKindLabel({ reviewer_is_seed: false })).toBe('member');
  expect(reactionKindLabel(reaction)).toBe('unknown');
});

test('the reactions table shows where each was said and its provenance', () => {
  const rendered = formatReactions([
    { ...reaction, review_source: 'seeded', source: 'Shipyard member' },
    { ...reaction, id: 'r2' },
  ]);
  expect(rendered).toContain('WHERE');
  expect(rendered).toContain('KIND');
  expect(rendered).toContain('Hacker News');
  expect(rendered).toContain('seeded');
  expect(rendered).toContain('unknown');
  expect(rendered).not.toContain('verified human');
});

test('a board card prints its thread, its whole draft, the link and its id', () => {
  const rendered = formatOpportunities([card]);
  expect(rendered).toContain('[8.2] r/German · How do I prepare for B1 in six weeks?');
  expect(rendered).toContain('https://www.reddit.com/r/German/comments/abc/');
  expect(rendered).toContain('    Six weeks is tight but doable.\n    Start with a mock exam.');
  expect(rendered).toContain('If someone asks for the app: https://goshipyard.app/r/o1');
  expect(rendered).toContain('id: o1');
  expect(rendered).not.toContain('Your post:');
});
