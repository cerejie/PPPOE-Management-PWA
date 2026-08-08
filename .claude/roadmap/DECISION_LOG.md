# Decision Log

Project-specific ADRs, newest first. Use `templates/adr.md`. Cross-project standing decisions live in `memory/architectural-decisions.md`.

Accepted ADRs are never edited — supersede them instead.

---

## ADR-0004 — Stylesheets are grouped by type under `src/styles/`, not co-located with components

**Date:** 2026-08-08
**Status:** Accepted

**Context**
`skills/frontend.md` ("Component styles live next to the component as `.css.ts`") and `templates/component.md` ("Styles in a sibling `.css.ts`") both mandate co-location. That conflicts with this project's own organising principle, stated in `CLAUDE.md` §Structure: **the first level of `src/` is the technical type** — `hooks/`, `services/`, `types/`, `constants/`, `utils/` are each a type folder subdivided by module. `.css.ts` was the sole type that ignored that rule, so `components/<module>/<category>/` held two kinds of file and a module's styling surface could only be seen by walking the component tree.

**Decision**
Every `.css.ts` in the app lives under `src/styles/`, in one of four roots:

- `global/` — the shared sheets formerly in `common/styles/`, plus `Token.utils.ts` (style infrastructure with no other consumer).
- `app/` — layout shells (`MainLayout`).
- `common/<category>/` — for `common/components/<category>/`.
- `pages/<module>/` and `features/<module>/` — **the whole module's styling surface**: its page stylesheet at the root, secondary pages in a named subfolder (`clients/detail/`, `clients/form/`), and its component categories mirroring `components/<module>/<category>/`.

The split between the last two is **routed vs unrouted**, decided by `AppRoutes.tsx` alone. `pages/` holds modules the router can reach — including `sync`, which is routed at `/sync` but absent from the tab bar. `features/` holds the two modules with no route: `auth` (`LoginPage` is rendered directly by `App.tsx` when `!authenticated`, before the router exists) and `payments` (no screen at all, only `RecordPaymentSheet`, opened from the clients and dashboard pages). Both roots are subdivided identically, so promoting a module from one to the other is a one-segment path change.

`src/pages/` is nested by module in the same shape (`pages/clients/ClientsPage.tsx`, `pages/clients/detail/ClientDetailPage.tsx`), so pairing is one transform for pages and components alike: **drop the leading type segment, prepend `styles/<root>/`, keep the rest byte-for-byte.** Filenames never change — `PascalCase`, `.css.ts`, lowercase folders, per `standards/naming.md`. The single asymmetry is `auth`, whose sources sit at `pages/auth/` while its stylesheet is at `styles/features/auth/`, because `src/pages/` groups by module only and `src/styles/` also encodes routed-vs-unrouted.

This amends the two `.claude/` rules above **for this project only**; the co-location default stands for projects that do not organise `src/` by type.

**Alternatives considered**
| Option | Why not |
|---|---|
| Keep co-location (`.claude/` default) | Leaves `.css.ts` as the one type exempt from the type-first rule; component folders keep mixing two file kinds |
| Module folders as siblings of `pages/` (`styles/clients/` + `styles/pages/ClientsPage.css.ts`) | Splits one module's styling across two distant roots; answering "what does the clients screen look like?" means opening both |
| One root for everything (no `features/`) | `payments` has no screen and `auth` has no route, so filing both under `pages/` makes the folder name false for a fifth of the modules |
| `pages/` = tab-bar destinations, moving `sync` to `features/` | `sync` has a URL and a `<Route>`; a rule the router contradicts will not survive the next person reading `AppRoutes.tsx` |
| Move only `components/**`, leave pages and layouts co-located | Two contradictory rules to remember, and "where is this stylesheet?" stops having one answer |
| Flatten to `styles/pages/<module>/<Name>.css.ts`, dropping the category level | Style tree stops mirroring the component tree; the component pairing is no longer mechanically derivable |

**Consequences**
Positive: a component folder is `.tsx` only; one module's entire styling surface — page, sub-pages, cards, lists, sheets — is a single directory; the component `.tsx` ↔ `.css.ts` path is derivable in both directions without searching.
Negative: a component and its stylesheet are no longer adjacent in the editor tree — the standard cost of type-first layout, already paid for hooks, types and services. A new module means creating a folder before the first file, and a module that gains or loses a route has to move between `styles/pages/` and `styles/features/`. Vanilla Extract is unaffected: `.css.ts` compiles by extension, not location.
Reversal cost: cheap and mechanical — all style imports use the `@/` alias, so reversing is a move plus a path rewrite, exactly as the migration was.

**Verification**
The migration is provably style-neutral: a build of `HEAD` before the change and a build after produce CSS with the same 467 declaration blocks **in the same file order**, differing only in `Motion.css.ts`'s generated keyframe identifier (Vanilla Extract derives file-scope hashes from the module path, so a moved file necessarily renames its classes). Bundle size moved 44.01 → 44.16 kB purely from those identifier lengths.

**Affects**
All 56 `.css.ts` files, all 9 `src/pages/*.tsx`, every `.tsx` that imports either, `CLAUDE.md` §Structure + §Styles live apart from components + §Conventions, `README.md` structure block. Locally overrides `skills/frontend.md` §Styling and `templates/component.md`.

---

## ADR-0003 — PPPoE Manager PWA styles with Vanilla Extract and holds all state in Zustand

**Date:** 2026-08-08
**Status:** Accepted

