import { expect, test } from 'bun:test';
import { run, VERSION } from './index.ts';
import { UsageError } from './shared.ts';
import pkg from '../package.json';

test('the version matches the package', () => {
  expect(VERSION).toBe(pkg.version);
});

test('what ended with v1 says so instead of calling the API', async () => {
  for (const argv of [
    ['wallet'],
    ['balance'],
    ['reviews', 'add', 'p1', '-b', 'x'],
    ['reviews', 'mine'],
  ]) {
    const failure = await run(argv).then(
      () => null,
      (e: unknown) => e,
    );
    expect(failure).toBeInstanceOf(UsageError);
    expect((failure as Error).message).toContain('ended with Shipyard v1');
  }
});

test('the board refuses a status or view it does not know before calling the API', async () => {
  const key = ['--api-key', 'sk_live_' + 'a'.repeat(32), '--api-url', 'https://fixture.invalid'];
  await expect(run(['opportunities', 'mark', 'o1', 'done', ...key])).rejects.toThrow(
    'Status must be',
  );
  await expect(run(['opportunities', 'list', 'p1', '--view', 'all', ...key])).rejects.toThrow(
    '--view',
  );
  await expect(
    run(['opportunities', 'mark', 'o1', 'dismissed', '--reply-url', 'https://x.test', ...key]),
  ).rejects.toThrow('--reply-url only goes with');
});
