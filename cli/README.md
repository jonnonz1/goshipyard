# shipyard CLI

Post and manage your [Shipyard](https://goshipyard.app) projects from the
terminal — and let your coding agent do it for you. A small, zero-dependency
TypeScript/Bun tool over the public `/api/v1` REST API.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/jonnonz1/goshipyard/main/install.sh | sh
```

Or run from source: `bun run cli <command>`.

## Authenticate

Create a personal API key in the web app (**[Settings → API keys](https://goshipyard.app/settings)**), then:

```sh
shipyard login                       # paste the key when prompted
shipyard login --api-key sk_live_…   # non-interactive (CI)
shipyard whoami                      # confirm who you are
```

The key is validated and saved to `~/.config/shipyard/config.json` (chmod 600).

Resolution order — **flag › env › config file › default**:

| What | Flag | Env | Default |
|---|---|---|---|
| API key | `--api-key` | `SHIPYARD_API_KEY` | (from `login`) |
| Base URL | `--api-url` | `SHIPYARD_URL` | `https://goshipyard.app` |

> Developing against a local server? Add `--api-url http://localhost:3000`.

## Commands

```
shipyard login | logout | whoami

shipyard projects list      [--mine | --user HANDLE] [--sort new|top] [-q TEXT] [-c CAT] [--limit N] [--offset N]
shipyard projects get       <id>
shipyard projects create    -t TITLE -p PITCH -u URL [-c CAT] [--repo-url R] [--body B | --body-file F] [--slug S] [--hero F] [--image F …]
shipyard projects update    <id> [same content flags]
shipyard projects delete    <id> [-y]
shipyard projects set-images <id> [--hero F] [--image F …]   # replaces the whole set
shipyard projects rm-image  <id> <ordinal>                   # 0 = hero, 1–2 = gallery

shipyard reviews list       <id> [--limit N] [--offset N]    # comments on a project
shipyard reviews add        <id> -b "honest, ≥20 chars" | --body-file F
shipyard reviews mine                                        # reviews you've written

shipyard like               <id>                             # upvote (idempotent)
shipyard unlike             <id>

shipyard wallet                                              # credit balance + ledger
shipyard wallet topup       [--open]                         # load credit (Stripe, in-browser)

shipyard skills install     [--claude | --cursor | --agents | --all]   # teach your agent the CLI
```

Add `--json` to any command for machine-readable output (printed to stdout; status
and prompts go to stderr, so pipes stay clean):

```sh
shipyard projects list --mine --json | jq '.data[].slug'
```

Review tables show a SOURCE column: `automated`, `seeded`, `member`, or
`unknown` for older servers without provenance. `--json` preserves
`review_source` and `reviewer_is_seed`. Member is an account classification,
not a claim of verified identity or hands-on testing; payment is separate.

## Skills — let your coding agent drive Shipyard

Install a skill so Claude Code, Cursor, or any `AGENTS.md`-aware agent can post and
manage your projects on request:

```sh
shipyard skills install            # Claude Code skill → ~/.claude/skills/shipyard
shipyard skills install --cursor   # Cursor rule → ./.cursor/rules/shipyard.mdc
shipyard skills install --agents   # append a section to ./AGENTS.md
```

Then just tell your agent *"post this project to Shipyard"* or *"show me the reviews
on my launch"* — it runs the CLI for you.

## Examples

```sh
shipyard projects create -t Foglight -p "Maps for makers" -u https://foglight.app \
  -c devtools --hero ./hero.png
shipyard projects list --mine
shipyard reviews list <id>
shipyard reviews add <id> -b "Tried it on a 2k-node graph — clustering held up nicely."
shipyard like <id>
shipyard wallet
```

## Build a binary

```sh
bun run cli:build       # → dist/shipyard (host platform)
bun run cli:release     # → dist/shipyard-<os>-<arch> for all targets
```

The full request/response contract is the repo's `openapi.json` (served live at
`/api/v1/openapi.json`, browsable at `/api/v1/docs`).
