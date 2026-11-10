/** Validate the public API surface used by this CLI without an authenticated write. */
export function assertCliContract(value: unknown): void {
  const spec = value as {
    paths?: Record<string, Record<string, unknown>>;
    components?: {
      schemas?: {
        Reaction?: {
          required?: string[];
          properties?: Record<string, { type?: string; enum?: string[] }>;
        };
      };
    };
  } | null;
  const operations: Record<string, string[]> = {
    '/api/v1/me': ['get'],
    '/api/v1/me/projects': ['get'],
    '/api/v1/projects': ['get', 'post'],
    '/api/v1/projects/{id}': ['get', 'patch', 'delete'],
    '/api/v1/users/{handle}/projects': ['get'],
    '/api/v1/projects/{id}/images': ['put'],
    '/api/v1/projects/{id}/images/{ordinal}': ['delete'],
    '/api/v1/projects/{id}/reviews': ['get'],
    '/api/v1/projects/{id}/upvote': ['post', 'delete'],
    '/api/v1/projects/{id}/opportunities': ['get'],
    '/api/v1/opportunities/{id}/status': ['post'],
  };
  for (const [path, methods] of Object.entries(operations)) {
    for (const method of methods) {
      if (!spec?.paths?.[path]?.[method])
        throw new Error(`API contract missing ${method.toUpperCase()} ${path}`);
    }
  }
  const reaction = spec?.components?.schemas?.Reaction;
  for (const field of ['reviewer_is_seed', 'review_source']) {
    if (!reaction?.required?.includes(field)) throw new Error(`API Reaction must require ${field}`);
  }
  if (reaction?.properties?.reviewer_is_seed?.type !== 'boolean') {
    throw new Error('API reviewer_is_seed must be boolean');
  }
  const source = reaction?.properties?.review_source;
  if (source?.type !== 'string' || !['seeded', 'member'].every((s) => source.enum?.includes(s))) {
    throw new Error('API review_source must describe seeded and member provenance');
  }
}
