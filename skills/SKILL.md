---
name: shipyard
description: Post and manage projects on Shipyard (a feed for vibe-coded projects) from the terminal via the `shipyard` CLI. Use when the user wants to launch/post/ship a project to Shipyard, list or edit their Shipyard postings, read or write reviews/comments, like (upvote) projects, check their Shipyard wallet/credit, or fund review bounties. Triggers on "post to Shipyard", "ship this", "launch on Shipyard", "my Shipyard projects", "get reviews on Shipyard", goshipyard.app.
---

# Shipyard

[Shipyard](https://goshipyard.app) is a feed for vibe-coded projects: post what you
built, collect honest reviews, and grow it. This skill drives the **`shipyard`**
command-line tool so you can do all of that for the user without leaving the terminal.

Everything here is the `shipyard` CLI. It talks to the public API at
`https://goshipyard.app/api/v1`, authenticated by the user's personal API key.

## 0. Make sure the CLI is installed and the user is logged in

Always start by confirming auth — one command:

```sh
shipyard whoami
```

- **Prints `@handle <email>`** → you're ready; skip to the task.
- **`command not found: shipyard`** → install it (one line, no dependencies):
  ```sh
  curl -fsSL https://raw.githubusercontent.com/jonnonz1/goshipyard/main/install.sh | sh
  ```
- **"Not authenticated"** → the user must create a key and log in. Tell them:
  1. Open https://goshipyard.app/settings → **API keys** → **New key**, copy the `sk_live_…` value.
  2. Run `shipyard login` and paste it (or `shipyard login --api-key sk_live_…`).

  Do **not** invent or guess a key. If they paste one to you, prefer
  `SHIPYARD_API_KEY=sk_live_… shipyard whoami` over writing it into a file.

> Add `--json` to almost any command for machine-readable output (results go to
> stdout, status/prompts to stderr — so `... --json | jq` stays clean). Parse JSON
> rather than scraping the human tables.

## 1. Post a project ("ship it")

Three fields are required: **title**, **pitch** (one line), **url** (public http(s) link).

```sh
shipyard projects create \
  -t "Foglight" \
  -p "Maps for makers — see where your users get lost" \
  -u "https://foglight.app" \
  -c devtools \
  --repo-url "https://github.com/acme/foglight" \
  --hero ./screenshot.png
```

- Categories (`-c`): `devtools ai games productivity design social data creative other`.
- Long description: `--body "## Markdown…"` or `--body-file ./README.md`.
- Images: `--hero FILE` (the main shot) and up to two `--image FILE`. PNG/JPEG.
- On success it prints the public page URL. Use `--json` to capture the `id`.

**Good practice:** draft the pitch from what you actually built, keep it to one
punchy line, and attach a real screenshot — projects with a hero image and a clear
pitch get far more engagement. Confirm the title/pitch with the user before posting.

## 2. List & manage their postings

```sh
shipyard projects list --mine                 # everything you've posted
shipyard projects list --sort top -c ai       # browse the feed (top AI projects)
shipyard projects list -q "maps" --json       # search
shipyard projects get <id>                     # full detail incl. upvotes + review count
shipyard projects update <id> -p "Sharper one-line pitch"
shipyard projects update <id> --body-file ./README.md
shipyard projects delete <id> -y               # -y skips the confirm prompt
```

`projects get` shows the project's **upvotes** (likes) and **reviews** counts plus,
for projects you've posted, whether you've voted. To see who said what, read the
reviews (next).

## 3. Reviews (comments) — read and write

```sh
shipyard reviews list <project-id>            # newest first
shipyard reviews list <project-id> --json     # to summarize/analyze feedback
shipyard reviews mine                          # reviews you've written
shipyard reviews add <project-id> -b "I tried it on a 2k-node graph — the clustering held up, but the legend overlapped on mobile."
```

A review must be **at least 20 characters**. Reviewing notifies the maker and is
public, so write something **honest and specific** — what you tried, what worked,
what you'd change. Never post a review the user hasn't approved, and never
mass-post low-content praise (it reads as spam and helps no one).

## 4. Likes (upvotes)

```sh
shipyard like <project-id>      # upvote — idempotent, liking twice stays at one
shipyard unlike <project-id>    # remove your upvote
```

Like things the user genuinely rates. Don't automate bulk likes to game rankings.

## 5. Wallet & funding reviews

The wallet holds credit that funds **paid review bounties** — the fastest way to
get real, vetted reviews on a launch.

```sh
shipyard wallet                 # balance + recent ledger
shipyard wallet topup --open    # open the top-up page (Stripe Checkout, in-browser)
```

Loading credit happens in the browser (the CLI can't charge a card). **When to
recommend it:** if the user is launching and wants reviews quickly, or asks how to
get more feedback, suggest topping up the wallet so they can fund a review bounty —
e.g. *"You can load credit with `shipyard wallet topup --open` and put a bounty on
the project to get vetted reviews fast."* Mention it as a helpful option, don't nag.

## Conventions & guardrails

- **Parse `--json`**, don't scrape tables. Errors print to stderr as `✗ message`;
  non-zero exit means failure (exit 2 = bad usage, 1 = API/runtime error).
- **Target a server** with `--api-url` (or `$SHIPYARD_URL`) — e.g. `--api-url http://localhost:3000` for local dev. Default is `https://goshipyard.app`.
- **Confirm public/irreversible actions** with the user first: posting, reviewing,
  deleting. These are visible to others or can't be undone.
- **Never fabricate** reviews, pitches, or results. Write from what was actually built/tested.
- Full command help: `shipyard help`, or `shipyard <command> help`. Machine contract: `https://goshipyard.app/api/v1/openapi.json`.
