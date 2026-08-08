import { useCallback, useEffect } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { readMikrotikStatus } from '@/services/rooms/Rooms.service';
import type { MikrotikStatus } from '@/types/rooms/Rooms.types';

interface MikrotikStatusState {
  status: MikrotikStatus | null;
  loading: boolean;
  error: string | null;
}

/**
 * The stored MikroTik connection, read through the Edge Function.
 *
 * Not a `useLiveQuery` like every other read in the app: router credentials are
 * deliberately never mirrored into Dexie, so there is no local copy to observe.
 * That also makes this the one screen that genuinely needs a connection.
 */
export function useMikrotikStatus(enabled: boolean) {
  const store = useInstanceStore<MikrotikStatusState>(() => ({
    status: null,
    loading: enabled,
    error: null,
  }));

  const { status, loading, error } = useStore(
    store,
    useShallow((s) => s),
  );

  const refresh = useCallback(async () => {
    store.setState({ loading: true });
    const result = await readMikrotikStatus();
    store.setState({ status: result.status, error: result.error, loading: false });
  }, [store]);

  const setStatus = useCallback(
    (next: MikrotikStatus | null) => store.setState({ status: next }),
    [store],
  );

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { status, loading, error, refresh, setStatus };
}
