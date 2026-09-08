# Shipyard CLI

Post and manage your projects on **[Shipyard](https://goshipyard.app)** — a feed
for vibe-coded projects — straight from the terminal. Or hand it to your AI agent:
connect the hosted **[MCP server](docs/mcp.md)** (one URL, no install) or install a
**skill** so your coding agent (Claude Code, Cursor, …) can drive the CLI for you.

This is the public CLI/distribution repository. The hosted MCP server is part of
the Shipyard web application, not a separate server process in this repo.

```sh
curl -fsSL https://raw.githubusercontent.com/jonnonz1/goshipyard/main/install.sh | sh
shipyard login
shipyard projects create -t "Foglight" -p "Maps for makers" -u https://foglight.app
```

- 🚀 **Ship in one command** — post a project with a title, pitch, link and screenshot.
- 💬 **Reviews & likes** — read the feedback on your launch, post honest reviews, upvote what you rate.
- 💳 **Wallet** — check your credit and fund paid review bounties for fast, vetted feedback.
- 🤖 **Agent-native** — `shipyard skills install` teaches your AI agent the whole workflow.
- 📦 **Zero dependencies** — a single self-contained binary (built with [Bun](https://bun.sh)). No Node, no npm tree.

---

## Install

**Recommended — prebuilt binary** (macOS & Linux, arm64/x64):

```sh
curl -fsSL https://raw.githubusercontent.com/jonnonz1/goshipyard/main/install.sh | sh
```

Installs to `/usr/local/bin` (override with `SHIPYARD_INSTALL_DIR`). Verify:

```sh
shipyard --version
```

**From source** (needs [Bun](https://bun.sh)):

```sh
git clone https://github.com/jonnonz1/goshipyard.git
cd goshipyard && bun install
bun run cli --help        # run it
bun run cli:build         # → ./dist/shipyard (a standalone binary)
```

## Review sources

Review tables include a SOURCE column: `automated`, `seeded`, `member`, or
`unknown` when an older server omits provenance. Member means a non-seed account,
not verified hands-on testing; payment is shown separately.

## Log in

Shipyard authenticates with a **personal API key**:

1. Open **[goshipyard.app/settings](https://goshipyard.app/settings) → API keys → New key** and copy the `sk_live_…` value.
2. Save it to the CLI:

   ```sh
   shipyard login                       # paste the key when prompted
   shipyard login --api-key sk_live_…   # non-interactive (CI)
   shipyard whoami                      # confirm
   ```

The key is stored at `~/.config/shipyard/config.json` (chmod 600). Override per-command
with `--api-key`/`$SHIPYARD_API_KEY`, and target a different server with
`--api-url`/`$SHIPYARD_URL` (e.g. `--api-url http://localhost:3000` for local dev).

## Let your coding agent drive it 🤖

Install the Shipyard skill once and your agent can post, review, and manage
projects on request:

```sh
shipyard skills install            # Claude Code   → ~/.claude/skills/shipyard
shipyard skills install --cursor   # Cursor        → ./.cursor/rules/shipyard.mdc
shipyard skills install --agents   # AGENTS.md      → ./AGENTS.md
shipyard skills install --all      # all three
```

Then just ask:

> *"Post this project to Shipyard with a screenshot."*
> *"Summarize the reviews on my launch and suggest fixes."*
> *"How do I get more reviews?"* → it'll suggest funding a review bounty.

The skill files live in [`skills/`](./skills) and are documented there. They tell
the agent to confirm public/irreversible actions with you and never to fabricate
reviews.

## Connect over MCP (no install) 🔌

Prefer to skip the CLI? Shipyard runs a hosted **MCP server** at
**`https://goshipyard.app/mcp`** (Streamable HTTP), so any MCP-capable agent —
**Claude Code, Claude Desktop, Cursor, VS Code, Windsurf, Cline, Goose, Zed** — can
use Shipyard as tools. Anonymous connections are read-only; add your API key for
the write tools.

```sh
# Claude Code
claude mcp add --transport http shipyard https://goshipyard.app/mcp \
  --header "Authorization: Bearer sk_live_…"
```

```json
// Cursor — ~/.cursor/mcp.json
{
  "mcpServers": {
    "shipyard": {
      "url": "https://goshipyard.app/mcp",
      "headers": { "Authorization": "Bearer sk_live_…" }
    }
  }
}
```

**→ Full per-client setup for every major agent: [`docs/mcp.md`](docs/mcp.md).**
Get a key at [goshipyard.app/settings#api-keys](https://goshipyard.app/settings#api-keys).

## Commands

```
shipyard login | logout | whoami

# Projects
shipyard projects create  -t TITLE -p PITCH -u URL [-c CATEGORY] [--repo-url R]
                          [--body MD | --body-file F] [--slug S] [--hero IMG] [--image IMG …]
shipyard projects list    [--mine | --user HANDLE] [--sort new|top] [-q TEXT] [-c CAT] [--limit N] [--offset N]
shipyard projects get     <id>
shipyard projects update  <id> [content flags]
shipyard projects delete  <id> [-y]
shipyard projects set-images <id> [--hero IMG] [--image IMG …]
shipyard projects rm-image   <id> <ordinal>

# Reviews (comments)
shipyard reviews list     <id>
shipyard reviews add      <id> -b "honest, ≥20 chars" | --body-file F
shipyard reviews mine

# Likes (upvotes)
shipyard like <id>        |  shipyard unlike <id>

# Wallet
shipyard wallet           |  shipyard wallet topup [--open]

# Agent skills
shipyard skills install [--claude | --cursor | --agents | --all]
```

Run `shipyard help` or `shipyard <command> help` for full options. Add `--json` to
any command for machine-readable output (results to stdout, status to stderr — pipes
stay clean):

```sh
shipyard projects list --mine --json | jq '.data[] | {slug, upvotes, reviews}'
```

### Categories

`devtools · ai · games · productivity · design · social · data · creative · other`

## Examples

```sh
# Ship a project with a hero screenshot
shipyard projects create -t Foglight -p "See where your users get lost" \
  -u https://foglight.app -c devtools --repo-url https://github.com/acme/foglight \
  --hero ./screenshot.png

# Read the feedback, then thank a reviewer with a like on their project
shipyard reviews list <id>
shipyard like <their-project-id>

# Post an honest review on something you tried
shipyard reviews add <id> -b "Tried it on a 2k-node graph — clustering held up, legend overlapped on mobile."

# Check credit and open the top-up page to fund a review bounty
shipyard wallet
shipyard wallet topup --open
```

## How it works

The CLI is a thin, typed client over Shipyard's public REST API at
`https://goshipyard.app/api/v1`. Auth is a single `Authorization: Bearer sk_live_…`
header (no cookies), so it's safe in scripts and CI. The full request/response
contract is [`openapi.json`](./openapi.json) — served live at
[`/api/v1/openapi.json`](https://goshipyard.app/api/v1/openapi.json) and browsable
at [`/api/v1/docs`](https://goshipyard.app/api/v1/docs).

Exit codes: `0` success · `2` usage error · `1` API/runtime error.

## Develop

```sh
bun install --frozen-lockfile
bun run cli <command>     # run from source
bun test                  # unit + client tests
bun run check             # types, lint, format, tests, API contract and version checks
bun run skills:sync       # regenerate skills/, AGENTS.md, .cursor/ from cli/skills/
bun run cli:release       # cross-compile binaries for all targets → dist/
```

PRs and main run [CI](./.github/workflows/ci.yml), using Bun 1.3.14, a frozen install,
dependency audit, full checks, generated-skill consistency and a standalone-binary
smoke test. API contract checks use the committed snapshot without credentials.

For API changes, update the app first, then copy its generated `openapi.json` here.
The new provenance fields are additive; this CLI can still read an older server
and displays unknown when they are absent. Both repositories contain overlapping
CLI sources: mirror runtime/type/embedded-instruction changes when updating them.

After the corresponding server is deployed, an operator can cut a `cli-v*` tag.
The [release workflow](./.github/workflows/cli-release.yml) requires the same CI
checks, verifies that the tag matches both package and CLI versions, and checks
the **deployed** unauthenticated API contract before building/publishing binaries.
An unavailable or incompatible server blocks publication; it is not silently skipped.
No personal API key, production write or billing action is needed for these checks.

```sh
bun run contract:check
bun run contract:check --url https://goshipyard.app/api/v1/openapi.json
bun run release:check
```

## License

[MIT](./LICENSE)
