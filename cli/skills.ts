// Agent skills shipped *inside* the CLI. The markdown lives as real files under
// cli/skills/ and is imported as text — Bun embeds it into the compiled binary,
// so `shipyard skills install` works offline with no repo checkout. The same
// files are committed at the repo root (skills/, .cursor/, AGENTS.md) for humans
// and agents to browse on GitHub.
import CLAUDE_SKILL from './skills/SKILL.md' with { type: 'text' };
import CURSOR_RULE from './skills/cursor.mdc' with { type: 'text' };
import AGENTS_SECTION from './skills/AGENTS.md' with { type: 'text' };

export { CLAUDE_SKILL, CURSOR_RULE, AGENTS_SECTION };

const BEGIN = '<!-- shipyard:begin -->';
const END = '<!-- shipyard:end -->';

// Insert or replace the marked Shipyard block in an AGENTS.md-style file, leaving
// any surrounding content intact. Idempotent: running twice yields the same file.
export function upsertSection(existing: string, section: string): string {
  const block = section.trim();
  const begin = existing.indexOf(BEGIN);
  const end = existing.indexOf(END);
  if (begin !== -1 && end !== -1 && end > begin) {
    const before = existing.slice(0, begin).trimEnd();
    const after = existing.slice(end + END.length).trimStart();
    return [before, block, after].filter(Boolean).join('\n\n').trimEnd() + '\n';
  }
  const base = existing.trim();
  return (base ? base + '\n\n' : '') + block + '\n';
}
