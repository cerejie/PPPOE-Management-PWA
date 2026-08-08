# Kit — Ignite (new project)

A **procedure**, not prose. Run top to bottom. Do not skip step 1 and do not
scaffold beyond step 6 — a half-built app with no reference module teaches Claude
nothing and teaches you less.

---

## Step 1 — Interview

Run `questionnaire.md`. Do not scaffold anything until every answer exists.
Write the answers into `.claude/memory/product-principles.md` and the module list
into `.claude/memory/conventions.md`.

**Never invent business rules to fill a gap.** Ask.

## Step 2 — Compose the brain

```
<project>/.claude/
├── CLAUDE.md            ← from CLAUDE.template.md, routing table filled in
├── PROJECT.md           ← conformance: L5, target: L5, adapter, profiles
├── core/                ← copied verbatim, never edited per project
├── stack/<chosen>.md
├── adapters/<chosen>.md + _ports.md
├── profiles/<chosen>/…  ← only what was chosen
├── memory/              ← the ONLY folder that is project-specific from day one
├── roadmap/
├── hooks/ commands/ agents/ settings.json   ← from harness/
└── .system-version      ← stamp for /sync-system
```

Greenfield declares `conformance: L5` immediately. There is no legacy to grandfather.

## Step 3 — Scaffold the toolchain

```bash
yarn create vite <name> --template react-ts
cd <name>
yarn add <only the chosen stack's runtime deps>
yarn add -D <only the chosen stack's dev deps>
```

Then, in order:
- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `@/*` → `src/*`
- `vite.config.ts`: alias, plugins for the chosen stack
- `package.json` scripts: `dev · build · preview · typecheck · lint · test · structure-lint`
- copy `harness/scripts/structure-lint.mjs` → `scripts/`

**`yarn lint` must chain `structure-lint`.** A separate optional script is a
script nobody runs.

## Step 4 — Skeleton

Create only the folders the chosen profiles require (`core/standards/project-structure.md` §1).
**No empty scaffolding.** A module folder appears when it has a file.

Always: `api/ports/`, `api/adapters/<chosen>/`, `app/config/backend.ts`,
`styles/global/` (theme contract + token helpers).

## Step 5 — One complete reference module

**This is the highest-value step in the kit.** Pick the simplest real module from
step 1 and build it *end to end*:

```
schemas/<m>/  types/<m>/  services/<m>/  hooks/<m>/
components/<m>/<category>/  pages/<m>/  styles/pages/<m>/
constants/<m>/  routes entry
```

Covering: list + detail + create/edit + delete · loading, empty, error, offline
states · one write through the full path · one test per layer.

Claude pattern-matches from working code far more reliably than from rules. Every
later module is "like `<m>`, but for X" — which is a cheap, unambiguous prompt.

Then run the **port conformance suite**: assert every `BackendError.kind` mapping
in the adapter, especially that a permission denial maps to `rejected` and never
`transient`. That single test prevents the worst offline-sync bug there is.

## Step 6 — Verify the harness

```bash
node scripts/structure-lint.mjs     # must print "clean at L5"
yarn typecheck && yarn lint && yarn test
```

Confirm the package-manager hook blocks `npm install` and the post-write hook
reports on a deliberately bad file. **An unverified hook is not a control.**

## Step 7 — Record

Seed `roadmap/DECISION_LOG.md` with the choices from steps 1–3: adapter, profiles,
stack deviations, module list. These are exactly the decisions that are expensive
to reverse and impossible to reconstruct in six months.

---

## Done when

- [ ] `structure-lint` clean at L5
- [ ] reference module works end to end, offline states included
- [ ] port conformance suite passes
- [ ] both hooks verified firing
- [ ] `DECISION_LOG.md` records adapter + profiles + stack
- [ ] `memory/conventions.md` has the real domain vocabulary, not placeholders
