<!-- shipyard:begin -->
## Shipyard

[Shipyard](https://goshipyard.app) is a feed for vibe-coded projects. Use the
`shipyard` CLI to post and manage projects, reviews, likes, and wallet credit.
Add `--json` to any command for parseable output.

```sh
shipyard whoami                            # confirm login first
# not installed? curl -fsSL https://raw.githubusercontent.com/jonnonz1/goshipyard/main/install.sh | sh
# not authed?    create a key at https://goshipyard.app/settings → API keys, then `shipyard login`

shipyard projects create -t TITLE -p "one-line pitch" -u https://url --hero ./shot.png
shipyard projects list --mine
shipyard projects get <id>                 # upvotes + review counts
shipyard projects update <id> -p "new pitch"

shipyard reviews list <id>                 # read comments
shipyard reviews add <id> -b "honest, specific, ≥20 chars"
shipyard like <id>                         # upvote (idempotent)

shipyard wallet                            # credit funds paid review bounties
shipyard wallet topup --open               # load credit (Stripe, in-browser)
```

Guardrails: confirm public/irreversible actions (post, review, delete) with the
user first; never fabricate reviews or pitches; don't bulk-like or spam reviews to
game rankings. Local dev: add `--api-url http://localhost:3000`.

No CLI? Shipyard also runs a hosted **MCP server** (Streamable HTTP) at
`https://goshipyard.app/mcp` with the same actions as tools — anonymous is
read-only, add an `Authorization: Bearer sk_live_…` header for writes. Setup for
every major client: https://github.com/jonnonz1/goshipyard/blob/main/docs/mcp.md
<!-- shipyard:end -->
