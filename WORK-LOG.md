# Work log

## 2026-11-10 — 0.4.0 for the relaunched Shipyard

- goshipyard.app moved to a new app on 2026-11-09. Reviews you could write, the
  wallet and review bounties ended with v1, and the board (threads where people ask
  about what an app does, each with a suggested reply) arrived. 0.3.0 failed the
  contract gate against the live API, so no release could be cut.
- Removed `wallet`, `reviews add` and `reviews mine`; each now says it ended with v1
  instead of calling the API. `reviews list` became `reactions`, with the old name
  kept as an alias. Added `opportunities list` and `opportunities mark` over the two
  board endpoints. `projects delete` is a take-down and handles the 204 the API
  returns, which 0.3.0 crashed on after the take-down had succeeded.
- Screenshots go in the documented `images` field, cover first. 0.3.0 sent v1's
  `hero` and `extra`, which the new app ignored until it was changed to accept both.
- `openapi.json` is the new app's spec (API 2.0.0). The gate requires the eleven
  operations the CLI uses and seeded/member provenance on `Reaction`.
- Embedded guidance rewritten and regenerated: the board, that nothing is ever
  posted for the user, keys at /account. README, CLI readme and MCP guide (nine
  tools) match.
- No production content, account settings or billing changes. No release tag or
  binary publication. The matching app change (provenance declared on `Reaction`,
  v1 upload field names accepted) must be deployed before `cli-v0.4.0` is tagged.

## 2026-09-09 — review provenance and release safeguards

- Prepared CLI 0.3.0 with a SOURCE column and additive JSON types for
  review_source / reviewer_is_seed. Older servers remain readable and display
  unknown, never an assumed human endorsement.
- Added contract fixtures/tests, version/tag validation, PR/main CI and a
  release dependency on those checks. Bun is pinned to 1.3.14; installs are
  frozen and audited. CI verifies generated agent guidance and builds/smokes
  the standalone CLI.
- Release publication additionally checks the deployed public OpenAPI contract.
  The matching app change must be deployed before tagging the new CLI release.
  The live pre-update API correctly fails this gate; the updated app passes.
- Updated MCP connection docs for nine tools, owner review replies, offset
  pagination, review provenance and the actual CLI/MCP capability differences.
  Updated embedded guidance and regenerated browsable copies.
- Full checks pass: 29 tests, typecheck, lint, formatting and contract/version
  checks. Standalone 0.3.0 builds and prints help/version. A local cross-repo
  smoke against the actual updated app confirms text and JSON review output.
- No production content, account settings or billing changes. No release tag
  or binary publication. Pending PR review and CI, then app deployment before
  an explicitly approved CLI release.
