# Template — Zustand Store

Before creating a store, confirm the state is not: server data (→ TanStack Query), form state (→ React Hook Form), URL-representable (→ search params), derived (→ compute it), or ephemeral to one component (→ local state).

If none of those, it belongs here.

## Skeleton

```ts
// billing.store.ts
interface BillingState {
  readonly selectedIds: readonly string[];
  readonly viewMode: 'table' | 'cards';

  readonly toggleSelection: (id: string) => void;
  readonly clearSelection: () => void;
  readonly setViewMode: (mode: BillingState['viewMode']) => void;
}

export const useBillingStore = create<BillingState>()((set) => ({
  selectedIds: [],
  viewMode: 'table',

  toggleSelection: (id) => set((s) => ({
    selectedIds: s.selectedIds.includes(id)
      ? s.selectedIds.filter((x) => x !== id)
      : [...s.selectedIds, id],
  })),
  clearSelection: () => set({ selectedIds: [] }),
  setViewMode: (viewMode) => set({ viewMode }),
}));
```

## Consumption

```ts
const selectedIds = useBillingStore((s) => s.selectedIds);   // ✅ selector
const store = useBillingStore();                             // ❌ re-renders on every change
```

Derived values are computed at the call site or in a selector — never stored:

```ts
const selectedCount = useBillingStore((s) => s.selectedIds.length);
```

## Rules

- One store per domain. Small. Never one global store.
- Actions named for intent (`applyPayment`), not mechanics (`setState`).
- No async work inside the store — call a service, then set the result.
- No server data mirrored in.
- Selectors only in components.
- Reset on logout: expose a `reset` action and call it from the auth teardown.

## Persistence

Persist only what must survive a reload. Always with `partialize` and a `version` + `migrate`:

```ts
persist(creator, {
  name: 'billing',
  version: 1,
  partialize: (s) => ({ viewMode: s.viewMode }),
})
```

Never persist tokens, PII, or anything the server owns.
