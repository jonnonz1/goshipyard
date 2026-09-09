import { parseArgs } from 'node:util';
import { assertCliContract } from '../cli/contract.ts';

// PR checks use the deterministic snapshot. A release additionally checks the
// deployed unauthenticated schema; never send an API key or mutate a project.
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: { url: { type: 'string' } },
  strict: true,
});
let contract: unknown;
if (values.url) {
  const url = new URL(values.url);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Contract URL must be HTTP(S) without credentials');
  }
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Cannot check deployed API contract: HTTP ${response.status}`);
  contract = await response.json();
} else {
  contract = await Bun.file(new URL('../openapi.json', import.meta.url)).json();
}
assertCliContract(contract);
console.log('CLI API contract passed (' + (values.url ?? 'checked-in snapshot') + ')');
