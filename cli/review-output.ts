import { table, truncate } from './output.ts';
import type { Review, MyReview } from './types.ts';

export function reviewSourceLabel(
  review: Pick<Review, 'review_source' | 'reviewer_is_seed'>,
): string {
  switch (review.review_source) {
    case 'automated':
      return 'automated';
    case 'seeded':
      return 'seeded';
    case 'member':
      return 'member';
    default:
      if (review.reviewer_is_seed === true) return 'seeded';
      if (review.reviewer_is_seed === false) return 'member';
      return 'unknown';
  }
}

export function formatReviews(reviews: Review[]): string {
  return table(reviews, [
    { header: 'REVIEWER', get: (r) => '@' + r.reviewer_handle },
    { header: 'SOURCE', get: reviewSourceLabel },
    { header: 'PAID', get: (r) => (r.paid ? 'paid' : '') },
    { header: 'WHEN', get: (r) => r.created_at.slice(0, 10) },
    { header: 'REVIEW', get: (r) => truncate(r.body.replace(/\s+/g, ' '), 70) },
  ]);
}

export function formatMyReviews(reviews: MyReview[]): string {
  return table(reviews, [
    { header: 'PROJECT', get: (r) => truncate(r.project_title, 30) },
    { header: 'SOURCE', get: reviewSourceLabel },
    { header: 'WHEN', get: (r) => r.created_at.slice(0, 10) },
    { header: 'REVIEW', get: (r) => truncate(r.body.replace(/\s+/g, ' '), 60) },
  ]);
}
