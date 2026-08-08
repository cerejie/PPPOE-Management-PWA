import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from 'zustand';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { db } from '@/api/common/db';
import { discardOutboxItem, flushOutbox, retryOutboxItem } from '@/api/sync/syncEngine';
import { useOnline } from '@/hooks/sync/useSyncStatus';
import type { OutboxItem } from '@/types/sync/Sync.types';

interface SyncPageState {
  /** The item awaiting a discard confirmation; null when no dialog is open. */
  discarding: OutboxItem | null;
}

export interface SyncPageViewModel {
  readonly items: readonly OutboxItem[];
  readonly online: boolean;
  readonly discarding: OutboxItem | null;
  flushNow: () => void;
  retry: (item: OutboxItem) => void;
  requestDiscard: (item: OutboxItem) => void;
  confirmDiscard: () => void;
  cancelDiscard: () => void;
}

export function useSyncPage(): SyncPageViewModel {
  const online = useOnline();
  const items = useLiveQuery(() => db.outbox.orderBy('created_at').toArray(), []) ?? [];

  const store = useInstanceStore<SyncPageState>(() => ({ discarding: null }));
  const discarding = useStore(store, (s) => s.discarding);

  return {
    items,
    online,
    discarding,
    flushNow: () => void flushOutbox(),
    retry: (item) => void retryOutboxItem(item.client_uuid),
    requestDiscard: (item) => store.setState({ discarding: item }),
    confirmDiscard: () => {
      const target = store.getState().discarding;
      if (!target) return;
      void discardOutboxItem(target.client_uuid);
      store.setState({ discarding: null });
    },
    cancelDiscard: () => store.setState({ discarding: null }),
  };
}
