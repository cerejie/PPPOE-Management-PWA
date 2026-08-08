# Skill — Performance

Use when: something is slow, or a change plausibly makes it slow. **Measure first.** An optimisation without a measurement is a guess that adds complexity.

## Order of investigation

1. Reproduce and measure. Get a number.
2. Find where the time actually goes (profiler, network panel, query plan, React Profiler).
3. Fix the largest contributor.
4. Re-measure. Keep the change only if the number moved.

Optimising the second-largest cost is wasted work.

## Usual suspects, in order of payoff

| Symptom | Usual cause | Fix |
|---|---|---|
| Slow list/detail page | N+1 queries | Batch or join |
| Slow query | Missing index / full scan | Read the plan, add the index |
| Slow first paint | Bundle size | Route-level code splitting, lazy-load heavy widgets |
| Janky typing/scroll | Re-render storm | Selectors, stable identities, split components |
| Repeated identical requests | No dedup/cache | TanStack Query defaults, correct keys |
| Large table lag | Rendering every row | Virtualise |
| Slow images | Unsized, unoptimised | Modern formats, explicit dimensions, lazy below the fold |
| Growing memory | Uncleaned subscriptions/timers | Clean up in effects |

## React specifics

- Subscribe to the narrowest slice: `useStore(s => s.field)`, not the whole store.
- Unstable object/array/function props defeat memoisation — stabilise the value, don't add `memo` on top.
- `React.memo`, `useMemo`, `useCallback` are for measured problems or for values feeding an expensive computation. Blanket memoisation costs more than it saves.
- Keys must be stable ids.

## Budgets (adjust per project, then hold)

Initial JS ≤200KB gzipped · LCP ≤2.5s on mid-tier mobile/3G · interaction response ≤100ms · p95 API read ≤300ms · no unbounded list endpoint.

Exceeding a budget is a `roadmap/TECH_DEBT.md` entry, not a shrug.

## Never

Cache to hide an N+1. Add a worker to hide a bad algorithm. Optimise before the feature is correct. Ship a "performance" change with no before/after number.
