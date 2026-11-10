import { describe, expect, test } from 'bun:test';
import { ShipyardClient, ShipyardApiError, type FetchLike } from './client.ts';

// A fetch stub that records every request and returns a scripted JSON response.
// Lets us assert the client builds correct URLs/headers/bodies and parses + maps
// responses — without a network or a running server (that path is integration-
// tested in the main Shipyard repo, in-process against the real API).
function stub(handler: (req: Request) => { status?: number; body?: unknown }) {
  const calls: Request[] = [];
  const fetch: FetchLike = (req) => {
    calls.push(req);
    const { status = 200, body } = handler(req);
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
  return { fetch, calls };
}

function client(fetch: FetchLike, apiKey = 'sk_live_' + 'a'.repeat(32)) {
  return new ShipyardClient({ baseUrl: 'https://api.test/', apiKey, fetch });
}

describe('request building', () => {
  test('sends the bearer token and accept header', async () => {
    const s = stub(() => ({ body: { handle: 'jo' } }));
    await client(s.fetch, 'sk_live_secret').me();
    const req = s.calls[0]!;
    expect(req.headers.get('authorization')).toBe('Bearer sk_live_secret');
    expect(req.headers.get('accept')).toBe('application/json');
    expect(req.url).toBe('https://api.test/api/v1/me');
  });

  test('encodes list params as query string, skipping undefined', async () => {
    const s = stub(() => ({ body: { data: [], pagination: {} } }));
    await client(s.fetch).listProjects({ sort: 'top', q: 'maps', limit: 5 });
    const url = new URL(s.calls[0]!.url);
    expect(url.pathname).toBe('/api/v1/projects');
    expect(url.searchParams.get('sort')).toBe('top');
    expect(url.searchParams.get('q')).toBe('maps');
    expect(url.searchParams.get('limit')).toBe('5');
    expect(url.searchParams.has('offset')).toBe(false); // undefined dropped
  });

  test('createProject POSTs a JSON body', async () => {
    const s = stub(() => ({ status: 201, body: { id: 'p1', slug: 'foglight' } }));
    const p = await client(s.fetch).createProject({
      title: 'Foglight',
      pitch: 'Maps',
      url: 'https://foglight.app',
    });
    expect(p.slug).toBe('foglight');
    const req = s.calls[0]!;
    expect(req.method).toBe('POST');
    expect(req.headers.get('content-type')).toBe('application/json');
    expect(await req.json()).toEqual({
      title: 'Foglight',
      pitch: 'Maps',
      url: 'https://foglight.app',
    });
  });

  test('listReactions reads the reviews path, which keeps its v1 name', async () => {
    const s = stub(() => ({ body: { data: [], pagination: {} } }));
    await client(s.fetch).listReactions('p1', { limit: 5 });
    const url = new URL(s.calls[0]!.url);
    expect(s.calls[0]!.method).toBe('GET');
    expect(url.pathname).toBe('/api/v1/projects/p1/reviews');
    expect(url.searchParams.get('limit')).toBe('5');
  });

  test('upvote / removeUpvote use POST / DELETE', async () => {
    const s = stub(() => ({ body: { id: 'p1', upvotes: 1, voted: true } }));
    await client(s.fetch).upvote('p1');
    await client(s.fetch).removeUpvote('p1');
    expect(s.calls[0]!.method).toBe('POST');
    expect(s.calls[1]!.method).toBe('DELETE');
    expect(new URL(s.calls[0]!.url).pathname).toBe('/api/v1/projects/p1/upvote');
  });

  test('listOpportunities asks for a view only when given one', async () => {
    const s = stub(() => ({ body: { data: [] } }));
    await client(s.fetch).listOpportunities('p1');
    await client(s.fetch).listOpportunities('p1', 'posted');
    expect(new URL(s.calls[0]!.url).pathname).toBe('/api/v1/projects/p1/opportunities');
    expect(new URL(s.calls[0]!.url).searchParams.has('view')).toBe(false);
    expect(new URL(s.calls[1]!.url).searchParams.get('view')).toBe('posted');
  });

  test('markOpportunity posts the status, with the reply link when there is one', async () => {
    const s = stub(() => ({ body: { id: 'o1', status: 'posted' } }));
    await client(s.fetch).markOpportunity('o1', 'posted', 'https://news.ycombinator.com/item?id=1');
    await client(s.fetch).markOpportunity('o1', 'dismissed');
    expect(s.calls[0]!.method).toBe('POST');
    expect(new URL(s.calls[0]!.url).pathname).toBe('/api/v1/opportunities/o1/status');
    expect(await s.calls[0]!.json()).toEqual({
      status: 'posted',
      reply_url: 'https://news.ycombinator.com/item?id=1',
    });
    expect(await s.calls[1]!.json()).toEqual({ status: 'dismissed' });
  });

  test('path ids are URL-encoded', async () => {
    const s = stub(() => ({ body: {} }));
    await client(s.fetch).getProject('a/b?c');
    expect(new URL(s.calls[0]!.url).pathname).toBe('/api/v1/projects/a%2Fb%3Fc');
  });
});

describe('error handling', () => {
  test('non-2xx → ShipyardApiError carrying the server code', async () => {
    const s = stub(() => ({
      status: 401,
      body: { error: { code: 'errors.api.unauthenticated' } },
    }));
    try {
      await client(s.fetch, undefined).me();
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ShipyardApiError);
      const err = e as ShipyardApiError;
      expect(err.status).toBe(401);
      expect(err.code).toBe('errors.api.unauthenticated');
      expect(err.message).toContain('shipyard login');
    }
  });

  test('maps known codes + appends field detail; unknown falls back', () => {
    expect(new ShipyardApiError(403, 'errors.api.forbidden').message).toBe(
      "You don't own that project.",
    );
    expect(new ShipyardApiError(402, 'errors.api.subscription_required').message).toContain(
      'needs a subscription',
    );
    expect(new ShipyardApiError(410, 'errors.api.retired').message).toContain('ended with');
    expect(
      new ShipyardApiError(422, 'errors.api.other', undefined, 'Said by the server').message,
    ).toBe('Said by the server');
    expect(
      new ShipyardApiError(422, 'errors.api.invalid_url', { url: 'must be http(s)' }).message,
    ).toContain('url: must be http(s)');
    expect(new ShipyardApiError(500, 'errors.api.unknown').message).toBe(
      'API error (500 errors.api.unknown)',
    );
  });

  test('204 No Content resolves without a body', async () => {
    const s = stub(() => ({ status: 204 }));
    const res = await client(s.fetch).removeUpvote('p1');
    expect(res).toBeUndefined();
  });
});
