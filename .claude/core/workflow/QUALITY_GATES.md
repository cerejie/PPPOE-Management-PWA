# Workflow — Quality Gates

A gate is a hard stop. Failing gate → the work is not done. Report honestly rather than claiming completion.

> **Gates run at the level declared in `PROJECT.md`**, not at the target
> (`core/standards/conformance.md`). A gate that cannot possibly pass gets ignored,
> and ignored gates are worse than no gates. New files are always held to the
> **target** level regardless — that is what stops the bleeding while a migration
> is in progress.
>
> Report as: *"Gates passed at L2 (declared). L3 blocked: 14 SDK imports outside
> `api/`."* Never a bare "gates passed".

## Gate 1 — Design (before code, for M and larger)

- [ ] Goal stated in one sentence
- [ ] Existing code checked for reuse
- [ ] Boundaries and dependency direction decided (`skills/architecture.md`)
- [ ] Data contract defined as a Zod schema
- [ ] Failure modes named
- [ ] Mobile behaviour decided for user-facing work
- [ ] Cache/sync/security impact stated if any

## Gate 2 — Implementation

- [ ] `standards/` for the touched layers satisfied
- [ ] No duplicated logic; no unused abstraction
- [ ] Types honest — no `any`, no escape-hatch assertions
- [ ] Errors handled; nothing swallowed
- [ ] Diff minimal and scoped

## Gate 3 — Verification

- [ ] `yarn lint` clean
- [ ] `yarn build` (or `tsc --noEmit`) clean
- [ ] `yarn test` passes; new behaviour and bug fixes have tests
- [ ] Change exercised in the running app for user-facing work
- [ ] Checked at the widths the active form-factor profile names (`profiles/mobile-first.md` → 375 first; `profiles/desktop-first.md` → 1440, 1024, 375, plus a mid width)
- [ ] Loading, empty, error, offline states verified — not just written

If a command was not run, say so. Never report a gate as passing on assumption.

## Gate 4 — Security (any sensitive surface)

- [ ] Authorisation enforced server-side, scoped to the record
- [ ] Input validated at the boundary
- [ ] No secret or PII in code, logs, responses, or client bundle
- [ ] Write is idempotent; concurrent writes conflict rather than overwrite
- [ ] Rate limiting where abuse is plausible

## Gate 5 — Record

- [ ] Significant decision → `roadmap/DECISION_LOG.md`
- [ ] Compromise accepted → `roadmap/TECH_DEBT.md` with the real fix described
- [ ] Deferred scope → `roadmap/BACKLOG.md`
- [ ] User-visible change → `roadmap/CHANGELOG.md`
- [ ] New convention settled → `memory/conventions.md`

## Honesty rule

Anything skipped, assumed, blocked, or failing is stated plainly in the response. A gate reported as passed must actually have been checked. Partial completion reported as complete is the worst failure mode in this system — worse than the incomplete work itself.
