# Connect Shipyard over MCP

Shipyard runs a hosted **MCP server** so your AI agent can browse the directory, list
your app, and work your board for you — no CLI install, no local process. It speaks
the **Streamable HTTP** transport at:

```
https://goshipyard.app/mcp
```

Point any MCP-capable client at that URL. Leave the key off to browse **anonymously**
(`list_projects`, `get_project`); add your personal API key for everything else.

- **Get a key:** [goshipyard.app/account#api-keys](https://goshipyard.app/account#api-keys) → make a key → copy the `sk_live_…` value.
- **Machine pointer:** [goshipyard.app/llms.txt](https://goshipyard.app/llms.txt)

> **MCP server or CLI skill?** They cover the same operations. The **MCP server**
> (this page) is the lightest — one URL, nothing to install, works in any MCP
> client. The **[`shipyard` CLI + skill](../README.md#let-your-coding-agent-drive-it-)**
> is the one to use when the agent needs to upload **local screenshot files** or
> take a listing down, which a remote server can't do.

## Tools

| Tool | Auth | What it does |
| --- | --- | --- |
| `list_projects` | anonymous | Browse / search the directory (`q`, `category`, `sort`, `limit`, `offset`). |
| `get_project` | anonymous | One listing by id, with its upvotes, reactions and screenshots. |
| `my_projects` | key | Listings in your workspaces, taken-down ones included. |
| `ship_project` | key | List an app; its page is public at once (confirm details with the user first). |
| `update_project` | key | Change a listing's details. Only the fields you give change. |
| `like_project` / `unlike_project` | key | Upvote / take an upvote back. |
| `list_opportunities` | key + plan | Your listing's board: threads where people ask about what the app does, best fit first, each with a suggested first reply. |
| `mark_opportunity` | key + plan | Mark a card `posted` (with `reply_url`, the link to your own reply, so replies are watched), `dismissed`, or `live` again. |

The two board tools need a subscribed workspace; see
[pricing](https://goshipyard.app/pricing). Reviews you could write, the wallet and
review bounties ended with the first version of Shipyard, and so did their tools.

### Shipyard never posts for you

The server tells every agent this in its instructions: suggest replies, and let the
person post them from their own account. An agent should show you the thread and the
suggested reply, and you post it. Then `mark_opportunity` records it.

### Paging through listings

Call `list_projects` with `limit` (default 20, maximum 100). The response has `data`
and `pagination: { limit, offset, has_more }`. To continue, add `limit` to `offset`
and keep the same search, category and sort. Stop when `has_more` is false. Listings
can change between calls; this is offset pagination, not a snapshot.

### Where reactions come from

A listing's reactions carry `source` (where it was said), `reviewer_is_seed` and
`review_source`:

- `seeded`: written by one of Shipyard's own seed accounts, brought over from v1.
- `member`: not seeded; this does **not** certify hands-on use or identity.

Keep that distinction when summarizing. If a response omits these fields, treat the
source as unknown, not human. The CLI's reactions table shows a KIND column and
`--json` preserves the API fields.

---

## Claude Code

One command (drop `--header` to connect anonymously):

```sh
claude mcp add --transport http shipyard https://goshipyard.app/mcp \
  --header "Authorization: Bearer sk_live_…"
```

Then in a session: `/mcp` to check it's connected, and just ask — *"list the top
devtools apps on Shipyard"* or *"list this app for me."*

## Cursor

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (this project):

```json
{
  "mcpServers": {
    "shipyard": {
      "url": "https://goshipyard.app/mcp",
      "headers": { "Authorization": "Bearer sk_live_…" }
    }
  }
}
```

Cursor speaks HTTP MCP natively. Reload, then check **Settings → MCP** for a green
dot next to `shipyard`.

## VS Code (GitHub Copilot — agent mode)

VS Code uses `servers` (not `mcpServers`) and an explicit `type`. Add to
`.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "shipyard": {
      "type": "http",
      "url": "https://goshipyard.app/mcp",
      "headers": { "Authorization": "Bearer sk_live_…" }
    }
  }
}
```

Open the Chat view, switch to **Agent** mode, and `shipyard`'s tools appear in the
tools picker. (Requires MCP support — VS Code 1.102+.)

## Windsurf

Edit `~/.codeium/windsurf/mcp_config.json` and use `serverUrl` for a Streamable
HTTP server:

```json
{
  "mcpServers": {
    "shipyard": {
      "serverUrl": "https://goshipyard.app/mcp",
      "headers": { "Authorization": "Bearer sk_live_…" }
    }
  }
}
```

Then hit **Refresh** in Windsurf's MCP settings (Cascade → Plugins / MCP).

## Cline

Open the **Cline** panel → **MCP Servers** → **Configure MCP Servers**, and add a
remote server:

```json
{
  "mcpServers": {
    "shipyard": {
      "type": "streamableHttp",
      "url": "https://goshipyard.app/mcp",
      "headers": { "Authorization": "Bearer sk_live_…" }
    }
  }
}
```

## Claude Desktop

Claude Desktop (Pro/Team/Enterprise) supports remote servers directly:
**Settings → Connectors → Add custom connector**, name it `Shipyard`, and paste
`https://goshipyard.app/mcp`. For key auth, use a client that forwards headers, or
the bridge below.

On any plan you can also add it via the config file
(`claude_desktop_config.json`) using the universal bridge:

```json
{
  "mcpServers": {
    "shipyard": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote", "https://goshipyard.app/mcp",
        "--header", "Authorization: Bearer sk_live_…"
      ]
    }
  }
}
```

## Goose

`goose configure` → **Add Extension** → **Remote Extension (Streaming HTTP)** →
URL `https://goshipyard.app/mcp`, then add an `Authorization: Bearer sk_live_…`
header. Or in `~/.config/goose/config.yaml`:

```yaml
extensions:
  shipyard:
    enabled: true
    type: streamable_http
    uri: https://goshipyard.app/mcp
    headers:
      Authorization: "Bearer sk_live_…"
```

## Zed

Zed configures MCP as `context_servers` in `settings.json`. Use the universal
bridge for a remote HTTP server:

```json
{
  "context_servers": {
    "shipyard": {
      "command": {
        "path": "npx",
        "args": [
          "-y", "mcp-remote", "https://goshipyard.app/mcp",
          "--header", "Authorization: Bearer sk_live_…"
        ]
      }
    }
  }
}
```

## Any other MCP client

The endpoint is a standard **Streamable HTTP** MCP server, so most clients need
only the URL and a bearer header:

- **URL:** `https://goshipyard.app/mcp`
- **Transport:** Streamable HTTP (`http` / `streamableHttp`)
- **Auth:** `Authorization: Bearer sk_live_…` header (omit to browse only)

If a client only speaks the local **stdio** transport, wrap the endpoint with the
`mcp-remote` bridge:

```sh
npx -y mcp-remote https://goshipyard.app/mcp --header "Authorization: Bearer sk_live_…"
```

Verify any setup with the official inspector:

```sh
npx @modelcontextprotocol/inspector
# transport: Streamable HTTP · URL: https://goshipyard.app/mcp
```

---

### Notes

- **Anonymous = browsing only.** Without a key you get `list_projects` and
  `get_project`; the other tools return a clear error linking to where keys are made.
- **Your key = your account.** Tools act as you — apps you list are under your
  workspace. Treat `sk_live_…` like a password.
- **Nothing is posted for you.** The board suggests replies; you post them yourself.
- **Local screenshots?** A remote server can't read files off your disk. To attach
  a local image, use the [`shipyard` CLI](../README.md) (`--hero ./shot.png`).
