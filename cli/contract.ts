/** Validate the public API surface used by this CLI without an authenticated write. */
export function assertCliContract(value: unknown): void {
  const spec = value as {
    paths?: Record<string, Record<string, unknown>>;
    components?: {
      schemas?: {
        Review?: {
          required?: string[];
          properties?: Record<string, { type?: string; enum?: string[] }>;
        };
      };
    };
  } | null;
  const operations: Record<string, string[]> = {
    '/api/v1/me': ['get'],
    '/api/v1/me/projects': ['get'],
    '/api/v1/me/reviews': ['get'],
    '/api/v1/me/wallet': ['get'],
    '/api/v1/projects': ['get', 'post'],
    '/api/v1/projects/{id}': ['get', 'patch', 'delete'],
    '/api/v1/users/{handle}/projects': ['get'],
    '/api/v1/projects/{id}/images': ['put'],
    '/api/v1/projects/{id}/images/{ordinal}': ['delete'],
    '/api/v1/projects/{id}/reviews': ['get', 'post'],
    '/api/v1/projects/{id}/upvote': ['post', 'delete'],
  };
  for (const [path, methods] of Object.entries(operations)) {
    for (const method of methods) {
      if (!spec?.paths?.[path]?.[method])
        throw new Error(`API contract missing ${method.toUpperCase()} ${path}`);
    }
  }
  const review = spec?.components?.schemas?.Review;
  for (const field of ['reviewer_is_seed', 'review_source']) {
    if (!review?.required?.includes(field)) throw new Error(`API Review must require ${field}`);
  }
  if (review?.properties?.reviewer_is_seed?.type !== 'boolean') {
    throw new Error('API reviewer_is_seed must be boolean');
  }
  const source = review?.properties?.review_source;
  if (
    source?.type !== 'string' ||
    !['automated', 'seeded', 'member'].every((s) => source.enum?.includes(s))
  ) {
    throw new Error('API review_source must describe automated, seeded and member provenance');
  }
}
