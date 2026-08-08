# Alignment Report — PPPOE-Management-PWA   2026-08-08

## Verdict

Currently satisfies **L2**. Declared in `.claude/PROJECT.md`: **L1**. Recommended target **L3**. Reaching it: **3 PRs**.

The code is a level ahead of its own declaration. `structure-lint` is clean at L1 and at
L2 across all 180 files, `yarn typecheck` passes with zero errors, there are **0** relative
imports, **0** uses of `any`, **0** `export default`, **0** `useState`, and **0** file-level
import cycles. The distance to L3 is **7 files** that touch Supabase, of which the lint
currently sees only 2.

The two things that actually cost something are in §3 and §6, and neither is a structure
problem:

1. Five `supabase.functions.invoke` call sites have no port shape in `adapters/_ports.md`
   to map onto. That is a gap in the contract, not in the app.
2. Root [CLAUDE.md](CLAUDE.md) (17,697 bytes) is the real project memory. `.claude/memory/`
   (90 lines, 4 placeholder rows, 1 real entry) is the file the routing table sends every
   task to. The knowledge is written down — it is filed where the system does not look.

---

## 1. Inventory

| Item | Value |
|---|---|
| Package manager | Yarn 1.22.22, `yarn.lock` present |
| Competing lockfiles | 0 (`package-lock.json`, `pnpm-lock.yaml`, `bun.lockb` all gitignored) |
| Source files | 180 (120 `.ts`, 60 `.tsx`) |
| Source LOC | 12,133 |
| Comment lines | 547 |
| Test files | 0 |
| Migrations | 9 SQL files |
| Edge Functions | 2 (`create-staff`, `mikrotik-sync`) |
| Commits | 23 |

### Scripts

| Script | Present | Runs |
|---|---|---|
| `dev` | ✅ | — |
| `build` | ✅ | `tsc -b && vite build` |
| `typecheck` | ✅ | **passes**, 0 errors, 3.0s |
| `structure-lint` | ✅ | **clean at L1 and L2**, 180 files |
| `lint` | ✅ | ❌ **fails** — `eslint` is not installed and no `eslint.config.*` / `.eslintrc*` exists |
| `test` | ❌ | absent — `.claude/PROJECT.md` §Commands lists `yarn test` |

`yarn lint` is `eslint . && yarn structure-lint`. The first half aborts with
`'eslint' is not recognized`, so the second half never runs. The declared **L1** gate is
"lint + typecheck on changed files" — half of that gate cannot currently execute from the
command line. The PostToolUse hook (`.claude/hooks/lint-changed.mjs`) calls
`scripts/structure-lint.mjs` directly and is unaffected.

### TypeScript strictness — `tsconfig.app.json`

| Flag | Value |
|---|---|
| `strict` | ✅ true |
| `noUncheckedIndexedAccess` | ✅ true |
| `noUnusedLocals` / `noUnusedParameters` | ✅ true |
| `noFallthroughCasesInSwitch` | ✅ true |
| `forceConsistentCasingInFileNames` | ✅ true |
| `exactOptionalPropertyTypes` | ❌ **false** — the one L4 flag still off |
| `paths` | `@/*` → `./src/*` ✅ |

### Installed stack vs `.claude/stack/react-antd-ve.md`

`PROJECT.md` declares `stack: react-antd-ve`. **7 of that file's 13 runtime choices are not
installed**, and 6 have no substitute recorded anywhere.

| Concern | `react-antd-ve.md` says | Installed | Delta |
|---|---|---|---|
| Build | Vite | vite 5.4.8 | ✅ |
| Language | TS strict + both extra flags | strict + 1 of 2 | ~ |
| Routing | TanStack Router | react-router-dom 6.26.2 | ❌ |
| Server state | TanStack Query | @tanstack/react-query 5.59 — **used in 1 file** | ~ |
| Client state | Zustand | zustand 5.0.14 | ✅ |
| Forms | React Hook Form + `zodResolver` | none | ❌ |
| Validation | Zod | **not a dependency** | ❌ |
| UI kit | Ant Design | none — hand-built components | ❌ |
| Styling | Vanilla Extract under `src/styles/` | @vanilla-extract/css 1.21.2 | ✅ |
| Dates | Day.js | native `Date` + ISO strings | ❌ |
| Charts | Ant Design Charts | none | ❌ (none needed) |
| Local DB | Dexie | dexie 4.0.8 + dexie-react-hooks | ✅ |
| Tests | Vitest + Testing Library + MSW | none | ❌ |

