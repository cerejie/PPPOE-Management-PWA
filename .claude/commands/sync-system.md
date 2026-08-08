---
description: Report or pull drift between this project's .claude/ and the upstream claude-system.
---

Run `node scripts/sync-system.mjs` and report the result.

Read the output carefully before suggesting `--pull`:

- **new upstream** — files this project does not have yet. Safe to pull.
- **locally modified or upstream-updated** — ambiguous, and the important column.
  A shared file that differs is either an upstream improvement or **local drift**,
  which is forbidden by `README.md`. For each, check whether the local version
  contains a project-specific edit. If it does, that edit belongs in `PROJECT.md`,
  `memory/`, or upstream — never in a local copy of `core/`.
- **local-only** — never removed automatically. Usually a project-specific file
  that was misfiled into a shared directory.

Then recommend one of: pull, fix upstream first, or move a local edit to
`PROJECT.md`/`memory/`.

Do not run `--pull` without saying which files it will overwrite.
