# Skill — Architecture

Use when: adding a feature, drawing a boundary, deciding where code lives, or resolving coupling.

## Dependency direction (the one rule that matters)

```
pages → components → hooks → services → api/ports → api/adapters → (network/db)
                       ↓         ↓
                    stores    schemas → types
```

Arrows point one way. A violation is a defect, not a style choice.

- `common/` must not import from any module.
- `components/x` must not import from `components/y`. If they need each other, the shared part belongs in `common/` or `services/`.
- `api/` must not import from `stores/`. Transport knows nothing about state.
- Nothing imports from `pages/`.
- **Nothing outside `api/adapters/` imports a backend SDK** — see `adapters/_ports.md`.

Machine-checked by `scripts/structure-lint.mjs` at conformance L3 and L5.

## Decide placement with three questions

1. **Who owns this rule?** One module → put it there. Two or more → it is a shared domain rule; lift it to `services/` or `shared/`.
2. **Would deleting the feature delete this?** Yes → it belongs inside the feature. No → lift it.
3. **Is it business logic or presentation?** Business logic never lives in a component.

Do not lift on the *first* duplication — lift on the second, when the shape is known. Premature sharing produces the wrong abstraction, which costs more than duplication.

## Modules

Business flows are organised by **module** — a business noun that owns its own
writes. A module's files are spread across the type-first folders
(`core/standards/project-structure.md`); the mandatory `@/` alias makes that
spread cost nothing, since a file's location is independent of every importer.

Cross-module communication goes through a service or the router — never by
reaching into another module's hooks or components.

## For every non-trivial change, think through

boundaries · responsibilities · dependency direction · data flow · state flow · failure modes · concurrency · performance · testability · migration cost · caching · sync · security

If a change affects **sync, caching, or security**, say so explicitly and design it deliberately. See `skills/platform.md` and `skills/security.md`.

## Anti-patterns

| Smell | Fix |
|---|---|
| `utils/helpers.ts` grab bag | Split by domain intent; name for what it does |
| Component >250 lines | Extract logic to a hook, sub-views to components |
| Service that both fetches and renders decisions | Split transport from policy |
| Business rule implemented in two places | Extract to one service; the second caller imports it |
| Circular import | The shared part is a third module — extract it |
| Store that mirrors server state | Use TanStack Query for server state; Zustand for client state |
| `any` at a boundary | The boundary has no contract — write the Zod schema |

## Contracts

Every boundary has an explicit contract: a Zod schema for data crossing the wire or a storage edge, a TypeScript interface for in-process calls. No implicit shapes. See `skills/data.md`.

## Escalate to an ADR

Record in `roadmap/DECISION_LOG.md` (via `templates/adr.md`) when a decision: adds a dependency, changes the dependency graph, changes a data model, changes auth or permissions, or would be expensive to reverse.
