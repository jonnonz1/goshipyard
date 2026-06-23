import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadConfig,
  saveConfig,
  clearApiKey,
  resolveAuth,
  configPath,
  DEFAULT_API_URL,
} from './config.ts';

let dir: string;
const ENV_KEYS = ['XDG_CONFIG_HOME', 'SHIPYARD_URL', 'SHIPYARD_API_KEY'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  dir = mkdtempSync(join(tmpdir(), 'sy-cli-cfg-'));
  process.env.XDG_CONFIG_HOME = dir;
  delete process.env.SHIPYARD_URL;
  delete process.env.SHIPYARD_API_KEY;
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('config', () => {
  test('defaults when nothing is set', () => {
    expect(loadConfig()).toEqual({});
    expect(resolveAuth()).toEqual({ baseUrl: DEFAULT_API_URL, apiKey: undefined });
  });

  test('save round-trips and writes the file 0600', () => {
    saveConfig({ apiKey: 'sk_live_x', apiUrl: 'http://localhost:3000' });
    expect(loadConfig()).toEqual({ apiKey: 'sk_live_x', apiUrl: 'http://localhost:3000' });
    expect(statSync(configPath()).mode & 0o777).toBe(0o600);
    expect(resolveAuth()).toEqual({ baseUrl: 'http://localhost:3000', apiKey: 'sk_live_x' });
  });

  test('precedence: flag > env > file', () => {
    saveConfig({ apiKey: 'from_file', apiUrl: 'http://file' });
    process.env.SHIPYARD_API_KEY = 'from_env';
    process.env.SHIPYARD_URL = 'http://env';
    expect(resolveAuth({ apiKey: 'from_flag', apiUrl: 'http://flag' })).toEqual({
      baseUrl: 'http://flag',
      apiKey: 'from_flag',
    });
    expect(resolveAuth()).toEqual({ baseUrl: 'http://env', apiKey: 'from_env' });
    delete process.env.SHIPYARD_API_KEY;
    delete process.env.SHIPYARD_URL;
    expect(resolveAuth()).toEqual({ baseUrl: 'http://file', apiKey: 'from_file' });
  });

  test('trailing slashes are stripped from the base URL', () => {
    expect(resolveAuth({ apiUrl: 'http://x:3000///' }).baseUrl).toBe('http://x:3000');
  });

  test('clearApiKey drops the key but keeps the url', () => {
    saveConfig({ apiKey: 'sk_live_x', apiUrl: 'http://localhost:3000' });
    clearApiKey();
    expect(loadConfig()).toEqual({ apiUrl: 'http://localhost:3000' });
  });
});
