# Standard — Frontend (checkable rules)

Every line here is verifiable against a diff. The *how* lives in `skills/frontend.md`.

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- No `any`. No `@ts-ignore` (use `@ts-expect-error` with a reason comment when genuinely unavoidable).
- No `as` to escape a modelling problem. `as const` and narrowing after a type guard are fine.
- Props typed with an explicit `<Component>Props` interface. No inline prop object types beyond two fields.
- `readonly` for arrays and props that must not be mutated.
- Discriminated unions over optional-field soup for variant state.
- Exported functions have explicit return types.

## React

- Function components only. No class components.
- One component per file. Sub-components used only by it may share the file if under ~40 lines.
- No component over 250 lines; no function over 50.
- Hooks at top level, never conditional.
- `useEffect` only for external synchronisation. No effect whose whole job is `setState` from props or state.
- No `useState` for business/domain state.
- Every list item has a stable id key.
- Cleanup returned from any effect that subscribes, times, or observes.

## State

- Server data: TanStack Query. Client shared state: Zustand. Form state: React Hook Form. Ephemeral UI: local state. URL-representable state: router search params.
- Zustand consumed via selector only.
- No derived state stored.
- Persisted store slices are explicit, minimal, and versioned.

## Styling

- Vanilla Extract `.css.ts` only. No CSS files, no styled-components, no Tailwind, no `style={{}}` except runtime-computed values.
- No hardcoded colours, spacing, radii, font sizes, or z-index — theme contract only.
- No `!important`.
- AntD customised via `ConfigProvider` theme tokens or a documented override, never by overriding internal class names.

## Components

- Presentational components take props and return JSX. No store, no fetching, no feature imports.
- No business rule inside a component. Extract to a hook or service.
- Every interactive element has an accessible name.
- Every async surface renders loading, empty, and error states.

## Data access

- Components never import `api/` directly. Path is `component → hook → service → api/ports`.
- **No backend SDK imported outside `src/api/adapters/`** (`adapters/_ports.md`). Lint rule `L3/sdk-escape`.
- All external responses parsed with Zod at the adapter boundary before use.
- Query keys structured and centralised per domain.
- Mutations invalidate specific keys.

## Forbidden

`console.log` in committed code (use the logger) · commented-out code · TODO without a `roadmap/BACKLOG.md` or `TECH_DEBT.md` entry · default exports for components · index files that re-export an entire folder · `dangerouslySetInnerHTML` with user-influenced content.
