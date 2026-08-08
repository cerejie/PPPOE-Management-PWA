# Standard — Project Structure

**Hybrid type-first.** Level 1 is the technical **type**. Level 2 is the business
**module**. Inside `components/`, level 3 is the **category**.

Anything shared by more than one module lives in that type's `common/` folder.

This is the load-bearing standard of the whole system. It is machine-checked by
`scripts/structure-lint.mjs` — if a rule here is not lintable, say so explicitly
rather than leaving it to good intentions.

---

## 1. Top level

```text
src/
├── api/          # transport only. common/ (clients, db), adapters/, ports/, sync/
├── app/          # App.tsx, main.tsx, providers/, layouts/, config/env.ts
├── common/       # shared by EVERY module: components/<category>/, stores/, utils/
├── components/   # <module>/<category>/ — .tsx only, never a stylesheet
├── constants/    # <module>/<Thing>.constants.ts — typed config arrays, route builders
├── hooks/        # <module>/use<Thing>.ts — one topic per file
├── pages/        # <module>/<Name>Page.tsx — secondary pages nest
├── routes/       # AppRoutes.tsx, ProtectedRoutes.tsx
├── schemas/      # <module>/<Module>.schema.ts — Zod, the source of truth
├── services/     # <module>/<Module>.service.ts — ALL writes for that module
├── stores/       # <module>/<Name>.store.ts
├── styles/       # every .css.ts in the app — see §3
├── types/        # <module>/<Module>.types.ts — derived from schemas
└── utils/        # <module>/<Thing>.utils.ts
```

A module folder appears under a type **only when that module actually has files
of that type.** Never create empty scaffolding.

### Why type-first, not `features/`

A feature slice hides the fact that a module has five kinds of file. Type-first
makes "where does this go" a two-token decision (`type` + `module`) with no
judgement call, and it makes the styles mirror in §3 possible. The tradeoff —
one module's files are spread across folders — is paid back by the `@/` alias
rule in §5, which makes a file's location irrelevant to every importer.

---

## 2. Modules

Modules are business nouns, declared once in `memory/conventions.md`. A module is
not a screen and not a table — it is a bounded piece of the domain that owns its
own writes.

Routers, sub-entities, and lookup tables do **not** get their own module. They
live under the module that owns them. Splitting them out creates two modules that
can never change independently.

---

## 3. Styles live apart from components

`.css.ts` is a **type**, so it obeys the same level-1 rule as every other type:
there is exactly one place stylesheets live, and it is `src/styles/`.
A component folder holds `.tsx` and nothing else.

```text
src/styles/
├── global/            # Theme, Global, Form, Badge, Motion, A11y + Token.utils
├── app/               # for src/app/layouts/<Name>.tsx
├── common/<category>/ # for src/common/components/<category>/<Name>.tsx
├── pages/<module>/    # modules the router can reach
└── features/<module>/ # modules with no route of their own
```

### The one rule for finding a stylesheet

> Drop the leading type segment, prepend `styles/<root>/`, keep everything else
> byte-for-byte. `<root>` is `pages` for a routed module, `features` for an
> unrouted one.

```text
pages/clients/detail/ClientDetailPage.tsx ↔ styles/pages/clients/detail/ClientDetailPage.css.ts
components/clients/cards/PauseCard.tsx    ↔ styles/pages/clients/cards/PauseCard.css.ts
components/payments/sheet/RecordSheet.tsx ↔ styles/features/payments/sheet/RecordSheet.css.ts
pages/auth/LoginPage.tsx                  ↔ styles/features/auth/LoginPage.css.ts
```

Filenames never change — same `PascalCase`, same `.css.ts`.

**`pages/` means routed, not tab-bar.** A module belongs in `styles/pages/` if the
router maps a URL to one of its screens — regardless of how the user reaches it.
Making `pages/` mean "tab destination" would be a rule the router itself does not
follow.

`features/` is for modules with no route at all: a login screen rendered directly
by `App.tsx` before the router exists, or a module that is only ever a sheet
opened from somewhere else.

Both roots are subdivided identically, so a module moves between them by changing
**one path segment**. Give an unrouted module a route and the fix is
`features/x/` → `pages/x/`.

Style infrastructure that is not itself a stylesheet (token readers, sprinkle
builders) sits in `styles/global/` beside the contract it reads.

---

## 4. File naming

| Kind | Pattern | Example |
|---|---|---|
| Page | `<Name>Page.tsx` | `ClientsPage.tsx` |
| Modal flow | `<Name>Sheet.tsx` in `components/<module>/sheet/` | `RecordPaymentSheet.tsx` |
| Component | `PascalCase.tsx` | `ClientCard.tsx` |
| Stylesheet | `PascalCase.css.ts` under `styles/` | `ClientCard.css.ts` |
| Hook | `use<Thing>.ts` | `useClientLedger.ts` |
| Store | `<Name>.store.ts` | `Auth.store.ts` |
| Service | `<Module>.service.ts` | `Clients.service.ts` |
| Schema | `<Module>.schema.ts` | `Clients.schema.ts` |
| Types | `<Module>.types.ts` | `Clients.types.ts` |
| Constants | `<Thing>.constants.ts` | `ClientRoutes.constants.ts` |
| Utils | `<Thing>.utils.ts` | `ClientLedgerPdf.utils.ts` |
| Port | `<capability>.port.ts` | `crud.port.ts` |
| Test | `<subject>.test.ts(x)` | `Clients.service.test.ts` |

**Named exports only.** There is not a single `export default` in `src/`.

---

## 5. Imports

Every import uses the `@/` alias — `@/hooks/plans/usePlans`, never a relative
path. A file's location is then independent of who imports it, which is what
makes type-first splitting cost nothing.

The single exception is a file importing its own co-located sibling in the same
folder.

---

## 6. Dependency direction

```text
pages → components → hooks → services → api/ports → api/adapters → network
                       ↓         ↓
                    stores    schemas → types
```

- `common/` must not import from any module.
- `components/x` must not import from `components/y` — lift the shared part to `common/`.
- `api/` must not import from `stores/`. Transport knows nothing about state.
- Nothing imports from `pages/`.
- **Nothing outside `api/adapters/` may import a backend SDK.** See `adapters/_ports.md`.

A violation is a defect, not a style choice.

---

## 7. The two hard architectural rules

1. **Every screen and sheet is a ViewModel hook + a presentation component.**
   The hook (`hooks/<module>/use<Thing>.ts`) owns state, derived values, effects
   and submit logic, and returns an explicitly exported interface. The component
   renders it and nothing else.
2. **All writes for a module live in `services/<module>/<Module>.service.ts`** —
   one file per module, not per screen. A component never writes directly.

---

## 8. Repeated JSX is a config array

A typed array in `constants/<module>/` beats duplicated markup — stat cards,
filter chips, nav links. Route strings live there too, as builders, so every
screen linking into a list uses the same builder and links cannot drift from the
query parameters the list actually reads.

---

## 9. Hard limits

Component ≤250 lines · function ≤50 lines · nesting ≤3 · folder ≤~15 files before
sub-grouping.

---

## 10. Forbidden

`utils/helpers.ts` / `misc.ts` dumping grounds · a `.css.ts` outside `src/styles/`
· a relative import crossing a folder · `common/` importing a module ·
`api/` importing `stores/` · circular imports · barrel files that re-export a
whole folder · `export default` · a backend SDK imported outside `api/adapters/`.
