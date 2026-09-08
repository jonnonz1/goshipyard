import { expect, test } from 'bun:test';
import { formatReviews, formatMyReviews, reviewSourceLabel } from './review-output.ts';
import type { Review } from './types.ts';

const review: Review = {
  id: 'r1',
  project_id: 'p1',
  reviewer_handle: 'example',
  body: 'Useful feedback.',
  paid: true,
  created_at: '2026-09-09T00:00:00Z',
  html_url: 'https://goshipyard.app/p/p1',
};

test('source labels preserve provenance and do not infer human testing from absent metadata', () => {
  expect(reviewSourceLabel({ review_source: 'automated' })).toBe('automated');
  expect(reviewSourceLabel({ review_source: 'seeded' })).toBe('seeded');
  expect(reviewSourceLabel({ review_source: 'member' })).toBe('member');
  expect(reviewSourceLabel({ reviewer_is_seed: true })).toBe('seeded');
  expect(reviewSourceLabel({ reviewer_is_seed: false })).toBe('member');
  expect(reviewSourceLabel(review)).toBe('unknown');
});

test('both review tables show provenance while keeping payment a separate property', () => {
  const seeded = { ...review, review_source: 'seeded' as const };
  const rendered = formatReviews([seeded, { ...review, id: 'r2' }]);
  expect(rendered).toContain('SOURCE');
  expect(rendered).toContain('seeded');
  expect(rendered).toContain('unknown');
  expect(rendered).toContain('paid');
  const mine = formatMyReviews([{ ...seeded, project_title: 'Example app' }]);
  expect(mine).toContain('SOURCE');
  expect(mine).toContain('seeded');
  expect(mine).not.toContain('verified human');
});
