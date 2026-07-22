import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/common/db';
import { pullAll } from '@/api/sync/syncEngine';

export interface SyncStatus {
  online: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

/**
 * Background revalidation: TanStack Query owns the server-fetch lifecycle
 * (refetch on focus/reconnect/interval); the data itself lands in Dexie and
 * screens read it live from there.
 */
export function useBackgroundSync(): void {
  const online = useOnline();
  useQuery({
    queryKey: ['pull-all'],
    queryFn: pullAll,
    enabled: online,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useSyncStatus(): SyncStatus {
  const online = useOnline();

  const pendingCount =
    useLiveQuery(() => db.outbox.where('status').equals('pending').count(), []) ?? 0;
  const failedCount =
    useLiveQuery(() => db.outbox.where('status').equals('failed').count(), []) ?? 0;
  const lastSyncedAt =
    useLiveQuery(async () => (await db.sync_meta.get('last_synced_at'))?.value ?? null, []) ??
    null;

  return { online, pendingCount, failedCount, lastSyncedAt };
}
