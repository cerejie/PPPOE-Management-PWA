# Stack — React · AntD · Vanilla Extract

The default frontend profile. Pairs with `core/standards/frontend.md` (checkable
rules) and `core/skills/frontend.md` (how).

## Runtime

| Concern | Choice | Never |
|---|---|---|
| Build | Vite | CRA, Webpack by hand |
| Language | TypeScript `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` | `any` |
| Routing | TanStack Router | — |
| Server state | TanStack Query | Zustand for server data |
| Client state | Zustand, one store per domain, selector-only reads | Context for app state |
| Forms | React Hook Form + `zodResolver` | `useState` per field |
| Validation | Zod — **types derive via `z.infer`** | hand-written interfaces at boundaries |
| UI kit | Ant Design | hand-building what AntD ships |
| Styling | Vanilla Extract `.css.ts` under `src/styles/` | Tailwind, CSS files, `styled-components`, inline styles |
| Dates | Day.js | moment |
| Charts | Ant Design Charts | — |
| Local DB | Dexie (only with `profiles/offline-sync`) | raw IndexedDB |
| Tests | Vitest + Testing Library + MSW; Playwright for E2E | snapshot-everything |

Adding anything else requires an entry in `roadmap/DECISION_LOG.md`.
"It's popular" is not justification.

## State — the decision table

| The data is… | Use |
|---|---|
| Server-owned | TanStack Query |
| Shared client state | Zustand |
| Form fields | React Hook Form |
| **Derived** | **compute it — never store it** |
| Ephemeral UI (open/hover/focus) | local state |
| URL-representable (filter, tab, page, search) | router search params |

URL-representable state in a store is the most common mistake here: it breaks the
back button, sharing, and refresh all at once.

## Styling contract

Colours live in a theme contract as bare channel triples and are read through
`solid()` / `alpha()` helpers — never interpolated raw into a property, never a hex
value in a component. A `.css.ts` may only export serialisable values, which is
why those helpers live *beside* the contract rather than inside it.

Customise AntD through `ConfigProvider` tokens. Never fight it with `!important`
or by targeting internal class names.

## Offline caveat

With `profiles/offline-sync` active, **TanStack Query is not the read path** —
live queries against the local DB are. Query then has at most a narrow role (sync
status, server-only lookups). Do not reach for it for feature data; two caches
over the same data will disagree.

## Substituting

Swapping a row (React Router for TanStack Router, headless UI for AntD) is a
**stack profile fork**, not a per-project deviation: copy this file to
`stack/<name>.md`, change the row, record why in `DECISION_LOG.md`. Keeping one
profile honest beats fifteen projects each drifting quietly.
