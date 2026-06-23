// Output helpers. Discipline: rendered results (tables, detail views, JSON) go to
// STDOUT so they pipe cleanly; status, hints and prompts go to STDERR. With
// --json, stdout is pure JSON.

export function print(s: string): void {
  process.stdout.write(s.endsWith('\n') ? s : s + '\n');
}

export function printJson(obj: unknown): void {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

// Status line / hint (stderr).
export function info(msg: string): void {
  process.stderr.write(msg + '\n');
}

// Error line (stderr).
export function errLine(msg: string): void {
  process.stderr.write(msg + '\n');
}

export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export interface Column<T> {
  header: string;
  get: (row: T) => string;
}

// Render an aligned, zero-dependency table. Returns the string (caller prints it).
export function table<T>(rows: T[], cols: Column<T>[]): string {
  const headers = cols.map((c) => c.header);
  const body = rows.map((r) => cols.map((c) => c.get(r)));
  const widths = headers.map((h, i) => Math.max(h.length, ...body.map((row) => row[i]!.length)));
  const fmt = (cells: string[]) =>
    cells
      .map((cell, i) => cell.padEnd(widths[i]!))
      .join('  ')
      .trimEnd();
  return [fmt(headers), fmt(widths.map((w) => '─'.repeat(w))), ...body.map(fmt)].join('\n');
}
