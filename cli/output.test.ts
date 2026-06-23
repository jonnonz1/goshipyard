import { describe, expect, test } from 'bun:test';
import { table, truncate } from './output.ts';

describe('output', () => {
  test('truncate adds an ellipsis past the limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello world', 5)).toBe('hell…');
  });

  test('table renders a header, separator and aligned rows', () => {
    const out = table(
      [
        { a: 'x', b: 'yy' },
        { a: 'zzz', b: 'w' },
      ],
      [
        { header: 'A', get: (r) => r.a },
        { header: 'B', get: (r) => r.b },
      ],
    );
    const lines = out.split('\n');
    expect(lines.length).toBe(4); // header + separator + 2 rows
    expect(lines[0]).toContain('A');
    expect(lines[1]).toMatch(/─/);
    expect(lines[2]).toContain('x');
    expect(lines[3]).toContain('zzz');
  });
});
