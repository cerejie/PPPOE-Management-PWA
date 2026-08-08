# Skill — Review (self-review before every completion)

Run this before reporting a task done. Check only the sections that apply — but check them honestly. If something fails, fix it or state plainly that it is outstanding and why.

## Always

- [ ] Solves the actual request — not narrowed, not silently widened
- [ ] Root cause addressed, not a symptom
- [ ] Existing behaviour preserved
- [ ] No duplicated logic introduced; existing code reused where it fit
- [ ] No abstraction added without a present need
- [ ] Diff is minimal — no unrelated edits, no reformatting churn
- [ ] Naming follows `standards/naming.md`; files are where `standards/project-structure.md` says
- [ ] Types are honest: no `any`, no assertion papering over a modelling gap
- [ ] Errors handled, not swallowed; messages are useful and safe
- [ ] No secrets, tokens, or PII in code, logs, or responses

## If it touches the UI

- [ ] Loading, empty, error, offline states exist
- [ ] **Run the review checklist of the active form-factor profile** — `profiles/mobile-first.md` or `profiles/desktop-first.md` (see `PROJECT.md`). It specifies the widths to check and the primary input to verify.
- [ ] Works at every declared breakpoint with no horizontal scroll; tables have a real pattern below 768px
- [ ] Spacing, colour, radius from theme tokens — no hardcoded values
- [ ] Keyboard reachable, focus visible, inputs labelled, errors not colour-only
- [ ] AntD component used rather than rebuilt

## If it touches state

- [ ] Server state in TanStack Query, client state in Zustand, ephemeral in local state
- [ ] No derived value stored
- [ ] Selectors used; no whole-store subscriptions
- [ ] Persisted state is versioned and minimal

## If it touches data or an API

- [ ] Input validated at the boundary; unknown fields rejected on writes
- [ ] Authorisation checked at the data layer, scoped by owner/tenant
- [ ] Writes idempotent; multi-write operations transactional
- [ ] Pagination bounded
- [ ] No N+1; indexes exist for what is filtered/joined/sorted
- [ ] Migration is additive and non-destructive

## If it touches cache or sync

- [ ] Invalidation path is explicit and narrow
- [ ] Offline behaviour chosen deliberately and surfaced to the user
- [ ] Queued writes are durable, idempotent, ordered, and visible on failure

## Before writing the reply

- [ ] Response shows the diff and what matters, not unchanged code
- [ ] Anything skipped, assumed, or left broken is stated explicitly
- [ ] Follow-up work worth doing is recorded in `roadmap/BACKLOG.md` or `TECH_DEBT.md`, not buried in prose
