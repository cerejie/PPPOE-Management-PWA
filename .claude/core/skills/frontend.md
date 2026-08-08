# Skill — Frontend

Use when: building or changing anything in `src/` that renders or holds client state.
Pairs with `skills/uiux.md` (how it should look and behave) and `standards/frontend.md` (what the code must satisfy).

## Component shape

Three kinds, kept distinct:

| Kind | Owns | Never |
|---|---|---|
| **Page** (`pages/<module>/`) | Rendering its ViewModel hook, layout composition | Business rules, deep JSX |
| **Container** (`components/<module>/<category>/`) | Wiring a hook → presentation | Raw styling decisions |
| **Presentational** (`common/components/<category>/`) | Props in, JSX out | Store access, fetching, module imports |

A presentational component that imports a store has become a container. Move it.

**Every screen and sheet is a ViewModel hook + a presentation component.** The
hook (`hooks/<module>/use<Thing>.ts`) owns state, derived values, effects, and
submit logic and returns an explicitly exported interface; the component renders
it and nothing else.

## State — the decision table

| The data is… | Use |
|---|---|
| Server-owned (fetched, cached, refetchable) | **TanStack Query** — not Zustand |
| Shared client state across components/routes | **Zustand** store |
| Form field values | **React Hook Form** — not Zustand, not `useState` |
| Derived from other state | **Compute it.** Never store it |
| Ephemeral UI (open/closed, hover, focus) | Local `useState` |
| URL-representable (filters, tab, page, search) | **Router search params** — so it is shareable and back-button correct |

Never mirror server data into Zustand. Never duplicate derived state. Never use Context for app-wide state.

### Zustand rules
- One store per domain, small and explicit. Not one global store.
- Actions are named for intent (`applyPayment`, not `setState`).
- Components subscribe with **selectors**: `useBillingStore(s => s.invoices)` — never the whole store.
- Persist only what must survive reload, and version the persisted shape.
- Async work lives in services; stores call services, they do not contain fetch logic.

## Forms

React Hook Form + `zodResolver`. The Zod schema is the single source of truth — the TS type is `z.infer<typeof schema>`.

- Validate on blur, revalidate on change after first submit attempt.
- Server-side validation errors map back onto fields via `setError`; never only a toast.
- Disable submit while pending; never rely on the user not double-clicking. Submissions must be idempotent server-side too.
- Long forms on mobile: sectioned or stepped, sticky primary action, never a wall of inputs.

## Data fetching

Components never touch transport. `component → hook → service → api/ports → api/adapters`.
- `api/ports/` declares capability interfaces; `api/adapters/<backend>/` is the **only** place an SDK appears (`adapters/_ports.md`).
- `services/<module>/` holds business-meaningful operations and parses responses through Zod.
- With `profiles/offline-sync` active, reads come from the local store and **every** write goes through the outbox — Query is not the read path.
- Query keys are structured and centralised per domain: `['invoices', 'list', filters]`.
- Mutations invalidate precisely. Blanket cache clears are a smell.

## Rendering & effects

- `useEffect` is for synchronising with something outside React. Deriving values, transforming props, or reacting to state changes are not that.
- Memoise only after measuring, or when a value is a dependency of something expensive. `useMemo` on a string concat is noise.
- Stable keys from stable ids. Never array index for reorderable lists.
- Lists over ~100 rows: virtualise.
- Route-level code splitting by default; heavy widgets (charts, editors) lazy-loaded.

## Styling

Vanilla Extract only. AntD theme tokens for colour/spacing/radius/typography — no hardcoded hex or px in components.
- Shared design decisions live in `styles/` as contract + sprinkles.
- Component styles live next to the component as `.css.ts`.
- No `style={{...}}` except for values computed at runtime.
- Never fight AntD with `!important`; use the theme/`ConfigProvider` or a proper token override.

## States every view must handle

loading · empty · error (with a retry path) · offline · unauthorised · partial/degraded

Skeletons over spinners for content-shaped loading. Empty states say what to do next, not just "no data".
