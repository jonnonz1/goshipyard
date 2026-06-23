# Shipyard agent skills

Drop-in skills that teach a coding agent to drive the `shipyard` CLI — so you can
just say *"post this project to Shipyard"* or *"show me the reviews on my launch"*
and it does the rest.

> These files are generated from [`../cli/skills/`](../cli/skills) (the single
> source of truth, embedded into the CLI binary). Regenerate with `bun run skills:sync`.

| File | For | Installed to |
|---|---|---|
| [`SKILL.md`](./SKILL.md) | **Claude Code** | `~/.claude/skills/shipyard/SKILL.md` |
| [`cursor.mdc`](./cursor.mdc) | **Cursor** | `./.cursor/rules/shipyard.mdc` |
| [`../AGENTS.md`](../AGENTS.md) | any `AGENTS.md`-aware agent | `./AGENTS.md` |

## Install (recommended)

The CLI installs these for you, into the right place:

```sh
shipyard skills install            # Claude Code (global)
shipyard skills install --cursor   # Cursor rule (this project)
shipyard skills install --agents   # append to this project's AGENTS.md
shipyard skills install --all      # all three
```

Already have the file? Add `--force` to overwrite, or `--project` to install the
Claude skill into `./.claude` instead of your home directory.

## Install by hand

- **Claude Code:** copy `SKILL.md` to `~/.claude/skills/shipyard/SKILL.md`.
- **Cursor:** copy `cursor.mdc` to `.cursor/rules/shipyard.mdc` in your project.
- **Other agents:** paste the contents of [`../AGENTS.md`](../AGENTS.md) into your
  project's `AGENTS.md`.

Then start a fresh agent session so it picks up the skill.

## What the skill can do

Post a project, list/update/delete your postings, read and write reviews
(comments), like (upvote) projects, check your wallet balance, and recommend
loading credit to fund paid review bounties — all by running `shipyard` commands.
It's told to confirm public or irreversible actions with you first and never to
fabricate reviews.
