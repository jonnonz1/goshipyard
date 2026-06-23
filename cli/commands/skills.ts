// skills commands: install / print / path
//
// Drops the Shipyard agent skill into the right place so a coding agent (Claude
// Code, Cursor, or anything that reads AGENTS.md) discovers the CLI on its own.
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { parse, str, UsageError, type Values } from '../shared.ts';
import { print, printJson, info } from '../output.ts';
import { CLAUDE_SKILL, CURSOR_RULE, AGENTS_SECTION, upsertSection } from '../skills.ts';

type TargetKey = 'claude' | 'cursor' | 'agents';

export async function skillsCommand(argv: string[]): Promise<void> {
  const verb = argv[0];
  switch (verb) {
    case 'install':
      return install(argv.slice(1));
    case 'print':
    case 'cat':
      return printContent(argv.slice(1));
    case 'path':
    case 'paths':
      return showPaths(argv.slice(1));
    case undefined:
    case 'help':
      return skillsHelp();
    default:
      throw new UsageError(`Unknown skills command: ${verb}. Try \`shipyard skills help\`.`);
  }
}

// Resolve the destination file for a target, honouring --project and --dir.
function destFor(target: TargetKey, values: Values): string {
  const dir = str(values.dir);
  const cwd = process.cwd();
  if (target === 'claude') {
    const root =
      dir ??
      (values.project ? join(cwd, '.claude', 'skills') : join(homedir(), '.claude', 'skills'));
    return join(root, 'shipyard', 'SKILL.md');
  }
  if (target === 'cursor') {
    return dir ? join(dir, 'shipyard.mdc') : join(cwd, '.cursor', 'rules', 'shipyard.mdc');
  }
  return dir ? join(dir, 'AGENTS.md') : join(cwd, 'AGENTS.md');
}

function contentFor(target: TargetKey): string {
  return target === 'claude' ? CLAUDE_SKILL : target === 'cursor' ? CURSOR_RULE : AGENTS_SECTION;
}

interface Result {
  target: TargetKey;
  path: string;
  status: 'written' | 'updated' | 'skipped';
}

function installOne(target: TargetKey, values: Values): Result {
  const path = destFor(target, values);
  mkdirSync(join(path, '..'), { recursive: true });
  const existed = existsSync(path);

  if (target === 'agents') {
    // Merge into any existing AGENTS.md rather than clobbering it.
    const existing = existed ? readFileSync(path, 'utf8') : '';
    writeFileSync(path, upsertSection(existing, AGENTS_SECTION));
    return { target, path, status: existing.trim() ? 'updated' : 'written' };
  }

  if (existed && !values.force) return { target, path, status: 'skipped' };
  writeFileSync(path, contentFor(target));
  return { target, path, status: existed ? 'updated' : 'written' };
}

function chosenTargets(values: Values): TargetKey[] {
  if (values.all) return ['claude', 'cursor', 'agents'];
  const picked = (['claude', 'cursor', 'agents'] as TargetKey[]).filter((t) => values[t]);
  return picked.length ? picked : ['claude']; // default: the Claude Code skill
}

function install(argv: string[]): void {
  const { values } = parse(argv, {
    claude: { type: 'boolean' },
    cursor: { type: 'boolean' },
    agents: { type: 'boolean' },
    all: { type: 'boolean' },
    project: { type: 'boolean' },
    force: { type: 'boolean' },
    dir: { type: 'string' },
  });
  if (values.help) return installHelp();

  const results = chosenTargets(values).map((t) => installOne(t, values));
  if (values.json) return printJson({ installed: results });

  for (const r of results) {
    const verb = r.status === 'skipped' ? 'exists (use --force)' : r.status;
    info(`✓ ${r.target.padEnd(7)} ${verb} → ${r.path}`);
  }
  const labels: Record<TargetKey, string> = {
    claude: 'Claude Code',
    cursor: 'Cursor',
    agents: 'AGENTS.md-aware agents',
  };
  const which = results.map((r) => labels[r.target]).join(', ');
  info('');
  info(`Installed the Shipyard skill for: ${which}.`);
  info('Start a new agent session (or reload rules) so it picks the skill up, then');
  info('just ask it to "post this project to Shipyard" — it will drive the CLI.');
  if (!values.cursor && !values.all && !values.agents) {
    info('');
    info('Also available:  shipyard skills install --cursor   (Cursor rule, this project)');
    info('                 shipyard skills install --agents   (append to ./AGENTS.md)');
  }
}

function printContent(argv: string[]): void {
  const { values } = parse(argv, {
    claude: { type: 'boolean' },
    cursor: { type: 'boolean' },
    agents: { type: 'boolean' },
  });
  if (values.help) return print('Usage: shipyard skills print [--claude | --cursor | --agents]');
  const target: TargetKey = values.cursor ? 'cursor' : values.agents ? 'agents' : 'claude';
  print(contentFor(target));
}

function showPaths(argv: string[]): void {
  const { values } = parse(argv, { project: { type: 'boolean' }, dir: { type: 'string' } });
  if (values.help) return print('Usage: shipyard skills path [--project] [--dir PATH]');
  const rows = {
    claude: destFor('claude', values),
    cursor: destFor('cursor', values),
    agents: destFor('agents', values),
  };
  if (values.json) return printJson(rows);
  for (const [k, v] of Object.entries(rows)) print(`${k.padEnd(7)} ${v}`);
}

function skillsHelp(): void {
  print(
    [
      'Usage: shipyard skills <command>',
      '',
      '  install   Install the Shipyard skill so your coding agent can drive the CLI',
      '  print     Print a skill file to stdout (--claude | --cursor | --agents)',
      '  path      Show where each skill would be installed',
      '',
      'Quick start:  shipyard skills install            # Claude Code (global)',
      '              shipyard skills install --cursor   # Cursor rule (this project)',
      '              shipyard skills install --agents   # append to ./AGENTS.md',
    ].join('\n'),
  );
}

function installHelp(): void {
  print(
    [
      'Usage: shipyard skills install [targets] [options]',
      '',
      'Targets (default: --claude):',
      '  --claude    Claude Code skill → ~/.claude/skills/shipyard/SKILL.md',
      '  --cursor    Cursor rule       → ./.cursor/rules/shipyard.mdc',
      '  --agents    Append a section  → ./AGENTS.md',
      '  --all       All three',
      '',
      'Options:',
      '  --project   Install the Claude skill into ./.claude (this project, not global)',
      '  --dir PATH  Write into PATH instead of the default location',
      '  --force     Overwrite an existing skill/rule file',
      '  --json      Print the installed paths as JSON',
    ].join('\n'),
  );
}
