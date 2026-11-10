import { expect, test } from 'bun:test';
import spec from '../openapi.json';
import { assertCliContract } from './contract.ts';
import { ShipyardClient } from './client.ts';

test('CLI-required operations and reaction provenance match the checked-in API contract', () => {
  expect(() => assertCliContract(spec)).not.toThrow();
});

test('missing operations or incompatible provenance fail the contract gate', () => {
  const missing = structuredClone(spec) as any;
  delete missing.paths['/api/v1/projects/{id}'].patch;
  expect(() => assertCliContract(missing)).toThrow('PATCH');
  const noBoard = structuredClone(spec) as any;
  delete noBoard.paths['/api/v1/opportunities/{id}/status'];
  expect(() => assertCliContract(noBoard)).toThrow('/api/v1/opportunities/{id}/status');
  const old = structuredClone(spec) as any;
  old.components.schemas.Reaction.required = ['id'];
  expect(() => assertCliContract(old)).toThrow('reviewer_is_seed');
  const broken = structuredClone(spec) as any;
  broken.components.schemas.Reaction.properties.reviewer_is_seed.type = 'string';
  expect(() => assertCliContract(broken)).toThrow('boolean');
  expect(() => assertCliContract(null)).toThrow();
});

test('the checked-in contract no longer has what ended with v1', () => {
  const paths = (spec as { paths: Record<string, Record<string, unknown>> }).paths;
  expect(paths['/api/v1/me/wallet']).toBeUndefined();
  expect(paths['/api/v1/me/reviews']).toBeUndefined();
  expect(paths['/api/v1/projects/{id}/reviews']!.post).toBeUndefined();
});

test('client JSON preserves provenance on reaction lists', async () => {
  const reaction = { id: 'r1', reviewer_is_seed: true, review_source: 'seeded' };
  const client = new ShipyardClient({
    baseUrl: 'https://fixture.invalid',
    fetch: () => Response.json({ data: [reaction] }),
  });
  expect((await client.listReactions('p1')).data[0]).toMatchObject(reaction);
});
