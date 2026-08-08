# Template — Service

A service owns business operations for one domain. It is pure of React and pure of transport detail.

## Skeleton

```ts
// invoice.service.ts
import { invoiceApi } from '@/api/invoice.api';
import { invoiceSchema, invoiceListSchema } from '../schemas/invoice.schema';
import type { CreateInvoiceInput, Invoice } from '../schemas/invoice.schema';

export async function fetchInvoices(filters: InvoiceFilters): Promise<readonly Invoice[]> {
  const raw = await invoiceApi.list(filters);
  return invoiceListSchema.parse(raw);
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const validated = createInvoiceSchema.parse(input);
  const raw = await invoiceApi.create(validated, { idempotencyKey: crypto.randomUUID() });
  return invoiceSchema.parse(raw);
}

/** Business rule: an invoice can be voided only while unpaid and within the open period. */
export function canVoid(invoice: Invoice, today: Date): boolean {
  // …
}
```

## Rules

- **No React.** No hooks, no components, no store imports. A service that imports a store has become a hook.
- **Parse every response** through Zod before returning. The caller receives real types.
- **Business rules live here**, in one place, named for the rule. Components and hooks call them.
- Services call `api/` — never Axios directly, never `fetch`.
- Pure rule functions (`canVoid`, `calculateBalance`) are exported separately from the async operations and are trivially testable.
- Errors: let transport errors propagate as typed application errors. Never swallow, never return `null` to mean failure.
- Mutations that create or charge carry an idempotency key.

## Testing

Pure rule functions: unit-tested directly, including edge cases.
Async operations: HTTP mocked at the network layer (MSW), never by stubbing the api module.
