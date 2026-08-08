# Template — Component

Check first: does Ant Design already provide this? Does `components/` or the feature already have it? Build only what does not exist.

## Skeleton

```tsx
// InvoiceStatusTag.tsx
import * as styles from './InvoiceStatusTag.css';

interface InvoiceStatusTagProps {
  readonly status: InvoiceStatus;
  readonly size?: 'small' | 'default';
}

export function InvoiceStatusTag({ status, size = 'default' }: InvoiceStatusTagProps) {
  // …
}
```

Named export. Props interface named `<Component>Props`. Styles in a sibling `.css.ts`.

## Rules

- Presentational: props in, JSX out. No store, no fetching, no `features/` import.
- Container: wires data to a presentational component. No styling decisions.
- ≤250 lines. Past that it is two components.
- No business rule inside. Extract to a hook or service.
- Every interactive element has an accessible name; status never conveyed by colour alone.
- Theme tokens only — no hardcoded colour, spacing, radius, or font size.

## Pattern notes

**Table** — Desktop: AntD `Table`, server-side pagination/sort, column priority defined. Mobile: the same data as cards or summary rows; never a shrunken table. Row action ≤2 inline, the rest in an overflow menu. Bulk actions become a selection mode on mobile.

**Form** — React Hook Form + `zodResolver`; the Zod schema is the contract. Visible labels, inline errors, submit disabled while pending, server errors mapped to fields. Long forms sectioned or stepped on mobile with a sticky primary action.

**Card** — One identifier, two supporting facts, one status, one primary action. Everything else lives in the detail view. The whole card is the tap target when it navigates.

**Modal / Drawer** — Modal for a short focused decision; drawer for detail or a longer form. Both become full-screen or a bottom sheet under 768px. Focus trapped, `Esc` closes, focus restored, unsaved-changes confirmed. Never nest a modal in a modal.

**Filters** — Desktop: inline row. Mobile: bottom sheet with an applied-count badge and a clear-all. Filter state lives in the URL.

**Chart** — AntD Charts. Accessible summary or data table alongside; never colour-only encoding. On mobile, reduce series and increase touch targets rather than shrinking the canvas.
