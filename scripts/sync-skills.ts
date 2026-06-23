// Generate the repo's browsable skill copies from the single source of truth in
// cli/skills/ (the files the CLI embeds into its binary). Run: bun run skills:sync
//
// Outputs, for humans/agents browsing the repo on GitHub and for anyone who opens
// this repo in Cursor:
//   skills/SKILL.md              — the Claude Code skill
//   skills/cursor.mdc            — the Cursor rule
//   .cursor/rules/shipyard.mdc   — same rule, active when this repo is opened in Cursor
//   AGENTS.md                    — root agent instructions (Shipyard usage)
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const read = (p: string) => Bun.file(join(root, p)).text();
const write = (p: string, s: string) => Bun.write(join(root, p), s);

const skill = await read('cli/skills/SKILL.md');
const cursor = await read('cli/skills/cursor.mdc');
const agentsSection = await read('cli/skills/AGENTS.md');

await write('skills/SKILL.md', skill);
await write('skills/cursor.mdc', cursor);
await write('.cursor/rules/shipyard.mdc', cursor);

// Root AGENTS.md: a short repo note + the canonical Shipyard usage section.
const agents = `# AGENTS.md

Guidance for AI coding agents. This repository is the **Shipyard CLI** — a
command-line tool (and installable agent skills) for [Shipyard](https://goshipyard.app),
a feed for vibe-coded projects.

If you are helping a user who wants to post or manage a project on Shipyard, use
the \`shipyard\` CLI as described below.

${agentsSection.trim()}\n`;
await write('AGENTS.md', agents);

console.log('Synced: skills/SKILL.md, skills/cursor.mdc, .cursor/rules/shipyard.mdc, AGENTS.md');
