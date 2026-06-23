// auth commands: login / logout / whoami
import { parse, clientFrom, requireAuth, str, UsageError } from '../shared.ts';
import { ShipyardClient, ShipyardApiError } from '../client.ts';
import { saveConfig, clearApiKey, configPath } from '../config.ts';
import { print, printJson, info } from '../output.ts';
import { readSecret } from '../prompt.ts';

export async function login(argv: string[]): Promise<void> {
  const { values } = parse(argv);
  if (values.help) return loginHelp();

  const { baseUrl } = clientFrom(values); // resolves the base URL; key may be absent
  let apiKey = str(values['api-key']);
  if (!apiKey) {
    info(`Create an API key at ${baseUrl}/settings (API keys), then paste it below.`);
    apiKey = await readSecret('API key: ');
  }
  if (!apiKey) throw new UsageError('No API key provided.');

  const client = new ShipyardClient({ baseUrl, apiKey });
  let me;
  try {
    me = await client.me();
  } catch (e) {
    if (e instanceof ShipyardApiError && e.status === 401) {
      throw new UsageError('That key was rejected — check the key and --api-url.');
    }
    throw e;
  }

  saveConfig({ apiKey, apiUrl: baseUrl });
  if (values.json) return printJson({ logged_in: true, handle: me.handle, api_url: baseUrl });
  info(`✓ Logged in as @${me.handle} — saved to ${configPath()}`);
}

export async function logout(argv: string[]): Promise<void> {
  const { values } = parse(argv);
  if (values.help) return print('Usage: shipyard logout');
  clearApiKey();
  if (values.json) return printJson({ logged_out: true });
  info('✓ Logged out (removed stored API key).');
}

export async function whoami(argv: string[]): Promise<void> {
  const { values } = parse(argv);
  if (values.help) return print('Usage: shipyard whoami');
  const me = await requireAuth(values).me();
  if (values.json) return printJson(me);
  const tags = [me.is_admin ? 'admin' : '', me.is_reviewer ? 'reviewer' : ''].filter(Boolean);
  print(`@${me.handle}  <${me.email}>${tags.length ? '  [' + tags.join(', ') + ']' : ''}`);
}

function loginHelp(): void {
  print(
    [
      'Usage: shipyard login [--api-url URL] [--api-key KEY]',
      '',
      "  Authenticate the CLI with a personal API key. Without --api-key you'll be",
      '  prompted to paste one (create it at <api-url>/settings → API keys). The key',
      '  is validated against the server and saved to ~/.config/shipyard/config.json.',
      '',
      '  Until the v2 cutover, point at your server, e.g.:',
      '    shipyard login --api-url http://localhost:3000',
    ].join('\n'),
  );
}
