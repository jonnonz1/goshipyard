// wallet commands: show balance + how to load credit.
//
// Credit funds *paid review bounties* — the fastest way to get real, vetted
// reviews on a project. Top-ups settle through Stripe Checkout in the browser,
// so the CLI can't charge a card directly; it shows the balance and the URL to
// open. `topup` can launch that URL for you.
import { parse, requireAuth, num, UsageError } from '../shared.ts';
import { print, printJson, info, table } from '../output.ts';
import type { Wallet } from '../types.ts';

export async function walletCommand(argv: string[]): Promise<void> {
  const verb = argv[0];
  // bare `shipyard wallet` → show; otherwise route the verb.
  switch (verb) {
    case undefined:
    case 'show':
      return show(verb === undefined ? argv : argv.slice(1));
    case 'topup':
    case 'add-funds':
      return topup(argv.slice(1));
    case 'help':
      return walletHelp();
    default:
      // Treat unknown leading tokens (e.g. flags) as args to `show`.
      if (verb.startsWith('-')) return show(argv);
      throw new UsageError(`Unknown wallet command: ${verb}. Try \`shipyard wallet help\`.`);
  }
}

function fmtCents(cents: number): string {
  const sign = cents < 0 ? '-' : '+';
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

async function show(argv: string[]): Promise<void> {
  const { values } = parse(argv);
  if (values.help) return walletHelp();
  const w = await requireAuth(values).wallet();
  if (values.json) return printJson(w);
  printWallet(w);
}

function printWallet(w: Wallet): void {
  print(`Balance: ${w.balance}`);
  if (w.recent.length) {
    print('');
    print(
      table(w.recent, [
        { header: 'WHEN', get: (e) => e.created_at.slice(0, 10) },
        { header: 'KIND', get: (e) => e.kind },
        { header: 'AMOUNT', get: (e) => fmtCents(e.amount_cents) },
        { header: 'BALANCE', get: (e) => `$${(e.balance_after / 100).toFixed(2)}` },
      ]),
    );
  }
  info('');
  info(`Add credit (funds review bounties): ${w.topup_url}`);
  info('Tip: `shipyard wallet topup --open` opens that page in your browser.');
}

async function topup(argv: string[]): Promise<void> {
  const { values } = parse(argv, {
    amount: { type: 'string' },
    open: { type: 'boolean' },
  });
  if (values.help) {
    return print(
      [
        'Usage: shipyard wallet topup [--amount DOLLARS] [--open]',
        '',
        '  Credit is loaded via Stripe Checkout in your browser — the CLI cannot charge',
        '  a card directly. This prints (or opens) the top-up page.',
        '',
        '  --amount N   Suggest a dollar amount in the hint (optional)',
        '  --open       Open the top-up page in your default browser',
      ].join('\n'),
    );
  }

  const w = await requireAuth(values).wallet();
  const amount = num(values.amount);
  const url = w.topup_url;

  if (values.json) return printJson({ topup_url: url, balance: w.balance });

  info(`Current balance: ${w.balance}`);
  if (amount) info(`To add ~$${amount.toFixed(2)}, open the page below and enter the amount.`);
  print(url);

  if (values.open) {
    const opened = await openInBrowser(url);
    info(opened ? '✓ Opened in your browser.' : 'Open the URL above to load credit.');
  } else {
    info('Re-run with --open to launch it, or paste the URL into your browser.');
  }
}

// Best-effort cross-platform "open this URL". Never throws — a failure just means
// the user opens the printed URL themselves.
async function openInBrowser(url: string): Promise<boolean> {
  const cmd =
    process.platform === 'darwin'
      ? ['open', url]
      : process.platform === 'win32'
        ? ['cmd', '/c', 'start', '', url]
        : ['xdg-open', url];
  try {
    const proc = Bun.spawn(cmd, { stdout: 'ignore', stderr: 'ignore' });
    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

function walletHelp(): void {
  print(
    [
      'Usage: shipyard wallet [show | topup]',
      '',
      '  show           Show your credit balance + recent ledger (default)',
      '  topup [--open] Show/open the page to load credit (Stripe Checkout in-browser)',
      '',
      'Credit funds paid review bounties — the fastest path to vetted reviews.',
    ].join('\n'),
  );
}
