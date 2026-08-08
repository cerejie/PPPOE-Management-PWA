# Migration milestone — restructure + Vanilla Extract + Zustand

**Status:** complete. `yarn typecheck` and `yarn build` pass; Tailwind is gone.
**Branch:** `development` (uncommitted working tree)
**Last updated:** 2026-08-08 (6a–6e finished)

The rules this migration established now live in [CLAUDE.md](CLAUDE.md)
(*Structure*, *Conventions*) and in `.claude/roadmap/DECISION_LOG.md` (ADR-0003,
which records why zustand + vanilla-extract). This file is the record of the
migration itself; nothing here is outstanding.

---

## 1. What was asked

Three cumulative instructions from the user:

1. **Restructure `src/`** to the tree in §2. Naming: *"prefix reusable logic with
   the action instead of the UI element"* — `useDashboardTable.ts`, `DashboardTable.constants.ts`,
   `DashboardTable.types.ts`, `DashboardTable.utils.ts`, `DashboardTable.service.ts`,
   `DashboardTable.store.ts`.
2. **Tailwind → Vanilla Extract**, and **remove every `useState`; use only Zustand.**
   Stated emphatically: *"THERE MUST BE NO USESTATES"*.
3. **Apply a React + TypeScript coding standards document** (§4), which arrived mid-work.

Four decisions the user made when asked:

| Question | Answer |
|---|---|
| What about `src/api/`? | Keep it as an extra top-level type alongside the requested tree |
| Which modules to scaffold? | Existing only. No empty folders |
| Pages layout? | Flat `src/pages/`, rename `*Screen.tsx` → `*Page.tsx` |
| Execution? | Full migration in one pass |

---

## 2. Final structure

```
src/
  api/          transport — common/{supabaseClient,db}, sync/syncEngine   (unchanged, kept)
  app/          App.tsx, main.tsx, providers/, layouts/, config/
  common/       components/{badges,buttons,inputs,layout,notices,overlays}
                stores/, styles/, utils/
  components/   <module>/<category>/          e.g. payments/sheet/, clients/cards/
  constants/    <module>/<Thing>.constants.ts
  hooks/        <module>/use<Thing>.ts
  pages/        <Name>Page.tsx  (flat) + co-located <Name>Page.css.ts
  routes/       AppRoutes.tsx, ProtectedRoutes.tsx
  services/     <module>/<Module>.service.ts
  stores/       auth/Auth.store.ts
  types/        <module>/<Module>.types.ts
  utils/        <module>/<Thing>.utils.ts
```

**One deliberate deviation from the user's naming scheme:** style files are `.css.ts`,
not `.styles.ts`. Vanilla Extract requires that suffix to compile. Everything else follows
`<Thing>.<kind>.ts`.

Every import uses the `@/` alias. No relative paths, no `export default` anywhere in `src/`.

---

## 3. Architectural decisions made during the migration

### Styling
- `src/common/styles/Theme.css.ts` — `createGlobalThemeContract` + `createGlobalTheme`;
  dark mode swaps tokens via `assignVars` inside `@media (prefers-color-scheme: dark)`.
  **The single place the palette flips.**
- Colours are stored as bare `R G B` triples so alpha can be applied at the point of use.
- `src/common/styles/Token.utils.ts` — `solid(triple)`, `alpha(triple, a)`, `accentGradient`.
  **These live outside `Theme.css.ts` because a `.css.ts` module may only export
  serialisable values** — it is evaluated at build time and cannot carry a function into
  the bundle. Getting this wrong produces:
  `Invalid exports. You can only export plain objects, arrays, strings, numbers and null/undefined`.
- Radius tokens map the old Tailwind scale: `sm` 0.5rem, `md` 0.75rem, `lg` 1rem (`rounded-2xl`),
  `xl` 1.5rem, `xxl` 2rem, `pill` 9999px. **Card surfaces use `xxl`** — every converted
  file does, including the ones whose Tailwind original said `rounded-3xl`.
