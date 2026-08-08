# Workflow — Documentation

Documentation is **decision memory**, not volume. If a document does not change a future decision, it should not exist.

## What gets written

| Write | Because |
|---|---|
| Decisions and their rejected alternatives (`roadmap/DECISION_LOG.md`) | The reasoning is what disappears; the code stays |
| Non-obvious constraints (business rules, legal, integration quirks) | Cannot be recovered by reading the code |
| Domain vocabulary (`memory/conventions.md`) | Prevents three names for one concept |
| Accepted compromises (`roadmap/TECH_DEBT.md`) | Otherwise they look like bugs later |
| Setup/run steps a new machine needs (`README.md`) | Tacit knowledge |

## What does not get written

Descriptions of what the code does · API docs generated from types · restating the schema in prose · architecture diagrams that will drift within a month · meeting narrative · anything the tests already assert.

## Code comments

Comment **why**, never **what**. A comment explaining what the line does means the line needs a better name.

Worth a comment: a non-obvious business rule and its source · a workaround plus the upstream issue · a deliberate performance tradeoff · a security-relevant subtlety · an invariant a future editor could unknowingly break.

Never: commented-out code · changelog comments in the file (git has that) · restating the signature · `// TODO` without a `BACKLOG.md`/`TECH_DEBT.md` entry.

## Keeping it true

Documentation that contradicts the code is worse than none. When a change invalidates a document, update it in the same commit or delete the stale section. Prefer short living documents over comprehensive dead ones.

## Format

Structured over prose. Tables over paragraphs. Newest first in append-only logs. Absolute dates (`2026-08-06`), never "last week". Link between documents rather than duplicating content.
