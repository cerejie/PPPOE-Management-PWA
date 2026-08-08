# Template — Feature Module

A feature slice is a vertical, independently understandable unit. Create one only when the domain is real — not to hold a single component.

## Structure

```text
features/<domain>/
├── components/          # sub-group into forms/ tables/ cards/ dialogs/ filters/ past ~7 files
├── hooks/
├── pages/
├── schemas/             # <domain>.schema.ts — Zod, source of truth
├── services/            # <domain>.service.ts — business operations
├── store/               # <domain>.store.ts — client state only
├── types/               # only what is not z.infer'd
└── index.ts             # the slice's public surface
```

## `index.ts` — the contract

Export only what the outside world may use: pages, the public hooks, the service functions other slices need, and shared types. Never export the store, internal components, or api modules.

```ts
export { BillingListPage, BillingDetailPage } from './pages';
export { useInvoiceSummary } from './hooks/useInvoiceSummary';
export type { Invoice, InvoiceStatus } from './schemas/invoice.schema';
```

## Build order

1. **Schema** — the data shape and its rules, in Zod. Everything else derives from this.
2. **Service** — business operations against the schema. Pure of React.
3. **Store** — client state only (selection, filters, draft, UI mode). Never server data.
4. **Hooks** — bind query/mutation + store + service into what a component consumes.
5. **Components** — presentational first, then containers.
6. **Page** — composition and layout only.
7. **Route** — registration, guard, loader.

## Checklist before calling the slice done

- [ ] Nothing outside imports past `index.ts`
- [ ] No import of another `features/*`
- [ ] Server data in TanStack Query; store holds only client state
- [ ] Every boundary parsed by Zod
- [ ] Authorisation enforced server-side, not only by hiding UI
- [ ] Loading / empty / error / offline states exist on every surface
- [ ] Mobile pattern chosen for any table or dense view
- [ ] Business rules live in the service, not in components
- [ ] Domain vocabulary matches `memory/conventions.md`
