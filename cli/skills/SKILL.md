---
name: shipyard
description: List and manage apps on Shipyard (a directory of AI-built apps, with a board that finds threads where people are asking for what an app does) from the terminal via the `shipyard` CLI. Use when the user wants to list/post/ship an app on Shipyard, edit their listings, read the reactions on one, upvote, or work their Shipyard board (threads to answer, each with a suggested reply). Triggers on "post to Shipyard", "ship this", "launch on Shipyard", "my Shipyard listings", "my Shipyard board", goshipyard.app.
---

# Shipyard

[Shipyard](https://goshipyard.app) is a directory of AI-built apps. Listing an app is
free. Its board, a paid plan, finds threads where people are asking about what the app
does and suggests a reply for the maker to post. This skill drives the **`shipyard`**
command-line tool so you can do that for the user without leaving the terminal.

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
  1. Open https://goshipyard.app/account → **API keys**, make a key, copy the `sk_live_…` value.
  2. Run `shipyard login` and paste it (or `shipyard login --api-key sk_live_…`).

  Do **not** invent or guess a key. If they paste one to you, prefer
  `SHIPYARD_API_KEY=sk_live_… shipyard whoami` over writing it into a file.

> Add `--json` to almost any command for machine-readable output (results go to
> stdout, status/prompts to stderr — so `... --json | jq` stays clean). Parse JSON
> rather than scraping the human output.

## 1. List an app ("ship it")

Three fields are required: **title**, **pitch** (one line), **url** (public https link).

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
- Screenshots: `--hero FILE` (the cover) and up to two `--image FILE`. PNG or JPEG.
- First listing on a new account? Add `--handle NAME` (2–30 lowercase letters, numbers,
  dashes or underscores): it becomes their maker handle. If the API says to pick a
  workspace, add `--workspace HANDLE`.
- The listing is public at once. On success it prints the page URL. Use `--json` to
  capture the `id`.

**Good practice:** write the pitch from what was actually built, keep it to one plain
line, and attach a real screenshot. Confirm the title and pitch with the user before
posting.

## 2. List & manage their listings

```sh
shipyard projects list --mine                 # everything in their workspaces
shipyard projects list --sort top -c ai       # browse the directory
shipyard projects list -q "maps" --json       # search
shipyard projects get <id>                     # full detail incl. upvotes + reactions
shipyard projects update <id> -p "Sharper one-line pitch"
shipyard projects update <id> --body-file ./README.md
shipyard projects set-images <id> --hero ./new-cover.png
shipyard projects delete <id> -y               # takes it down; -y skips the prompt
```

`delete` takes the listing off Shipyard. An owner can put it back from the Team page
on the site, so it is not gone for good.

## 3. Reactions — what people said

```sh
shipyard reactions <project-id>            # newest first
shipyard reactions <project-id> --json     # to summarize
```

A reaction is a reply the maker chose to show from a thread where they posted, or a
review brought over from the first version of Shipyard. They are read-only: nobody
writes one through the CLI, and you must never draft one to be passed off as real.

When summarizing, keep the `KIND` column (`review_source` in JSON): `seeded` reactions
came from Shipyard's own seed accounts, `member` ones did not, and a missing value
means unknown. Member is not proof of hands-on use. Keep seeded feedback distinct in
any summary.

## 4. Likes (upvotes)

```sh
shipyard like <project-id>      # upvote — idempotent, liking twice stays at one
shipyard unlike <project-id>    # remove your upvote
```

Like things the user genuinely rates. Don't automate bulk likes to game rankings.

## 5. The board — threads worth answering

```sh
shipyard opportunities list <project-id>                    # live cards, best fit first
shipyard opportunities list <project-id> --view posted
shipyard opportunities mark <id> posted --reply-url <link to the user's own reply>
shipyard opportunities mark <id> dismissed
```

Each card is a thread where someone is asking about the problem the app solves, with
why it fits, a suggested first reply that helps and leaves the app out, and a tagged
link to use only if someone in the thread asks for the app.

**Shipyard never posts for anyone, and neither do you.** Show the user the thread and
the suggested reply, adjust it with them, and let them post it from their own account.
Never post to Reddit, Hacker News or anywhere else on their behalf. Once they have
posted, mark the card `posted` with the link to their reply so Shipyard watches it for
answers.

The board is a paid plan. If a command answers that the board needs a subscription,
say so once and point to https://goshipyard.app/pricing. Don't nag.

## Conventions & guardrails

- **Parse `--json`**, don't scrape output. Errors print to stderr as `✗ message`;
  non-zero exit means failure (exit 2 = bad usage, 1 = API/runtime error).
- **Target a server** with `--api-url` (or `$SHIPYARD_URL`) — e.g. `--api-url http://localhost:4001` for local dev. Default is `https://goshipyard.app`.
- **Confirm public actions** with the user first: listing an app, changing a listing,
  taking one down.
- **Never fabricate** pitches, reactions or results. Write from what was actually built.
- Reviews you can write, the wallet and review bounties ended with the first version of
  Shipyard; `shipyard reviews add` and `shipyard wallet` now say so.
- Full command help: `shipyard help`, or `shipyard <command> help`. Machine contract: `https://goshipyard.app/api/v1/openapi.json`.
