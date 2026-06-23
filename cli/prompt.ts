// Minimal stdin helpers. If stdin is piped (not a TTY) we read it directly, so
// `shipyard login < key.txt` and `echo y | shipyard …` work in scripts/CI.
//
// Note: interactive input is echoed (Bun's prompt()). For secrecy, pass the key
// via --api-key, the SHIPYARD_API_KEY env var, or pipe it in.

export async function readSecret(label: string): Promise<string> {
  if (!process.stdin.isTTY) {
    return (await Bun.stdin.text()).trim();
  }
  return (prompt(label) ?? '').trim();
}

export async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false; // non-interactive: require an explicit --yes
  const answer = (prompt(`${question} [y/N]`) ?? '').trim().toLowerCase();
  return answer === 'y' || answer === 'yes';
}
