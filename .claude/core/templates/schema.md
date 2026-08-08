# Template — Zod Schema

The schema is the contract. Types derive from it; it never derives from a type.

## Skeleton

```ts
// invoice.schema.ts
import { z } from 'zod';
import { uuid, money, isoDate } from '@/schemas/primitives';

export const invoiceStatusSchema = z.enum(['draft', 'issued', 'paid', 'void']);

/** What the server returns. */
export const invoiceSchema = z.object({
  id: uuid,
  number: z.string().min(1),
  status: invoiceStatusSchema,
  amount: money,
  currency: z.string().length(3),
  dueDate: isoDate,
  createdAt: isoDate,
});

/** What a client may send. Server-owned fields are absent, unknown keys rejected. */
export const createInvoiceSchema = z.object({
  tenantId: uuid,
  amount: money,
  currency: z.string().length(3),
  dueDate: isoDate,
}).strict();

export const invoiceListSchema = z.array(invoiceSchema);

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
```

## Rules

- **Input and output schemas are separate.** Input omits server-owned fields and uses `.strict()`. Output omits secrets.
- Reuse shared primitives from `schemas/primitives.ts` (`uuid`, `money`, `isoDate`, `email`, `phone`) rather than re-describing them.
- Constraints belong in the schema, not in component validation: `.min()`, `.max()`, `.email()`, `.refine()` for cross-field rules.
- Custom messages are user-facing copy — write them for the user, not the developer.
- Parse at the edge: network responses, `localStorage`/IndexedDB reads, URL params, file imports, `postMessage`. After parsing, the type is trusted.
- `safeParse` where a failure is expected and handled; `parse` where a failure is a bug.
- Enums via `z.enum`, never loose strings.
- Never widen a schema to make a parse error go away — the mismatch is the finding.

## Evolution

Adding an optional field is safe. Removing a field, tightening a type, or changing a field's meaning is breaking: version or deprecate, never silently repurpose a name.
