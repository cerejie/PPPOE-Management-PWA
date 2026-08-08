# Workflow — Development

## Phase order (mandatory)

```
Phase 0  Engineering system (.claude/)          ← permanent asset
Phase 1  Product discovery & requirements
Phase 2  Architecture & data model
Phase 3  UI/UX design
Phase 4  Backend & contracts
Phase 5  Frontend
Phase 6  Platform: caching, offline, sync, PWA
Phase 7  Testing & hardening
Phase 8  Deployment & observability
```

Never start a phase whose inputs the previous phase has not produced. Skipping discovery produces invented business rules — the most expensive class of defect here.

## Task loop

1. **Frame** — restate the goal in one sentence. If it needs two, it is two tasks.
2. **Locate** — find what already exists that solves part of it. Reuse beats create.
3. **Route** — load the `CLAUDE.md` §4 rows that apply. Nothing more.
4. **Design** — data flow, boundaries, failure modes, mobile behaviour. For anything non-trivial, state this before writing code.
5. **Slice** — break into independently correct steps.
6. **Implement** — smallest safe diff per step.
7. **Review** — `skills/review.md`.
8. **Record** — decision → `roadmap/DECISION_LOG.md`; deferred work → `BACKLOG.md`; compromise → `TECH_DEBT.md`; shipped change → `CHANGELOG.md`.

## Sizing

| Size | Meaning | Handling |
|---|---|---|
| **XS** | One file, obvious | Just do it |
| **S** | A few files, one boundary | Do it, then review |
| **M** | New component/service, existing patterns | Design step first |
| **L** | New feature slice or data model change | Written plan + ADR before code |
| **XL** | Cross-cutting or migration | Phase it; each phase independently shippable |

Anything L or larger that arrives as a single request gets broken into phases and confirmed before implementation.

## When requirements are unclear

Infer from the codebase and existing conventions first. Ask only when a wrong guess would be unsafe or would waste the work. **Never invent business rules** — invented rules look correct and fail silently in production.

When proceeding on an assumption, state it explicitly in the response.

## Commits

- One logical change per commit. Refactor and feature never share a commit.
- Message states intent, not mechanics: `prevent double-charging on retried payment submit`.
- No unrelated files, no formatting churn, no committed secrets or lockfile from the wrong package manager.
- Branch off `main`; never commit directly to `main` unless asked.
- Commit and push only when asked.

## Package management

Yarn only. `yarn`, `yarn add`, `yarn add -D`, `yarn remove`, `yarn dev`, `yarn build`, `yarn lint`, `yarn test`, `yarn dlx`. Never `npm`/`npx`/`pnpm`/`bun`. Translate any external doc's npm commands to Yarn before showing them.