Most of these are deliberate and good calls for a mobile-first offline PWA — hand-built
components over AntD is why the bundle and the gesture handling are what they are. But
`react-antd-ve.md` ends with *"Adding anything else requires an entry in
`roadmap/DECISION_LOG.md`"*, and **`DECISION_LOG.md` has 4 ADRs, none covering these 6
substitutions**. ADR-0003 covers Vanilla Extract + Zustand only.

---

## 2. Structure delta

`node scripts/structure-lint.mjs --level L5 --json` → **24 findings**.
At the declared level and one above: **0 at L1, 0 at L2**, 2 at L3, 2 at L4.

| Rule | Count | Worst offenders | Effort |
|---|---|---|---|
| `L5/function-size` (>50 lines) | **19** | `MikrotikSection.tsx:39` (174), `Sheet.tsx:53` (146), `ClientFormPage.tsx:11` (146), `PlanFormSheet.tsx:15` (135), `Calendar.tsx:48` (133), `RecordPaymentSheet.tsx:19` (128), `useClientLedger.ts:48` (107) | **L** |
| `L3/sdk-escape` | **2** | `api/common/supabaseClient.ts:1`, `stores/auth/Auth.store.ts:3` | **M** (see §3 — real number is 7) |
| `L5/common-depends-on-module` | **2** | `common/components/layout/Screen.tsx:3` → `@/components/sync/widgets/SyncChip`; `common/components/notices/OfflineNotice.tsx:1` → `@/hooks/sync/useSyncStatus` | **S** |
| `L5/imports-pages` | **1** | `app/App.tsx:4` → `pages/auth/LoginPage` | **S** — intentional and documented (`App.tsx` renders `LoginPage` directly when `!authenticated`, before `AppRoutes` exists). This is a **TECH_DEBT/DECISION_LOG entry, not a code change.** |
| `L5/component-size` | **0** | — | — |
| `L5/style-location` | **0** | — | — |
| `L5/orphan-stylesheet` | **0** | — | — |
| `L5/default-export` | **0** | — | — |
| `L5/api-depends-on-store` | **0** | — | — |

The style mirror is **perfectly clean** — 0 misplaced stylesheets and 0 orphans across
~50 `.css.ts` files under `src/styles/`. That is the expensive half of L5 and it is already
done. The remaining L5 work is 19 function splits plus 2 small inversions.

### Empty scaffold directories — 5

`src/common/constants/`, `src/common/hooks/`, `src/common/routes/`, `src/common/services/`,
`src/common/types/` contain no `.ts`/`.tsx` at any depth. Root `CLAUDE.md` states
`src/common/` holds `components/`, `stores/`, `utils/` and that a module folder should not
appear until it has files. Deletion is zero-risk (git does not track empty directories, so
this is a local-filesystem cleanup only).

---

## 3. Backend coupling ← *the important section*

**7 files touch Supabase. `structure-lint` reports 2.**

The L3 rule (`scripts/structure-lint.mjs:110-118`) matches the *import specifier* against a
package-name list, so it catches `@supabase/supabase-js` and nothing else. Five files import
the `supabase` singleton via `@/api/common/supabaseClient` — an alias path, invisible to the
rule. **Any L3 promotion planned from the lint output alone will under-scope by 5 files.**

