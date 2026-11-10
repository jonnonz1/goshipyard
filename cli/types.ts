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
  /** Reactions on the listing. */
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

/** Something said about a listing: a reply the maker chose to show, or one brought over from v1. */
export interface Reaction {
  id: string;
  project_id: string;
  /** Where it was said, e.g. "Hacker News" or "r/German". */
  source: string;
  source_url: string | null;
  body: string;
  sentiment: string | null;
  /** Optional when connected to an older server. Never infer provenance from the body. */
  reviewer_is_seed?: boolean;
  review_source?: 'automated' | 'seeded' | 'member';
  created_at: string;
}

export interface ReactionList {
  data: Reaction[];
  pagination: Pagination;
}

export interface VoteResult {
  id: string;
  upvotes: number;
  voted: boolean;
}

export type OpportunityView = 'live' | 'posted' | 'dismissed';
export type OpportunityStatus = 'posted' | 'dismissed' | 'live';

/** A board card: a thread where people are asking about what the app does. */
export interface Opportunity {
  id: string;
  project_id: string;
  type: string;
  channel: string;
  source: string;
  /** The thread. */
  url: string;
  title: string;
  /** Why it fits the app. */
  why: string;
  /** A suggested first reply; it never names the app. */
  draft: string;
  leverage: number;
  status: string;
  /** Tagged link to use if a reply asks for the app. */
  link: string;
  reply_url: string | null;
  thread_at: string | null;
  expires_at: string | null;
  decided_at: string | null;
}

export interface OpportunityList {
  data: Opportunity[];
}

export interface OpportunityMark {
  id: string;
  status: OpportunityStatus;
}

export interface ApiErrorBody {
  error: { code: string; fields?: Record<string, string>; message?: string };
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
