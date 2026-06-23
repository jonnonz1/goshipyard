import { describe, expect, test } from 'bun:test';
import { upsertSection, CLAUDE_SKILL, CURSOR_RULE, AGENTS_SECTION } from './skills.ts';

const SECTION = AGENTS_SECTION;

describe('upsertSection', () => {
  test('appends to an empty file', () => {
    const out = upsertSection('', SECTION);
    expect(out).toContain('## Shipyard');
    expect(out.endsWith('\n')).toBe(true);
  });

  test('preserves existing content and appends below it', () => {
    const existing = '# My project\n\nSome house rules.\n';
    const out = upsertSection(existing, SECTION);
    expect(out).toContain('# My project');
    expect(out).toContain('Some house rules.');
    expect(out).toContain('## Shipyard');
    expect(out.indexOf('house rules')).toBeLessThan(out.indexOf('## Shipyard'));
  });

  test('is idempotent — re-running replaces the block, not duplicates it', () => {
    const once = upsertSection('# Doc\n', SECTION);
    const twice = upsertSection(once, SECTION);
    expect(twice).toBe(once);
    expect(twice.match(/shipyard:begin/g)?.length).toBe(1);
  });

  test('replaces a stale block in place, keeping surrounding text', () => {
    const stale =
      '# Doc\n\n<!-- shipyard:begin -->\nOLD CONTENT\n<!-- shipyard:end -->\n\n## Keep me\n';
    const out = upsertSection(stale, SECTION);
    expect(out).not.toContain('OLD CONTENT');
    expect(out).toContain('## Shipyard');
    expect(out).toContain('## Keep me');
    expect(out.match(/shipyard:begin/g)?.length).toBe(1);
  });
});

describe('embedded skill content', () => {
  test('Claude skill has valid frontmatter (name + description)', () => {
    expect(CLAUDE_SKILL.startsWith('---\n')).toBe(true);
    expect(CLAUDE_SKILL).toContain('name: shipyard');
    expect(CLAUDE_SKILL).toContain('description:');
  });

  test('Cursor rule has frontmatter and the install one-liner', () => {
    expect(CURSOR_RULE.startsWith('---\n')).toBe(true);
    expect(CURSOR_RULE).toContain('shipyard whoami');
  });

  test('all three reference the public install URL and the CLI', () => {
    for (const s of [CLAUDE_SKILL, CURSOR_RULE, AGENTS_SECTION]) {
      expect(s).toContain('goshipyard');
      expect(s).toContain('shipyard projects create');
    }
  });
});
