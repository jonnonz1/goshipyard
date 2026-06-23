// Shared argument parsing + auth wiring for commands.
//
// Every command merges GLOBAL_OPTIONS into its own option spec and parses with
// node:util parseArgs. Parse failures (unknown flags, missing values) surface as
// a UsageError → exit code 2.
import { parseArgs } from 'node:util';
import { resolveAuth } from './config.ts';
import { ShipyardClient } from './client.ts';

// Thrown for bad invocation (unknown flag, missing arg, not logged in). The entry
// point maps it to exit code 2 and prints the message to stderr.
export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

type OptionSpec = NonNullable<Parameters<typeof parseArgs>[0]>['options'];

// Global flags accepted on every command. `--api-url` (not `--url`) overrides the
// API base URL, leaving `--url` free for a project's link in create/update.
export const GLOBAL_OPTIONS = {
  json: { type: 'boolean' },
  'api-url': { type: 'string' },
  'api-key': { type: 'string' },
  help: { type: 'boolean', short: 'h' },
} as const satisfies OptionSpec;

export type Values = Record<string, string | boolean | string[] | undefined>;

export function parse(
  args: string[],
  options: OptionSpec = {},
): { values: Values; positionals: string[] } {
  try {
    const parsed = parseArgs({
      args,
      options: { ...GLOBAL_OPTIONS, ...options },
      allowPositionals: true,
      strict: true,
    });
    return { values: parsed.values as Values, positionals: parsed.positionals };
  } catch (e) {
    throw new UsageError((e as Error).message);
  }
}

export function str(v: Values[string]): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export function num(v: Values[string]): number | undefined {
  if (typeof v !== 'string') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function authFromValues(values: Values) {
  return resolveAuth({ apiUrl: str(values['api-url']), apiKey: str(values['api-key']) });
}

// A client that may be unauthenticated (used by `login` before a key exists).
export function clientFrom(values: Values): {
  client: ShipyardClient;
  baseUrl: string;
  apiKey?: string;
} {
  const { baseUrl, apiKey } = authFromValues(values);
  return { client: new ShipyardClient({ baseUrl, apiKey }), baseUrl, apiKey };
}

// A client that must be authenticated, else a friendly UsageError.
export function requireAuth(values: Values): ShipyardClient {
  const { baseUrl, apiKey } = authFromValues(values);
  if (!apiKey) {
    throw new UsageError('Not authenticated — run `shipyard login` first (or pass --api-key).');
  }
  return new ShipyardClient({ baseUrl, apiKey });
}
