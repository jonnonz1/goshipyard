// Request/response shapes for the Shipyard public API (/api/v1). Hand-written and
// intentionally small — the canonical contract is the repo's openapi.json. If this
// surface grows, regenerate from it with `openapi-typescript` instead.

export interface MeUser {
  id: string;
  handle: string;
  name: string;
  email: string;
  bio: string;
  url: string;
  is_admin: boolean;
  is_reviewer: boolean;
  created_at: string;
}

export interface ProjectImage {
  ordinal: number;
  url: string;
}

export interface Project {
  id: string;
  slug: string;
  owner_handle: string;
  title: string;
  pitch: string;
  body: string;
  url: string;
  repo_url: string;
  category: string;
  upvotes: number;
  reviews: number;
  featured: boolean;
  voted?: boolean; // present on single-project reads + upvote responses
  created_at: string;
  images: ProjectImage[];
  html_url: string;
}

export interface Pagination {
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ProjectList {
  data: Project[];
  pagination: Pagination;
}

export interface Review {
  id: string;
  project_id: string;
  reviewer_handle: string;
  /** Optional when connected to an older server. Never infer provenance from paid/body. */
  reviewer_is_seed?: boolean;
  review_source?: 'automated' | 'seeded' | 'member';
  body: string;
  paid: boolean;
  created_at: string;
  html_url: string;
}

export interface ReviewList {
  data: Review[];
  pagination: Pagination;
}

export interface MyReview extends Review {
  project_title: string;
}

export interface VoteResult {
  id: string;
  upvotes: number;
  voted: boolean;
}

export interface LedgerEntry {
  kind: string;
  amount_cents: number;
  balance_after: number;
  memo: string;
  created_at: string;
}

export interface Wallet {
  balance_cents: number;
  balance: string;
  currency: string;
  topup_url: string;
  recent: LedgerEntry[];
}

export interface DeleteResult {
  deleted: boolean;
  id: string;
}

export interface ApiErrorBody {
  error: { code: string; fields?: Record<string, string> };
}

export interface CreateProjectInput {
  title: string;
  pitch: string;
  url: string;
  category?: string;
  repo_url?: string;
  body?: string;
  slug?: string;
}

export type UpdateProjectInput = Partial<{
  title: string;
  pitch: string;
  url: string;
  repo_url: string;
  category: string;
  body: string;
}>;

export interface ListParams {
  sort?: 'new' | 'top';
  q?: string;
  category?: string;
  limit?: number;
  offset?: number;
}
