import { useCallback, useEffect, useState } from 'react';
import { readMikrotikStatus } from '@/services/rooms/rooms.actions';
import type { MikrotikStatus } from '@/types/rooms/rooms.types';

/**
 * The stored MikroTik connection, read through the Edge Function.
 *
 * Not a `useLiveQuery` like every other read in the app: router credentials are
 * deliberately never mirrored into Dexie, so there is no local copy to observe.
 * That also makes this the one screen that genuinely needs a connection.
 */
export function useMikrotikStatus(enabled: boolean) {
  const [status, setStatus] = useState<MikrotikStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await readMikrotikStatus();
    setStatus(result.status);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  return { status, loading, error, refresh, setStatus };
}