- Other shared sheets: `Global.css.ts` (resets, select chevron, iOS 16px inputs),
  `Motion.css.ts` (`sheetIn`, `fadeIn`, `signal`, `halo`, each with a
  `prefers-reduced-motion` fallback), `Form.css.ts`, `Badge.css.ts`, `A11y.css.ts` (`srOnly`).

### State
- **`src/common/stores/createInstanceStore.ts` is the key mechanism.** A module-level
  `create()` store is shared by every importer — correct for domain state, wrong for UI
  state (two open Sheets would fight over one slice). `useInstanceStore(initial)` creates a
  real Zustand store per mounted component and keeps it in a ref. Selectors, `useShallow`,
  and subscriptions all behave normally.
- Three categories, kept distinct:
  - **genuinely global** → module-level store (`Connectivity.store.ts`, `Auth.store.ts`)
  - **per instance** → `useInstanceStore` (Sheet drag, Calendar view, every form)
  - **not state at all** → `useRef` (DOM nodes, in-flight pointer during a drag)
- `Auth.store.ts` replaced the old React Context. It preserves the entire offline-auth
  contract: `sync_meta.auth_user_id` fallback when `getSession()` returns null offline,
  only a Supabase `SIGNED_OUT` clears it, `is_active` checked on restore and sign-in,
  sign-out blocked offline. `useLiveQuery` for `appUser` became Dexie
  `db.app_users.hook('updating'|'creating')`. The sync engine starts from
  `useAuthStore.subscribe` **outside React**, guarded by a `syncStarted` flag.

### ViewModel pattern (from the standards doc)
Each screen/sheet has a hook that owns state, derived values, effects and submit logic.
The component renders and nothing else. Convention: `hooks/<module>/use<Thing>.ts`
returning an explicit exported interface.

### Navigation
Navigation is a `<Link to>`; a callback prop is for genuine actions. Route strings live in
`constants/clients/ClientRoutes.constants.ts` and `constants/settings/ManageLinks.constants.ts`,
so a link cannot drift from the query parameters `useClientsPage` reads.

---

## 4. The coding standards followed (user-supplied)

- **Architecture** — presentation-focused components; business logic, validation, effects,
  derived state and submit logic go into feature-specific hooks (ViewModel). One
  responsibility per file. Composition over large components.
- **File order** — imports → constants → types → helper functions → component
  (state → queries/hooks → derived → effects → handlers → render).
- **Components** — ~150–200 lines max, extract reusable UI, avoid deep JSX nesting, early returns.
- **State** — only genuinely mutable state is stored; derive everything else. No duplicated
  state. `useMemo`/`useCallback` only when measurably beneficial.
- **Configuration** — typed object arrays over switch statements or duplicated JSX. No
  positional/2D arrays.
- **TypeScript** — strict, no `any`, explicit interfaces, types close to the feature.
- **Naming** — descriptive, no abbreviations; function names describe actions.
- **Functions** — small, extract repeated logic, prefer pure.
- **Comments** — only non-obvious business rules. No narration.
- **Styling** — clean JSX, no long `className` expressions; extract reusable styles.
- **General** — readability, maintainability, scalability. Predictable over clever.

---

## 5. What shipped

**Foundation**
- `zustand` + `@vanilla-extract/css` + `@vanilla-extract/vite-plugin` installed (Yarn);
  `vanillaExtractPlugin()` added after `react()` in `vite.config.ts`
- `index.html` script src → `/src/app/main.tsx`
- `src/app/config/env.ts` — validated env with a `required()` helper
- `src/app/providers/QueryProvider.tsx`, `src/app/layouts/MainLayout.tsx` (+ `.css.ts`),
  `src/routes/AppRoutes.tsx`, `src/routes/ProtectedRoutes.tsx`
- Whole tree restructured with `git mv` (history preserved), all `@/` imports rewritten

