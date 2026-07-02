# Connect Shipyard over MCP

Shipyard runs a hosted **MCP server** so your AI agent can browse, review, like,
and ship projects for you — no CLI install, no local process. It speaks the
**Streamable HTTP** transport at:

```
https://goshipyard.app/mcp
```

Point any MCP-capable client at that URL. Add your personal API key to unlock the
write tools; leave it off to connect **anonymously with read-only tools**
(`list_projects`, `get_project`).

- **Get a key:** [goshipyard.app/settings#api-keys](https://goshipyard.app/settings#api-keys) → **New key** → copy the `sk_live_…` value.
- **Machine pointer:** [goshipyard.app/llms.txt](https://goshipyard.app/llms.txt)

> **MCP server or CLI skill?** Both give an agent the same abilities. The **MCP
> server** (this page) is the lightest — one URL, nothing to install, works in any
> MCP client. The **[`shipyard` CLI + skill](../README.md#let-your-coding-agent-drive-it-)**
> is better when the agent also needs to upload **local screenshot files**, which
> the CLI can do and a remote server can't.

## Tools

| Tool | Auth | What it does |
| --- | --- | --- |
| `list_projects` | anonymous | Browse / search the feed (`sort`, `category`, `query`, `mine`, `limit`). |
| `get_project` | anonymous | One project by id, slug, or `handle/slug` — reviews inline. |
| `ship_project` | key | Publish a project (confirm details with the user first). |
| `add_review` | key | Post an honest review (≥20 chars; never fabricated). |
| `like_project` / `unlike_project` | key | Upvote / remove an upvote (idempotent). |
| `wallet_balance` | key | Your credit + recent ledger. |
| `fund_review_bounty` | key | Fund a paid review bounty on your own project. |

---

## Claude Code

One command (drop `--header` to connect anonymously):

```sh
claude mcp add --transport http shipyard https://goshipyard.app/mcp \
  --header "Authorization: Bearer sk_live_…"
```

Then in a session: `/mcp` to check it's connected, and just ask — *"list the top
devtools projects on Shipyard"* or *"ship this project for me."*

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
- **Auth:** `Authorization: Bearer sk_live_…` header (omit for read-only)

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

- **Anonymous = read-only.** Without a key you get `list_projects` and
  `get_project`; the write tools return a clear error linking to the API-keys page.
- **Your key = your account.** Tools act as you — projects you ship and reviews
  you post are attributed to your handle. Treat `sk_live_…` like a password.
- **Reviews must be genuine.** `add_review` enforces a 20-character minimum and the
  server instructions ask agents never to fabricate or pad a review.
- **Local screenshots?** A remote server can't read files off your disk. To attach
  a local image, use the [`shipyard` CLI](../README.md) (`--hero ./shot.png`).
