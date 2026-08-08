# Standard — Naming

Names describe **business intent**, not mechanics. `outstandingBalance`, not `data2`. Consistency beats personal style — if a convention exists in the codebase, follow it even if you would have chosen differently.

## Casing

| Thing | Case |
|---|---|
| Component, type, interface, enum | `PascalCase` |
| Variable, function, hook, prop | `camelCase` |
| Constant (true constant) | `SCREAMING_SNAKE` |
| Database table, column | `snake_case` |
| CSS class (Vanilla Extract export) | `camelCase` |
| Route path | `kebab-case` |
| Env var | `SCREAMING_SNAKE` |

## Verbs carry meaning

| Prefix | Means |
|---|---|
| `get` | Returns synchronously, cheap, cannot fail |
| `fetch` | Network, async, can fail |
| `load` | Async retrieval into state |
| `create` / `update` / `delete` | Persists a change |
| `build` / `make` | Constructs in memory, no side effect |
| `is` / `has` / `can` / `should` | Boolean |
| `handle` / `on` | Event handler (`onSubmit` prop → `handleSubmit` implementation) |
| `to` / `format` | Pure transformation |
| `assert` / `ensure` | Throws when the condition fails |

Never use `get` for something that hits the network. Never use `handle` for business logic.

## Booleans

Positive and specific: `isActive`, `hasUnpaidInvoices`, `canApprove`. Never negatives (`isNotReady`), never bare adjectives (`disabled` on a non-prop).

## Domain vocabulary

One word per concept across the entire system — UI, service, schema, table, and conversation. If the business says *tenant*, never `user`, `resident`, and `occupant` in three layers. Record the vocabulary in `memory/conventions.md` the first time it is settled.

## Types

- Entities named for the entity: `Invoice`. No `IInvoice`, no `TInvoice`.
- Input/output variants are explicit: `CreateInvoiceInput`, `InvoiceResponse`, `InvoiceListItem`.
- Component props: `<Component>Props`.
- No suffix soup: `InvoiceDataObjectModel` describes nothing.

## Files, stores, services

Named after their domain, not their layer position: `billing.store.ts`, not `store1.ts` or `mainStore.ts`. Store fields and actions read as intent: `applyPayment`, `voidInvoice` — not `setData`, `update`.

## Forbidden

`data`, `item`, `obj`, `temp`, `val`, `res`, `x` as anything but a one-line local · abbreviations not already established in the domain (`amt`, `qty`, `usr`) · numbered names (`handleClick2`) · names that lie about cost or effect.
