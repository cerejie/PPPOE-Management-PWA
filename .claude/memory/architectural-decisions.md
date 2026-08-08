# Memory — Architectural Decisions (standing)

Decisions that hold across **all** projects using this system. Per-project decisions go in `roadmap/DECISION_LOG.md` as ADRs.

| Decision | Rationale | Reversal cost |
|---|---|---|
| `.claude/` is the source of truth; applications conform to it | Makes the engineering system portable and the app disposable | — |
| Yarn as the only package manager | One lockfile, one resolution algorithm, no mixed-manager corruption | Cheap |
| TypeScript `strict`, no `any` | Types are the cheapest test suite; `any` silently disables it | Expensive once `any` spreads |
| Zod schemas as the source of truth for types | One definition covers runtime validation and static types; they cannot drift | Moderate |
| TanStack Query for server state, Zustand for client state | Mirroring server data into a client store is the most common source of stale-UI bugs | Moderate |
| Ant Design as the base component system, themed rather than replaced | Accessibility, breadth, and behaviour already solved; restyling is far cheaper than rebuilding | Expensive |
| Vanilla Extract for styling | Type-safe, zero-runtime, tokens enforceable at compile time | Moderate |
| Hybrid structure: type-based top level, feature slices inside | Pure type-based scatters a feature; pure feature-based duplicates shared code | Expensive |
| One-way dependency graph, slices entered only via `index.ts` | Prevents the coupling that makes large frontends unmaintainable | Expensive |
| Skills = how, Standards = what must be true | Prevents the same doctrine being written twice and drifting | Cheap |
| Mobile/PWA designed alongside desktop, never after | Retrofitting mobile onto a desktop-shaped information architecture requires a rewrite | Expensive |
| Additive, forward-only migrations; no destructive change without explicit instruction | Production data cannot be un-deleted | — |
| Idempotency keys on all create/charge operations | Retries over unreliable networks are normal, not exceptional | Moderate |

## Amending

Changing a row here requires an ADR in `roadmap/DECISION_LOG.md` referencing it. These are defaults for every future project — change them deliberately, not per-app.
