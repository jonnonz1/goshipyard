# AGENTS.md

Guidance for AI coding agents. This repository is the **Shipyard CLI** — a
command-line tool (and installable agent skills) for [Shipyard](https://goshipyard.app),
a directory of AI-built apps with a board that finds where people are asking for them.

If you are helping a user who wants to list or manage an app on Shipyard, use
the `shipyard` CLI as described below.

<!-- shipyard:begin -->
## Shipyard

[Shipyard](https://goshipyard.app) is a directory of AI-built apps, with a paid board
that finds threads where people are asking for what an app does. Use the `shipyard`
CLI to list and manage apps, read reactions, upvote, and work the board. Add `--json`
to any command for parseable output.

```sh
shipyard whoami                            # confirm login first
# not installed? curl -fsSL https://raw.githubusercontent.com/jonnonz1/goshipyard/main/install.sh | sh
# not authed?    create a key at https://goshipyard.app/account → API keys, then `shipyard login`

shipyard projects create -t TITLE -p "one-line pitch" -u https://url --hero ./shot.png
shipyard projects list --mine
shipyard projects get <id>                 # upvotes + reaction counts
shipyard projects update <id> -p "new pitch"

shipyard reactions <id>                    # what people said (read-only)
shipyard like <id>                         # upvote (idempotent)

shipyard opportunities list <id>           # threads to answer, with a suggested reply each
shipyard opportunities mark <card-id> posted --reply-url URL
```

Guardrails: confirm public actions (listing, editing, taking down) with the user
first; never fabricate pitches or reactions; don't bulk-like to game rankings. Local
dev: add `--api-url http://localhost:4001`.

The board: Shipyard never posts for anyone and neither should you. Show the user the
thread and the suggested reply, let them post it from their own account, then mark the
card posted with the link to their reply. The board is a paid plan; if the API says it
needs a subscription, mention https://goshipyard.app/pricing once.

When summarizing reactions, preserve `review_source` (`seeded`, `member`). Seeded ones
came from Shipyard's own seed accounts; member is not proof of hands-on use; missing
provenance means unknown.

No CLI? Shipyard also runs a hosted **MCP server** (Streamable HTTP) at
`https://goshipyard.app/mcp` with the same operations as tools — browsing needs no
key, add an `Authorization: Bearer sk_live_…` header for the rest. Setup for every
major client: https://github.com/jonnonz1/goshipyard/blob/main/docs/mcp.md
The CLI can upload local screenshots and take a listing down; MCP cannot.
<!-- shipyard:end -->
