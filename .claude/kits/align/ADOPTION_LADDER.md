# Kit — Align (existing project)

Adopting this system must **never** be a big-bang rewrite. That would violate the
system's own rule 7 (patch, don't regenerate) on the largest possible scale, and
it is how adoption efforts die.

Instead: climb rungs. **Every rung ends green and ships. No rung requires the next.**
Stopping at L2 forever is a legitimate outcome — the project is still better than
it was, and nothing is half-migrated.

Levels are defined in `core/standards/conformance.md`.

---

## Rung 0 → L1 · Freeze  (½ day, zero risk)

Install `.claude/` + harness. Declare `conformance: L1`, `target: L5`.

Nothing existing is touched. From now on, **new** code is held to the target level
by the post-write hook, and `npm` is mechanically impossible.

> This rung alone captures most of the value. The bleeding stops the same day.

## Rung 1 → L2 · Alias  (codemod, mechanical)

Every cross-folder relative import becomes `@/`. Pure mechanical transform, no
behaviour change, reviewable by grep.

Do this before any file moves — with `@/` in place, **moving a file no longer
touches its importers**, which is what makes rung 4 cheap instead of terrifying.

## Rung 2 → L3 · Bound the backend  ← *the portability rung*

1. Define `api/ports/` from `adapters/_ports.md`.
2. Write the adapter for the current backend in `api/adapters/<name>/`.
3. Replace direct SDK calls, module by module. `structure-lint --level L3` lists
   every remaining escape.
4. Add `app/config/backend.ts`.

**This is where "works with any backend" actually arrives.** Everything above is
preparation; everything after is polish. If you do one substantial rung, do this one.

## Rung 3 → L4 · Contracts

Zod schema per boundary; parse at the adapter edge. Kill `any`. Turn on
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` — expect a burst of
real, latent null bugs. Fix them one module at a time.

## Rung 4 → L5 · Structure

Move files to the target layout, **one module per PR**. Because of rung 1, each
move is a path change with no importer churn.

Order within a module: `types` → `schemas` → `services` → `hooks` → `components`
→ `pages` → `styles`. Stylesheets move last; the mirror rule makes their
destination mechanical.

Then split oversized components into hook + presentation
(`core/standards/project-structure.md` §7).

## Rung 5 → L6 · Tests

Cover the risky paths first — money, permissions, data integrity, and every bug
you fix from here on. Coverage percentage is not the goal.

---

## Rules for the climb

- **One rung per branch.** Never mix a rung with a feature.
- Promote the level in `PROJECT.md` **only after** the rung's lint is green — the
  migration lands first, the promotion is the final commit.
- A rung that stalls is recorded in `TECH_DEBT.md` with what blocked it. A rung is
  never silently abandoned.
- Report progress as a level, never as "gates passed"
  (`core/standards/conformance.md` §Reporting).
