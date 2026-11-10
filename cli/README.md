# shipyard CLI

List your app on [Shipyard](https://goshipyard.app), manage the listing and work
its board from the terminal — and let your coding agent do it for you. A small, zero-dependency
TypeScript/Bun tool over the public `/api/v1` REST API.

## Install

```sh
curl -fsSL https://raw.githubusercontent.com/jonnonz1/goshipyard/main/install.sh | sh
```

Or run from source: `bun run cli <command>`.

## Authenticate

Create a personal API key in the web app (**[Account → API keys](https://goshipyard.app/account#api-keys)**), then:

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

> Developing against a local server? Add `--api-url http://localhost:4001`.

## Commands

```
shipyard login | logout | whoami

shipyard projects list      [--mine | --user HANDLE] [--sort new|top] [-q TEXT] [-c CAT] [--limit N] [--offset N]
shipyard projects get       <id>
shipyard projects create    -t TITLE -p PITCH -u URL [-c CAT] [--repo-url R] [--body B | --body-file F] [--hero F] [--image F …] [--handle H] [--workspace H]
shipyard projects update    <id> [same content flags]
shipyard projects delete    <id> [-y]                        # takes it down; an owner can put it back on the site
shipyard projects set-images <id> [--hero F] [--image F …]   # replaces the whole set
shipyard projects rm-image  <id> <ordinal>                   # 0 = cover, 1–2 = the rest

shipyard reactions          <id> [--limit N] [--offset N]    # what people said about a listing

shipyard like               <id>                             # upvote (idempotent)
shipyard unlike             <id>

shipyard opportunities list <id> [--view live|posted|dismissed]   # the board (paid plan)
shipyard opportunities mark <card-id> posted [--reply-url URL] | dismissed | live

shipyard skills install     [--claude | --cursor | --agents | --all]   # teach your agent the CLI
```

Add `--json` to any command for machine-readable output (printed to stdout; status
and prompts go to stderr, so pipes stay clean):

```sh
shipyard projects list --mine --json | jq '.data[].slug'
```

The reactions table shows a KIND column: `seeded` (one of Shipyard's own seed
accounts, brought over from v1), `member` (not seeded), or `unknown` when the server
sends no provenance. `--json` preserves `review_source` and `reviewer_is_seed`. Member
is an account classification, not a claim of verified identity or hands-on use.

The board lists threads where people are asking about what your app does, each with a
suggested first reply. Shipyard never posts for you: post from your own account, then
`mark` the card `posted` with the link to your reply so answers are watched. The board
is a [paid plan](https://goshipyard.app/pricing); without one these commands say so.

`shipyard reviews list` still works as an alias for `reactions`. Writing reviews, the
wallet and review bounties ended with the first version of Shipyard.

## Skills — let your coding agent drive Shipyard

Install a skill so Claude Code, Cursor, or any `AGENTS.md`-aware agent can list and
manage your apps on request:

```sh
shipyard skills install            # Claude Code skill → ~/.claude/skills/shipyard
shipyard skills install --cursor   # Cursor rule → ./.cursor/rules/shipyard.mdc
shipyard skills install --agents   # append a section to ./AGENTS.md
```

Then just tell your agent *"list this app on Shipyard"* or *"what's on my Shipyard
board?"* — it runs the CLI for you.

## Examples

```sh
shipyard projects create -t Foglight -p "Maps for makers" -u https://foglight.app \
  -c devtools --hero ./hero.png
shipyard projects list --mine
shipyard reactions <id>
shipyard like <id>
shipyard opportunities list <id>
```

## Build a binary

```sh
bun run cli:build       # → dist/shipyard (host platform)
bun run cli:release     # → dist/shipyard-<os>-<arch> for all targets
```

The full request/response contract is the repo's `openapi.json` (served live at
`/api/v1/openapi.json`).
