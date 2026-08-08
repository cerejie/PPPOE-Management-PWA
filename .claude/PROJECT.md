# PROJECT — PPPOE-Management-PWA

The only file that differs between projects at install time. Everything in `core/`
is shared; everything true about *this* app is here or in `memory/`.

```yaml
conformance: L1        # what is enforced TODAY — never lowered to make a gate pass
target: L5             # what new code is held to
adapter: supabase      # supabase | dotnet-rest | node-rest | <custom>
stack: react-antd-ve
profiles: [mobile-first, pwa, offline-sync]
design: glass-aurora
system_version: 1.2.0
```

## What this is

<one sentence: what it does and who uses it>

## Modules

<business nouns that own their own writes>

## Backend

<where it lives, how migrations are applied, where server logic runs>

## Deviations from the system

Every row needs a `DECISION_LOG.md` entry. An undocumented deviation is drift.

| Deviates | Why | Recorded |
|---|---|---|
| | | |

## Commands

```bash
yarn dev · yarn build · yarn typecheck · yarn lint · yarn test
node scripts/structure-lint.mjs
```
