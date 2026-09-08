# Work log

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
