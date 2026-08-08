import { useRef } from 'react';
import { useStore, type StoreApi } from 'zustand';
import { createStore } from 'zustand/vanilla';

/**
 * A Zustand store scoped to one component instance.
 *
 * Module-level `create()` stores are shared by every component that imports
 * them, which is right for domain state and wrong for UI state: two open sheets
 * or two date fields would fight over the same slice. This creates the store
 * once per mounting component and keeps it in a ref, so the state is genuinely
 * per instance while remaining a real Zustand store — selectors, shallow
 * comparison, and subscriptions all behave normally, and a component that reads
 * one field does not re-render when another changes.
 *
 * `initial` is read only on the first render; later changes are ignored, the
 * same way a `useState` initialiser was.
 */
export function useInstanceStore<T extends object>(initial: () => T): StoreApi<T> {
  const ref = useRef<StoreApi<T> | null>(null);
  ref.current ??= createStore<T>(() => initial());
  return ref.current;
}

/** Read a slice of an instance store created by {@link useInstanceStore}. */
export function useInstanceValue<T extends object, U>(
  store: StoreApi<T>,
  selector: (state: T) => U,
): U {
  return useStore(store, selector);
}
