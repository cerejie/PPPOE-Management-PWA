# Standard — Conformance Levels

A gate that cannot pass gets ignored, and a system whose gates are ignored is
decoration. Existing projects therefore **declare a level**, and quality gates are
evaluated against the declared level — not against the target.

Declared in `.claude/PROJECT.md`:

```yaml
conformance: L2
target: L5
adapter: supabase
profiles: [offline-sync, pwa]
```

---

## The levels

| L | Name | Means | Gates enforced |
|---|---|---|---|
| **L0** | Unmanaged | System installed, nothing adopted. Baseline only. | none |
| **L1** | Frozen | Harness active. **New** code conforms; old code untouched. | lint + typecheck on changed files |
| **L2** | Aliased | `@/` imports everywhere; no cross-folder relative paths. | + import lint, repo-wide |
| **L3** | Bounded | Backend SDK confined to `api/adapters/`; ports defined. | + adapter-boundary lint |
| **L4** | Contracted | Zod at every boundary; no `any`; strict TS flags on. | + type gates, Gate 1 data contract |
| **L5** | Structured | Full structure standard: type-first layout, styles mirror, hook+component split, service-owned writes. | + full `structure-lint` |
| **L6** | Tested | Risky paths covered; `yarn test` real and green. | + Gate 3 in full |

**Rungs are ordered but independently shippable.** Each ends green. Nothing forces
the next one.

## Rules

1. A project may never *lower* its declared level to make a gate pass. Fix the
   code or record the exception in `TECH_DEBT.md`.
2. New files are held to the **target** level regardless of the declared level.
   That is the whole point of L1 — stop the bleeding first.
3. `structure-lint` reads `conformance:` and runs only that level's rules.
4. Raising a level is a deliberate commit that touches `PROJECT.md` and nothing
   else. The migration lands first; the promotion is the last step.

## Reporting

Never report "quality gates passed". Report the level:

> Gates passed at **L2** (declared). L3 blocked: 14 direct `supabase-js` imports
> outside `api/` — listed in `ALIGNMENT_REPORT.md §3`.

That sentence is honest, actionable, and shows the distance left. A bare "passed"
against a target the project has not reached is the failure mode this file exists
to prevent.
