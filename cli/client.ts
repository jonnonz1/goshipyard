// Thin typed client over the Shipyard public API (/api/v1).
//
// `fetch` is injectable so tests can drive the client against an in-process Hono
// app (registerPublicApi) with no network or running server. Non-2xx responses
// are turned into a ShipyardApiError carrying the server's `errors.api.*` code,
// with a human-readable message for the CLI to print.
import type {
  ApiErrorBody,
  CreateProjectInput,
  ListParams,
  MeUser,
  OpportunityList,
  OpportunityMark,
  OpportunityStatus,
  OpportunityView,
  Project,
  ProjectList,
  ReactionList,
  UpdateProjectInput,
  VoteResult,
} from './types.ts';

export type FetchLike = (input: Request) => Promise<Response> | Response;

const MESSAGES: Record<string, string> = {
  'errors.api.unauthenticated': 'Not authenticated — run `shipyard login` (or pass --api-key).',
  'errors.api.forbidden': "You don't own that project.",
  'errors.api.not_found': 'Not found.',
  'errors.api.slug_taken': 'That slug is already taken — choose another with --slug.',
  'errors.api.subscription_required':
    'The board needs a subscription — see https://goshipyard.app/billing.',
  'errors.api.retired': 'That ended with Shipyard v1 and is no longer available.',
  'errors.api.invalid_body': 'Shipyard refused that',
  'errors.api.unsupported_media_type': 'Images must be sent as multipart/form-data.',
  'errors.api.rate_limited': 'Rate limited — wait a moment and try again.',
};

function humanMessage(
  status: number,
  code: string,
  fields?: Record<string, string>,
  message?: string,
): string {
  const base = MESSAGES[code] || message || `API error (${status} ${code})`;
  const detail =
    fields && Object.keys(fields).length
      ? ' (' +
        Object.entries(fields)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ') +
        ')'
      : '';
  return base + detail;
}

export class ShipyardApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  constructor(status: number, code: string, fields?: Record<string, string>, message?: string) {
    super(humanMessage(status, code, fields, message));
    this.name = 'ShipyardApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export interface ClientOpts {
  baseUrl: string;
  apiKey?: string;
  fetch?: FetchLike;
}

type QueryValue = string | number | undefined;

export class ShipyardClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: FetchLike;

  constructor(opts: ClientOpts) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetch ?? ((req) => fetch(req));
  }

  private async request<T>(
    method: string,
    path: string,
    opts: { query?: Record<string, QueryValue>; json?: unknown; form?: FormData } = {},
  ): Promise<T> {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
    const headers: Record<string, string> = { accept: 'application/json' };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    let body: BodyInit | undefined;
    if (opts.form) {
      body = opts.form; // let fetch set multipart content-type + boundary
    } else if (opts.json !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(opts.json);
    }

    const res = await this.fetchImpl(new Request(url, { method, headers, body }));
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    const data = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const err = data as ApiErrorBody | undefined;
      throw new ShipyardApiError(
        res.status,
        err?.error?.code ?? 'errors.api.unknown',
        err?.error?.fields,
        err?.error?.message,
      );
    }
    return data as T;
  }

  me(): Promise<MeUser> {
    return this.request('GET', '/api/v1/me');
  }

  listProjects(p: ListParams = {}): Promise<ProjectList> {
    return this.request('GET', '/api/v1/projects', {
      query: { sort: p.sort, q: p.q, category: p.category, limit: p.limit, offset: p.offset },
    });
  }

  listMine(p: ListParams = {}): Promise<ProjectList> {
    return this.request('GET', '/api/v1/me/projects', {
      query: { limit: p.limit, offset: p.offset },
    });
  }

  listUser(handle: string, p: ListParams = {}): Promise<ProjectList> {
    return this.request('GET', `/api/v1/users/${encodeURIComponent(handle)}/projects`, {
      query: { limit: p.limit, offset: p.offset },
    });
  }

  getProject(id: string): Promise<Project> {
    return this.request('GET', `/api/v1/projects/${encodeURIComponent(id)}`);
  }

  createProject(body: CreateProjectInput): Promise<Project> {
    return this.request('POST', '/api/v1/projects', { json: body });
  }

  createProjectForm(form: FormData): Promise<Project> {
    return this.request('POST', '/api/v1/projects', { form });
  }

  updateProject(id: string, patch: UpdateProjectInput): Promise<Project> {
    return this.request('PATCH', `/api/v1/projects/${encodeURIComponent(id)}`, { json: patch });
  }

  // A take-down: the server answers 204 and an owner can put the listing back on the site.
  deleteProject(id: string): Promise<void> {
    return this.request('DELETE', `/api/v1/projects/${encodeURIComponent(id)}`);
  }

  setImages(id: string, form: FormData): Promise<Project> {
    return this.request('PUT', `/api/v1/projects/${encodeURIComponent(id)}/images`, { form });
  }

  removeImage(id: string, ordinal: number): Promise<Project> {
    return this.request('DELETE', `/api/v1/projects/${encodeURIComponent(id)}/images/${ordinal}`);
  }

  // --- reactions -----------------------------------------------------------

  // The path keeps v1's name: reactions are what the API used to call reviews.
  listReactions(id: string, p: ListParams = {}): Promise<ReactionList> {
    return this.request('GET', `/api/v1/projects/${encodeURIComponent(id)}/reviews`, {
      query: { limit: p.limit, offset: p.offset },
    });
  }

  // --- upvotes ("likes") ----------------------------------------------------

  upvote(id: string): Promise<VoteResult> {
    return this.request('POST', `/api/v1/projects/${encodeURIComponent(id)}/upvote`);
  }

  removeUpvote(id: string): Promise<VoteResult> {
    return this.request('DELETE', `/api/v1/projects/${encodeURIComponent(id)}/upvote`);
  }

  // --- the board -----------------------------------------------------------

  listOpportunities(id: string, view?: OpportunityView): Promise<OpportunityList> {
    return this.request('GET', `/api/v1/projects/${encodeURIComponent(id)}/opportunities`, {
      query: { view },
    });
  }

  markOpportunity(
    id: string,
    status: OpportunityStatus,
    replyUrl?: string,
  ): Promise<OpportunityMark> {
    return this.request('POST', `/api/v1/opportunities/${encodeURIComponent(id)}/status`, {
      json: replyUrl ? { status, reply_url: replyUrl } : { status },
    });
  }
}
