// Cross-compile the CLI to standalone binaries for a release. Run: bun run cli:release
// Emits dist/shipyard-<os>-<arch> for each target; the GitHub release workflow
// (.github/workflows/cli-release.yml) uploads them and cli/install.sh fetches them.
import { $ } from 'bun';

const TARGETS = ['bun-darwin-arm64', 'bun-darwin-x64', 'bun-linux-x64', 'bun-linux-arm64'] as const;

for (const target of TARGETS) {
  const out = `dist/shipyard-${target.replace('bun-', '')}`;
  console.log(`building ${out} …`);
  await $`bun build --compile --minify --target=${target} --outfile ${out} cli/index.ts`;
}
console.log('done → dist/');