| # | File | Import route | Capability | Calls |
|---|---|---|---|---|
| 1 | [src/api/common/supabaseClient.ts](src/api/common/supabaseClient.ts) | `@supabase/supabase-js` (direct) | **construction** | `createClient(url, anonKey, …)`; also exports `usernameToEmail` |
| 2 | [src/api/sync/syncEngine.ts](src/api/sync/syncEngine.ts) | singleton | **CRUD + query** | 8 × `.from().select()` (clients, rooms, routers, plans, payments, app_users, connection_events, pause_events); 4 × `.upsert(…, {onConflict, ignoreDuplicates})`; 1 × `.update().eq()`; 1 × `.delete().eq()` |
| 3 | [src/stores/auth/Auth.store.ts](src/stores/auth/Auth.store.ts) | `@supabase/supabase-js` (type `Session`) + singleton | **auth + CRUD** | `auth.signInWithPassword`, `auth.signOut` ×3, `auth.getSession`, `auth.onAuthStateChange`; 1 × `.from('app_users').select()` |
| 4 | [src/services/rooms/Rooms.service.ts](src/services/rooms/Rooms.service.ts) | singleton | **functions** | `functions.invoke('mikrotik-sync')` ×3 — actions `configure`, `status`, `probe` |
| 5 | [src/api/sync/routerBridge.ts](src/api/sync/routerBridge.ts) | singleton | **functions** | `functions.invoke('mikrotik-sync')` ×1 — action `sync` |
| 6 | [src/hooks/auth/useStaffSection.ts](src/hooks/auth/useStaffSection.ts) | singleton | **functions** | `functions.invoke('create-staff')` ×1 |
| 7 | [src/app/config/env.ts](src/app/config/env.ts) | none | **config** | names `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` |

**Realtime: 0 call sites. Files/Storage: 0 call sites.** This app's honest capability flag is
`{ realtime: false, files: false, rls: true }`.

### First draft of the port interfaces

The mapping above is the port surface. It is small:

| Port | Sourced from | Notes |
|---|---|---|
| `auth.port.ts` | file 3 | `signIn` · `signOut` · `getSession` · `onAuthChange` — a 1:1 match with `_ports.md`, plus the `usernameToEmail` derivation which belongs **in the adapter** (it encodes a Supabase-specific "email is the login identity" constraint, not a domain rule) |
| `crud.port.ts` | file 2 | `insert` (upsert-with-`onConflict`) · `update` · `remove`. `WriteOpts.idempotencyKey` maps onto the existing `client_uuid` / `id` conflict targets with no behaviour change — the outbox already does exactly what the port was designed for |
| `query.port.ts` | files 2, 3 | `list` with `filters` (`is deleted_at null`, `gte paid_at`), `sort`, `limit` — `pullAll` uses 4 distinct filter shapes, all expressible in the neutral `Query` type |
| **no port exists** | files 4, 5, 6 | **5 `functions.invoke` call sites with nothing in `_ports.md` to map onto** |

### The gap: server-invoked operations have no port

`_ports.md` defines auth, crud, query, realtime and files. It also states that Edge
Functions are backend-native and *"the adapter doc describes them; the port never abstracts
them."* But these five call sites are not migrations or triggers — they are **runtime calls
made from application code**, which is precisely what a port exists to bound:

- `create-staff` — the only write in the app that cannot work offline (§CLAUDE.md), invoked
  from a hook
- `mikrotik-sync` `configure` / `status` / `probe` — invoked from a service
- `mikrotik-sync` `sync` — invoked from the sync engine after every flush

Under the current contract, moving to another backend leaves 5 unbounded call sites with no
guidance. **This needs a decision before rung 2 starts**, and it is a `DECISION_LOG.md` entry
either way. Two options, in order of preference:

1. **Add an `invoke.port.ts`** (`invoke<Op>(op, body): Promise<Result<Out<Op>>>`) with a
   typed operation registry. Backend-neutral, and the four `mikrotik-sync` actions become one
   discriminated union. Recommended.
2. Treat each as a named domain port (`RouterPort`, `StaffProvisioningPort`). More
   interfaces, but each is capability-shaped and reads better at the call site.

### Error mapping — the finding that matters most in this section

`.claude/adapters/supabase.md` specifies an exact `PostgrestError.code → BackendError.kind`
map and warns: *"`42501` classified as transient is the classic catastrophic bug."*