**Converted to VE + zero `useState`**
- All of `common/components`: `Screen`, `TabBar`, `AppSplash`, `ExpiryBadge`, `StatusDot`,
  `SyncBadge`, `Fab`, `OfflineNotice`, `Sheet`, `ConfirmDialog`, `Calendar`, `DateField`,
  `SearchSelect`, plus `EmptyState`, `LoadingNotice`, `FilterChip`, `SearchInput`,
  `SelectField`, `SectionCard` extracted during the page conversions
- Sheets: `PauseSheet`, `RoomFormSheet`, `PlanFormSheet`, `SyncChip`,
  `RecordPaymentSheet`, `LedgerSheet` (+ `LedgerRow`), `MikrotikSection`
- Pages: all nine — `LoginPage`, `DashboardPage`, `ClientsPage`, `ClientDetailPage`,
  `ClientFormPage`, `PlansPage`, `RoomsPage`, `SettingsPage`, `SyncPage`

**ViewModel hooks**
`useRecordPaymentForm`, `useLedgerSheet`, `useMikrotikSettings`, `useLoginForm`,
`usePlansPage`, `usePlanClientCounts`, `usePlanForm`, `useRoomsPage`, `useRoomRows`,
`useRoomForm`, `useSyncPage`, `useOutboxSubject`, `useDashboardPage`, `useClientsPage`,
`useClientDetailPage`, `useClientForm`, `usePauseForm`, `useSettingsPage`,
`useRenameUserForm`, `useStaffSection`

**Sub-components extracted**
`dashboard/{cards/StatCard, widgets/RevenueHero, lists/ExpiringClientRow}`,
`clients/{lists/ClientListItem, cards/ConnectionCard, cards/PauseCard,
cards/ClientProfileCard, cards/LedgerSummaryCard}`,
`settings/{cards/ProfileCard, forms/NameEditor, buttons/EditNameButton,
lists/ManageLink, lists/StaffRow, sections/StaffSection}`

**Constants / utils extracted**
`payments/RecordPayment`, `clients/{ClientLedger, ClientRoutes, ClientFilters,
ClientProfile, ClientForm}`, `sync/Outbox`, `dashboard/DashboardStats`,
`settings/ManageLinks`; `utils/payments/PaymentAmount`, `utils/clients/ClientLedger`,
`utils/sync/Outbox`

**Tailwind removed**
`yarn remove tailwindcss postcss autoprefixer`; deleted `tailwind.config.js`,
`postcss.config.js`, `src/index.css`; dropped the `@/index.css` import from
`app/main.tsx` and the migration shim from `common/styles/Form.css.ts`.

---

## 6. Verification

```
yarn typecheck                    # passes
yarn build                        # passes
grep -rn "useState" src/          # one hit: a comment in createInstanceStore.ts
grep -rn 'className="' src/       # zero
```

Not verified by hand: runtime behaviour in a browser. The conversions preserved
markup and class-for-class styling, but a visual pass on the four pages converted
last (`ClientsPage`, `ClientDetailPage`, `ClientFormPage`, `SettingsPage`) is
still worth doing before this is merged.

---

## 7. Standing project rules (from CLAUDE.md — still in force)

- **Yarn only.** Never `npm` / `npx` / `pnpm` / `bun`
- Never run or generate DB migrations automatically — propose and wait for approval
- Never edit an existing `db.version(n).stores()` block; add a new version
- Never add `runtimeCaching` for Supabase in `vite.config.ts`
- Never emit `₱` into a PDF — use the `PHP `-prefixed helper in `ClientLedgerPdf.utils.ts`
- Never treat a paused client as expiring
- Never make the tab bar `position: fixed`
- Never allow `app_users.username` to be edited
- **Every write goes through the outbox** — never call `supabase.from(...)` insert/update
  from a page or service file
- Secrets never appear in code, logs, errors, or responses
