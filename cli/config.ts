// Persisted CLI config + auth resolution.
//
// The API key is a secret, so the file is written 0600 under a 0700 dir. Values
// resolve flag › env › file › default, so a stored login is a convenience that
// env vars and flags can always override (handy for CI and multi-server use).
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';

export const DEFAULT_API_URL = 'https://goshipyard.app';

export interface CliConfig {
  apiKey?: string;
  apiUrl?: string;
}

export function configDir(): string {
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(base, 'shipyard');
}

export function configPath(): string {
  return join(configDir(), 'config.json');
}

export function loadConfig(): CliConfig {
  try {
    const parsed = JSON.parse(readFileSync(configPath(), 'utf8'));
    if (parsed && typeof parsed === 'object') return parsed as CliConfig;
  } catch {
    // missing or unparseable → behave as if empty
  }
  return {};
}

// Merge `patch` over the existing config and persist it (0700 dir, 0600 file).
function writeConfig(next: CliConfig): CliConfig {
  mkdirSync(configDir(), { recursive: true, mode: 0o700 });
  for (const k of Object.keys(next) as (keyof CliConfig)[]) {
    if (next[k] === undefined) delete next[k];
  }
  writeFileSync(configPath(), JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
  chmodSync(configPath(), 0o600); // enforce perms even if the file pre-existed
  return next;
}

export function saveConfig(patch: CliConfig): CliConfig {
  return writeConfig({ ...loadConfig(), ...patch });
}

export function clearApiKey(): void {
  const cfg = loadConfig();
  delete cfg.apiKey;
  writeConfig(cfg);
}

export interface AuthFlags {
  apiUrl?: string;
  apiKey?: string;
}

export interface ResolvedAuth {
  baseUrl: string;
  apiKey?: string;
}

export function resolveAuth(flags: AuthFlags = {}): ResolvedAuth {
  const cfg = loadConfig();
  const baseUrl = (
    flags.apiUrl ||
    process.env.SHIPYARD_URL ||
    cfg.apiUrl ||
    DEFAULT_API_URL
  ).replace(/\/+$/, '');
  const apiKey = flags.apiKey || process.env.SHIPYARD_API_KEY || cfg.apiKey;
  return { baseUrl, apiKey };
}