The app has the **opposite** failure mode, and it is already live.
[src/api/sync/syncEngine.ts:129-183](src/api/sync/syncEngine.ts#L129-L183) classifies by
*delivery mechanism*, not by code:

```
catch (fetch threw)          → attempts++, stays 'pending'   → retried forever   (transient)
error object returned        → status = 'failed'             → never retried     (permanent)
```

`error.code` is never inspected — only `error.message` is stored. So any failure that
**completes an HTTP round-trip but fails** (502/503/504 from the gateway, a Postgres
statement timeout, a rate-limit response) is classified **permanent** and parked in the Sync
screen for manual review, when it should retry with backoff. This is the mirror image of the
catastrophic bug the adapter doc names, and it costs user work rather than looping.

It is contained to **4 sites in one function** (`pushOutboxItem`, lines 138, 143, 148, 163),
which is exactly why rung 2 is worth doing: the correct mapping lands once, in the adapter,
instead of four times at the call sites.

**Verdict for §3:** the coupling is 7 files and structurally shallow — `api/` already owns
6 of the 7, `api/` imports no store, and reads already go through Dexie rather than Supabase.
The architecture was built for this rung. The work is defining the ports (including the
missing one) and getting the error mapping right — not untangling call sites.

---

## 4. Dependency-direction violations

| Check | Count | Detail |
|---|---|---|
| **File-level import cycles** | **0** | Full DFS over all 180 files and every `@/` edge. Clean. |
| `api/` importing `stores/` | **0** | Clean. |
| `common/` importing a module | **2** | `Screen.tsx:3` → `@/components/sync/widgets/SyncChip`; `OfflineNotice.tsx:1` → `@/hooks/sync/useSyncStatus` |
| Non-`routes/` importing `pages/` | **1** | `app/App.tsx:4` → `pages/auth/LoginPage` — intentional, documented in root `CLAUDE.md` |
| Cross-module import edges | **78** | across 8 modules — breakdown below |
| **Module-level cycles** | **4** | `auth ↔ sync`, `clients ↔ payments`, `clients ↔ sync`, `payments ↔ sync` |

### The 78 cross-module edges, classified

| Kind | Count | Sanctioned? |
|---|---|---|
| Type-only import from the owning module's `types/<module>` | **24** | ✅ explicitly required by root `CLAUDE.md` ("Cross-module type references import directly from the owning module's types file rather than duplicating the type") |
| → `@/api/sync/syncEngine` | **14** | ✅ `sync` is shared infrastructure, not a peer module |
| → `@/stores/auth/Auth.store` | **10** | ✅ the one genuinely global store |
| → `@/constants/clients/ClientRoutes.constants` | **3** | ✅ required — "every screen linking into the client list must use those builders" |
| Genuine cross-module value imports | **27** | reviewable |

The 27 worth a second look, and none is alarming:

- `clients → payments` (4) — 3 hooks call `services/payments/Payments.service`;
  `ClientDetailPage` renders `RecordPaymentSheet`. `payments` has no route of its own
  (`styles/features/payments/`), so its sheet is *designed* to be hosted by other modules.
- `payments → clients` (2) — `useRecordPaymentForm` and `RecordPayment.constants` read
  `hooks/clients/useClients` to populate the client picker. This is the other half of the
  `clients ↔ payments` cycle.
- `sync → payments` (1) — `useSyncStatus` calls `sweepExpiredClients`. The sweep is the app's
  catch-up for a missing server scheduler; the coupling is deliberate.
- `settings → rooms` (1) — `SettingsPage` renders `components/rooms/widgets/MikrotikSection`.
  The router settings UI is filed under `rooms` because `rooms` owns routers, but it is only
  ever mounted from Settings. Worth a note; not worth a move.
- `clients → plans` (3) and `clients → rooms` (4) value imports — hooks and services a client
  form legitimately needs.

**Assessment:** the 4 module-level cycles are all mediated by a hub (`sync`) or a
shared-by-design sheet (`payments`), and **none produces a file-level cycle**. This is not
technical debt. It is worth one line in `memory/architectural-decisions.md` so the next person
running a cycle check does not "fix" it.

---

## 5. Doc drift

Per `AUDIT.md`: every contradiction is a defect in the docs until proven otherwise.
All 12 below are doc defects — **no code change is implied by any row in this table.**

| # | Claim | Reality | Fix |
|---|---|---|---|
| 1 | Root `CLAUDE.md` §Data flow: *"**every** write goes through the outbox, with no exceptions"* | [Rooms.service.ts:170-178](src/services/rooms/Rooms.service.ts#L170-L178) — MikroTik credential writes are **deliberately outside the outbox**: credentials must not be mirrored into Dexie (IndexedDB is readable by anyone with the device) and a connection cannot be tested offline | Amend the doc — the code is right and the reason is a security rule worth stating loudly |
| 2 | `.gitignore:28` = `CLAUDE.md` (unanchored) | Matches **`.claude/CLAUDE.md`**, the always-in-context system entrypoint. 68 of 69 `.claude` files are tracked; **the entrypoint is not.** A fresh clone gets the brain with its front page missing. Root `CLAUDE.md` survives only because it was committed before the rule | Anchor to `/CLAUDE.md`, `git add .claude/CLAUDE.md` |
| 3 | `PROJECT.md`: `conformance: L1` | `structure-lint` is clean at **L2**; 0 relative imports | Promote to L2 (own commit, per `conformance.md` rule 4) |
| 4 | `PROJECT.md`: `stack: react-antd-ve` | 7 of 13 declared choices not installed (§1); 6 substitutions have no ADR | Add one ADR covering the substitution set, or add a project stack file |
| 5 | `PROJECT.md` §Commands lists `yarn lint · yarn test` | `yarn lint` **fails** (no eslint, no config); no `test` script exists | Install eslint + config; add `test` or drop the claim |
| 6 | `PROJECT.md` §What this is / §Modules / §Backend | still `<one sentence: …>` / `<business nouns…>` placeholders | Fill — 8 modules and the backend shape are both already known |
| 7 | `PROJECT.md` §Deviations: empty table, *"An undocumented deviation is drift"* | ≥3 real deviations exist (stack substitutions, `App.tsx → pages/`, credentials outside the outbox) | Add 3 rows + matching ADRs |
| 8 | Routing table: *"Touching existing app code → `memory/conventions.md` (always)"* | `memory/conventions.md` = 44 lines, **4 placeholder rows, 1 real entry** ("Yarn only", already enforced by a hook and by §2 rule 1). Meanwhile root `CLAUDE.md` holds ~250 lines of exactly this content | See §6 — the highest-value fix in the report |
| 9 | `memory/architectural-decisions.md`, `memory/product-principles.md` | 23 lines each, unfilled templates | Fill from the material already in root `CLAUDE.md` |
| 10 | `_ports.md` defines 5 ports as the whole surface | 5 `functions.invoke` call sites map to **none** of them (§3) | Decide `invoke.port.ts` vs named domain ports; record as an ADR **before** rung 2 |
| 11 | `structure-lint` L3 rule = "backend SDK confined to adapters" | Matches package specifiers only → reports **2** where **7** files touch Supabase | Extend the rule to flag `@/api/common/supabaseClient` importers, or accept and note the blind spot |
| 12 | README:41 *"paste the **three** files from `supabase/migrations/`"* | **9** migration files exist | Update README |

### Not drift, but found while checking: duplicate migration version

`supabase/migrations/` contains **two files prefixed `0007`**:

```
0007_ledger_deletes_and_self_name.sql
0007_router_settings.sql
```

The Supabase CLI keys `supabase_migrations.schema_migrations` on the version prefix. Two
files sharing `0007` means at minimum that apply order is decided by lexical filename sort
rather than by the number, and quite possibly a primary-key conflict on `supabase db push`.
**Not verified against a live push** — no migration was run, per project rules. Renaming the
later one to `0009` on a database where `0007` is already recorded would re-apply it, so the
fix is not a plain rename and needs a decision. Recording it in `TECH_DEBT.md` is the correct
first move.

---

## 6. Knowledge not yet captured

The headline: **the knowledge is written, but not where the system reads it.**

| Location | Size | Content |
|---|---|---|
| Root [CLAUDE.md](CLAUDE.md) | 17,697 bytes | data-flow rules, trigger↔mirror pairs, `nextExpiry()` arithmetic, hard-delete rationale, the "Do not" list |
| `.claude/memory/conventions.md` | 44 lines | 4 placeholder rows, 1 real entry |
| `.claude/memory/architectural-decisions.md` | 23 lines | unfilled template |
| `.claude/memory/product-principles.md` | 23 lines | unfilled template |

Root `CLAUDE.md` is loaded by the CLI as project instructions, so it *is* in context today —
but `.claude/CLAUDE.md` §4 routes every "touching existing app code" task to
`memory/conventions.md`, and a reader following the documented protocol finds one row about
Yarn. **Migrating that content is a file move, not authorship** — the expensive part is
already done.

Beyond it, **14 rules live only in code comments or only in the schema**. Each is stated with
its source so the move is mechanical.

### A. Not documented anywhere — the MikroTik subsystem

Root `CLAUDE.md` mentions routers once ("Routers have no module of their own"). The entire
router-control subsystem — 1 Edge Function, 4 actions, 6 call sites, a security rule and an
ordering constraint — is undocumented outside the code.

| # | Rule | Source |
|---|---|---|
| 1 | The browser **never** talks to the MikroTik. It cannot open a raw TCP socket to the API service, and router credentials would be public in any `VITE_*` variable. The app only nudges the `mikrotik-sync` Edge Function, which owns both the credentials and the TCP session. | [routerBridge.ts:3-14](src/api/sync/routerBridge.ts#L3-L14) |
| 2 | **Router credentials are the one documented exception to "every write goes through the outbox."** IndexedDB is readable by anyone with the device, so credentials must never be mirrored; and a connection cannot be tested offline anyway. `connectMikrotik` / `readMikrotikStatus` / `testMikrotik` are online-only by design. | [Rooms.service.ts:170-178](src/services/rooms/Rooms.service.ts#L170-L178) |
| 3 | **`pushRouterState()` must run before `pullAll()`** in `flushOutbox`, so the `executed_on_router` flag the Edge Function sets server-side is picked up by the *same* pull. Swapping two adjacent lines silently costs a sync cycle of staleness. | [syncEngine.ts:114-124](src/api/sync/syncEngine.ts#L114-L124) |
| 4 | Router push is **best-effort with a 15s ceiling** (`ROUTER_PUSH_TIMEOUT_MS`). It never throws and never blocks a sync. A lost call is recovered because the function sweeps every `connection_event` still flagged `executed_on_router = false`. | [routerBridge.ts:10-16](src/api/sync/routerBridge.ts#L10-L16) |
| 5 | `executed_on_router` is the difference between "synced to Supabase" and "actually landed on the router" — a disconnect can be one without the other, and the UI must distinguish them. | [useRouterPush.ts:12-18](src/hooks/clients/useRouterPush.ts#L12-L18) |
| 6 | `connectMikrotik` stores **nothing** unless the router answers and the credentials work, so "connected" in Settings always means a session actually succeeded — never that a form was filled in. | [Rooms.service.ts:199-205](src/services/rooms/Rooms.service.ts#L199-L205) |
| 7 | `splitAddress` accepts `host:port` in one field the way the MikroTik app does, defaulting to **8729 with TLS, 8728 without**. | [Rooms.service.ts:180-192](src/services/rooms/Rooms.service.ts#L180-L192) |

### B. Sync invariants stated only in comments

| # | Rule | Source |
|---|---|---|
| 8 | **The outbox is FIFO and FK-order-sensitive.** The router is queued *after* its room so the flush order satisfies the `room_id` foreign key. Any new write that creates two related entities must queue them in dependency order — there is no reordering pass. | [Rooms.service.ts:43](src/services/rooms/Rooms.service.ts#L43) |
| 9 | **Failure classification is by delivery mechanism, not by error code**: a thrown fetch is transient (stays `pending`), a returned error object is permanent (`failed`). `error.code` is never read. See §3 — this is a live defect, and it lives only as a comment. | [syncEngine.ts:129-183](src/api/sync/syncEngine.ts#L129-L183) |
| 10 | Idempotency has **three distinct mechanisms**, one per op: insert conflicts on the device-generated `id`; update is a patch and is naturally idempotent; a delete that already succeeded matches no rows on retry, so its server-side reversal cannot fire twice. | [syncEngine.ts:155-161](src/api/sync/syncEngine.ts#L155-L161) |
| 11 | Detaching a router clears `routers.room_id` **as well as** setting `deleted_at` — the unique `room_id` has to be freed or the room can never be recreated cleanly. Deleting a room also nulls each client's `router_id`, or clients point at a deleted router. | [Rooms.service.ts:66-70, 144-146, 161](src/services/rooms/Rooms.service.ts#L144-L146) |

### C. UI/build invariants — in root `CLAUDE.md` or in comments, absent from `.claude/`

| # | Rule | Source |
|---|---|---|
| 12 | The theme contract must be registered **before** any component style that reads from it — hence the side-effect stylesheet import order in `main.tsx`. Reordering imports breaks tokens at runtime, not at build time. | [main.tsx:8-9](src/app/main.tsx#L8-L9) |
| 13 | The sheet claims a drag gesture **only** once it is clearly downward **and** the content is scrolled to the top — otherwise the body must scroll. Dismiss needs `velocity > 0.5 px/ms` **and** `distance > threshold`. | [Sheet.tsx:142-143](src/common/components/overlays/Sheet.tsx#L142-L143) |
| 14 | Never add `runtimeCaching` for Supabase in `vite.config.ts` — API data is cached in Dexie and a second stale layer would fight it. In root `CLAUDE.md` and in a code comment; absent from `profiles/pwa.md` and `profiles/offline-sync.md`, which is where a PWA task would look. | [vite.config.ts:44](vite.config.ts#L44) |

### Also uncaptured

- The **duplicate `0007` migration prefix** (§5) is recorded nowhere.
- `TECH_DEBT.md` is empty (`_(none yet)_`) while at least 5 accepted compromises exist:
  the error-classification gap, `App.tsx → pages/`, the missing eslint config, the absent
  test suite, and the duplicate migration prefix.
- `DECISION_LOG.md` has 4 ADRs, all about `.claude/` itself and styling. **Zero ADRs cover
  the domain**: hard-delete over soft-delete, negative-amount corrections instead of payment
  updates, or the client-side sweep standing in for a server scheduler — all three are
  described in root `CLAUDE.md` as settled decisions with real rationale, and all three are
  exactly what `core/templates/adr.md` exists for.

**This section is the report's main finding.** The structural work below is mechanical and
low-risk. The knowledge above is the part that is genuinely expensive to reconstruct, and
seven of the fourteen items exist in exactly one comment block each.

---

## 7. Proposed ladder

| Rung | Current → Target | Scope | Files | Effort | Risk | Blockers |
|---|---|---|---|---|---|---|
| **0** | L1 → L1 (make it real) | Install eslint + flat config so `yarn lint` runs; anchor `.gitignore:28` to `/CLAUDE.md` and commit `.claude/CLAUDE.md`; fill `PROJECT.md` placeholders; open `TECH_DEBT.md` with the 5 known items | 5, **0 in `src/`** | **S** (½ day) | **none** | none |
| **1** | L1 → **L2** | **Already satisfied.** 0 relative imports, `structure-lint --level L2` clean. One-line promotion in `PROJECT.md` | 1 | **XS** | **none** | rung 0 (`yarn lint` must run for the L1 gate to be honest) |
| **2** | L2 → **L3** ← *the portability rung* | Define `api/ports/` (auth, crud, query **+ the missing invoke port**); write `api/adapters/supabase/`; move the 7 files of §3 behind it; add `app/config/backend.ts`; **implement the `code → kind` error map** | 7 + ~8 new | **M** (3–5 days) | **medium** — touches the outbox flush path, the app's most correctness-critical function | ADR deciding `invoke.port.ts` vs named domain ports (§3). **Decide before starting.** Also extend the L3 lint rule (§5 row 11) or the gate will pass while 5 escapes remain |
| **3** | L3 → **L4** | Add Zod; schema per boundary parsed at the adapter edge; flip `exactOptionalPropertyTypes: true` | ~15 | **M** | **low–medium** — the flag flip surfaces latent optional-property bugs; `any` is already at 0 and `noUncheckedIndexedAccess` is already on, so this is the smaller half of L4 | rung 2 (Zod parses *at the adapter edge*; without the adapter there is no edge) |
| **4** | L4 → **L5** | 19 function splits into hook + presentation; invert the 2 `common/ → module` deps; ADR the `App.tsx → pages/` exception; delete 5 empty dirs | 21 | **L** | **low** — mechanical, and **the style mirror is already 100% clean**, which is normally the expensive part of this rung | none. Could be done before rung 2 if preferred; one module per PR |
| **5** | L5 → **L6** | Vitest + Testing Library; cover `nextExpiry()`, the `mirror*`/`reverse*` pairs, `sweepExpiredClients`, `replayPendingOutbox`, `discardQueuedClientEvent` | new | **L** | **none** (additive) | none — **could start today**; the money and data-integrity paths are pure functions and are the highest-value targets in the codebase |

**Honest total to L3: 3 PRs** (rung 0, rung 1, rung 2), of which only rung 2 touches `src/`.

Two notes on ordering:

- **Rung 5 does not require rungs 2–4.** `nextExpiry()`, the mirror functions and the reversal
  functions are testable today with no refactor. Given that this app moves money and there is
  currently **0 test coverage**, pulling a slice of rung 5 forward is defensible — and by the
  system's own decision hierarchy (`correctness` → `data integrity` → … → `architecture
  clarity`), arguably correct.
- **Rung 4 does not require rung 2.** If 19 function splits feel more tractable than a port
  layer, that order is legitimate. Each rung ends green independently.

---

## 8. Recommended first PR

**Rung 0 — "Make L1 real."** Five files, **zero changes under `src/`**, zero behaviour change.

| # | Change | Why |
|---|---|---|
| 1 | `.gitignore:28` — `CLAUDE.md` → `/CLAUDE.md`, then `git add .claude/CLAUDE.md` | The system entrypoint — the one file `.claude/CLAUDE.md` §1 says is *always* in context — is currently untracked. 68 of 69 `.claude` files are committed; this is the one that must not be missing from a fresh clone. **Highest-value line in the PR.** |
| 2 | Add `eslint.config.js` + `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks` devDeps (`yarn add -D …`) | `yarn lint` currently aborts before reaching `structure-lint`. The declared L1 gate is "lint + typecheck on changed files"; half of it cannot run. Fix the gate rather than lower it. |
| 3 | `.claude/PROJECT.md` — fill §What this is, §Modules (the 8 already listed in root `CLAUDE.md`), §Backend; add the 3 rows to §Deviations | An unfilled `PROJECT.md` makes every routing decision in §4 guesswork. |
| 4 | `.claude/roadmap/TECH_DEBT.md` — open with 5 entries: error classification (§3), `App.tsx → pages/` (§2), duplicate `0007` migration (§5), no eslint config *(closed by this PR)*, no test suite | Five accepted compromises are currently invisible. `TECH_DEBT.md` says an entry must state the real fix — §3 and §5 state each one. |
| 5 | README:41 — "three files" → "the files" | 30-second correction of a factually wrong instruction. |

**Ends green:** `yarn typecheck` ✅ (passes today) · `yarn lint` ✅ (newly able to run) ·
`node scripts/structure-lint.mjs` ✅ (clean at L1 and L2 today).

**Then, as a separate one-line commit** (`conformance.md` rule 4 — a promotion touches
`PROJECT.md` and nothing else):

```diff
- conformance: L1
+ conformance: L2
```

That commit costs nothing and is already earned: 180 files, 0 relative imports, clean at L2.

### The second PR, if appetite allows

Migrate root `CLAUDE.md` into `.claude/memory/` (conventions · architectural-decisions ·
product-principles) and add the 14 rules of §6. Also documentation-only, zero risk — and it
is the difference between the system's routing table working and being decoration. §6 is
where the real value of this audit is; §7's structural rungs are the cheap part.

---

*Read-only audit. No file was modified; this report is the only file created.*
*Commands run: `yarn typecheck`, `node scripts/structure-lint.mjs` (L1–L5), `yarn lint`, `git ls-files`, `git check-ignore`, plus read-only import-graph analysis over all 180 source files.*
