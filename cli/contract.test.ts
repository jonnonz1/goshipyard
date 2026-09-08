import { expect, test } from 'bun:test';
import spec from '../openapi.json';
import { assertCliContract } from './contract.ts';
import { ShipyardClient } from './client.ts';

test('CLI-required operations and review provenance match the checked-in API contract', () => {
  expect(() => assertCliContract(spec)).not.toThrow();
});

test('missing operations or incompatible provenance fail the contract gate', () => {
  const missing = structuredClone(spec) as any;
  delete missing.paths['/api/v1/projects/{id}'].patch;
  expect(() => assertCliContract(missing)).toThrow('PATCH');
  const old = structuredClone(spec) as any;
  old.components.schemas.Review.required = ['id'];
  expect(() => assertCliContract(old)).toThrow('reviewer_is_seed');
  const broken = structuredClone(spec) as any;
  broken.components.schemas.Review.properties.reviewer_is_seed.type = 'string';
  expect(() => assertCliContract(broken)).toThrow('boolean');
  expect(() => assertCliContract(null)).toThrow();
});

test('client JSON preserves provenance on review lists, mine and creation', async () => {
  const review = { id: 'r1', reviewer_is_seed: true, review_source: 'automated' };
  const client = new ShipyardClient({
    baseUrl: 'https://fixture.invalid',
    fetch: (req) => Response.json(req.method === 'POST' ? review : { data: [review] }),
  });
  expect((await client.listReviews('p1')).data[0]).toMatchObject(review);
  expect((await client.myReviews()).data[0]).toMatchObject(review);
  expect(await client.createReview('p1', 'An approved fixture review.')).toMatchObject(review);
});
