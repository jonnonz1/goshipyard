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

  test('createReview hits the reviews endpoint with the body', async () => {
    const s = stub(() => ({ status: 201, body: { id: 'r1', reviewer_handle: 'jo' } }));
    await client(s.fetch).createReview('p1', 'a sufficiently long and honest review');
    const req = s.calls[0]!;
    expect(req.method).toBe('POST');
    expect(new URL(req.url).pathname).toBe('/api/v1/projects/p1/reviews');
    expect(await req.json()).toEqual({ body: 'a sufficiently long and honest review' });
  });

  test('upvote / removeUpvote use POST / DELETE', async () => {
    const s = stub(() => ({ body: { id: 'p1', upvotes: 1, voted: true } }));
    await client(s.fetch).upvote('p1');
    await client(s.fetch).removeUpvote('p1');
    expect(s.calls[0]!.method).toBe('POST');
    expect(s.calls[1]!.method).toBe('DELETE');
    expect(new URL(s.calls[0]!.url).pathname).toBe('/api/v1/projects/p1/upvote');
  });

  test('wallet reads /me/wallet', async () => {
    const s = stub(() => ({
      body: { balance_cents: 0, balance: '$0.00', currency: 'usd', topup_url: 'x', recent: [] },
    }));
    const w = await client(s.fetch).wallet();
    expect(w.balance).toBe('$0.00');
    expect(new URL(s.calls[0]!.url).pathname).toBe('/api/v1/me/wallet');
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
    expect(new ShipyardApiError(422, 'errors.api.review_too_short').message).toContain(
      'at least 20 characters',
    );
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