**Context**
The app was built on Tailwind CSS with component state in `useState`. Two problems forced a change. Theme tokens lived in `index.css` and were reachable only through class-name strings, so a token rename was a text search across every `className`, and nothing type-checked. State was scattered: derived values were mirrored into `useState`, and each screen re-implemented its own form/busy/error handling, which is where the drift and the duplicated submit logic sat. The user's instruction was explicit — Tailwind out, "THERE MUST BE NO USESTATES" — and a React/TypeScript standards document arrived mid-migration requiring a ViewModel-hook split.

**Decision**
- Styling is **Vanilla Extract** (`@vanilla-extract/css` + `@vanilla-extract/vite-plugin`). One theme contract in `common/styles/Theme.css.ts`; colours stored as bare `R G B` triples and read through `solid()` / `alpha()` in `Token.utils.ts` (a `.css.ts` module may only export serialisable values, so the helpers cannot live in the contract file). Zero runtime cost, and a token is now a typed reference.
- State is **Zustand**, with three categories kept distinct: genuinely global → module-level store (`Auth.store.ts`, `Connectivity.store.ts`); per-component UI state → `useInstanceStore` from `common/stores/createInstanceStore.ts`, which creates one real store per mounted component so two open sheets cannot share a slice; DOM nodes and in-flight pointers → `useRef`, which is not state.
- Every screen and sheet is a **ViewModel hook plus a presentation component**.
- Tailwind, PostCSS and autoprefixer are removed from the project.

**Alternatives considered**
| Option | Why not |
|---|---|
| Keep Tailwind | Tokens stay untyped strings; the rename problem and the long `className` expressions the standards forbid both remain |
| CSS Modules | Typed only via a generator; no theme contract, no `styleVariants`, so variant logic drifts back into the component |
| Ant Design + theme tokens (the `.claude/` default stack) | This app is a mobile-first PWA with hand-built sheets and a tab bar already in place; adopting a desktop-oriented component library mid-life would be a rewrite, not a migration |
| Keep `useState`, add Zustand only for shared state | Leaves two state idioms in the codebase and keeps submit/validation logic inside components, which is what the standards document set out to remove |
| Redux Toolkit / Jotai | Heavier (RTK) or a different mental model (atoms) for no gain over a store-per-instance, which is exactly what was needed |

**Consequences**
Positive: theme tokens are type-checked; the palette flips in one file; forms share one busy/error shape; components are render-only and testable through their hook.
Negative / accepted cost: style files must be named `.css.ts`, deviating from the project's `<Thing>.<kind>.ts` convention (the compiler requires it); a `.css.ts` module cannot export functions; `useInstanceStore` is a bespoke primitive contributors must learn.
Reversal cost: expensive — it touches every component in `src/`.

**Affects**
`PPPOE-Management-PWA/`: all of `src/`, `package.json`, `vite.config.ts`; `CLAUDE.md` Structure and Conventions; `README.md` Stack and Structure.

---

## ADR-0002 — Split `.claude/` on the skills/standards axis instead of duplicating per-topic files

**Date:** 2026-08-06
**Status:** Accepted

**Context**
The original recommended structure paired `skills/<topic>.md` with `standards/<topic>.md` for frontend, backend, ui, performance, architecture, and naming, plus separate files for responsiveness, pwa, caching, sync, and offline-first. Those pairs would hold overlapping doctrine, and overlapping doctrine drifts. It also costs tokens to load two files describing the same subject.

**Decision**
Split on a functional axis, not a topical one:
- `skills/` = **how** to do the work (playbooks, decision procedures, judgement)
- `standards/` = **what** the code must satisfy (rules checkable against a diff)

Merged: responsiveness + PWA design → `skills/uiux.md`; caching + sync + offline + PWA runtime → `skills/platform.md`; database + API contracts + schemas → `skills/data.md`; ui + ux + accessibility → `standards/ui.md`; refactoring + debugging → `skills/refactoring.md`; milestones + phases → `roadmap/ROADMAP.md`.

**Alternatives considered**
| Option | Why not |
|---|---|
| Literal recommended tree (~45 files) | Guaranteed duplication between skill/standard pairs; higher load cost per task; more surface to keep true |
| Single large `CLAUDE.md` | Every task pays for every topic; no selective loading |

**Consequences**
Positive: each topic stated once; routing table can load 2–3 small files per task; less drift.
Negative: a reader looking for `skills/pwa.md` must consult the routing table. Mitigated by `CLAUDE.md` §4 being the only entry point anyone needs.
Reversal cost: cheap — splitting a merged file back out is mechanical.

**Affects**
`CLAUDE.md` §4, all of `skills/`, all of `standards/`.

---

## ADR-0001 — `.claude/` is a portable engineering system, not project documentation

**Date:** 2026-08-06
**Status:** Accepted

**Context**
The directory must be copyable into any future project across unrelated domains (ERP, SaaS, ISP, inventory, internal tools) without editing.

**Decision**
Everything in `.claude/` is domain-agnostic. Project-specific facts are confined to `memory/conventions.md` and `roadmap/`. Standing cross-project decisions live in `memory/architectural-decisions.md`. Applications conform to `.claude/`; `.claude/` is never modified to accommodate an application.

**Alternatives considered**
| Option | Why not |
|---|---|
| Project-specific rules inline in each skill | Makes the directory non-portable; the primary requirement |

**Consequences**
Positive: copy the folder, clear `memory/conventions.md` and `roadmap/`, and it works on the next project.
Negative: examples must use a generic domain, which is slightly less immediate than real ones.
Reversal cost: expensive.

**Affects**
The entire directory.
