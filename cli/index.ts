#!/usr/bin/env bun
// Shipyard CLI entry point. Routes the first positional to a command and maps
// known error types to exit codes (2 = usage, 1 = API/runtime). `run()` is
// exported (and only auto-executes as the real entry) so tests can call it.
import { ShipyardApiError } from './client.ts';
import { UsageError } from './shared.ts';
import { print, errLine } from './output.ts';
import { login, logout, whoami } from './commands/auth.ts';
import { projectsCommand } from './commands/projects.ts';
import { reviewsCommand } from './commands/reviews.ts';
import { walletCommand } from './commands/wallet.ts';
import { like, unlike } from './commands/social.ts';
import { skillsCommand } from './commands/skills.ts';

export const VERSION = '0.3.0';

function topHelp(): void {
  print(
    [
      'shipyard — post & manage your Shipyard projects from the terminal',
      '',
      'Usage: shipyard <command> [options]',
      '',
      'Account:',
      '  login        Authenticate with an API key (saved to ~/.config/shipyard)',
      '  logout       Remove the stored API key',
      '  whoami       Show the authenticated account',
      '',
      'Projects:',
      '  projects     Create, list, get, update, delete projects (+ images)',
      '  reviews      List / post reviews (comments) on projects',
      '  like         Upvote a project          unlike  Remove your upvote',
      '',
      'Money & agents:',
      '  wallet       Show credit balance; load credit to fund review bounties',
      '  skills       Install the Shipyard skill for Claude Code / Cursor / AGENTS.md',
      '',
      'Global flags:',
      '  --json           Machine-readable JSON output',
      '  --api-url URL    API base URL (or $SHIPYARD_URL; default https://goshipyard.app)',
      '  --api-key KEY    API key (or $SHIPYARD_API_KEY)',
      '  -h, --help       Show help        --version  Show version',
      '',
      'Examples:',
      '  shipyard login',
      '  shipyard projects create -t Foglight -p "Maps for makers" -u https://foglight.app -c devtools',
      '  shipyard projects list --mine --json | jq .data',
      '  shipyard reviews list <id>          shipyard like <id>',
      '  shipyard wallet                     shipyard skills install',
    ].join('\n'),
  );
}

export async function run(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  if (cmd === '--version' || cmd === '-v') {
    print(VERSION);
    return 0;
  }
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    topHelp();
    return 0;
  }
  switch (cmd) {
    case 'login':
      await login(rest);
      return 0;
    case 'logout':
      await logout(rest);
      return 0;
    case 'whoami':
    case 'me':
      await whoami(rest);
      return 0;
    case 'projects':
    case 'p':
      await projectsCommand(rest);
      return 0;
    case 'reviews':
    case 'review':
      await reviewsCommand(rest);
      return 0;
    case 'like':
    case 'upvote':
      await like(rest);
      return 0;
    case 'unlike':
    case 'unupvote':
      await unlike(rest);
      return 0;
    case 'wallet':
    case 'balance':
      await walletCommand(rest);
      return 0;
    case 'skills':
    case 'skill':
      await skillsCommand(rest);
      return 0;
    default:
      throw new UsageError(`Unknown command: ${cmd}. Run \`shipyard help\` for usage.`);
  }
}

if (import.meta.main) {
  run(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((e) => {
      if (e instanceof UsageError) {
        errLine(e.message);
        process.exit(2);
      }
      errLine(`✗ ${e instanceof ShipyardApiError ? e.message : (e as Error).message}`);
      process.exit(1);
    });
}
