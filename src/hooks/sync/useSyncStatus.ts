import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/common/db';
import { pullAll } from '@/api/sync/syncEngine';
import { sweepExpiredClients } from '@/services/payments/Payments.service';
import { useAuthStore } from '@/stores/auth/Auth.store';
import { useConnectivityStore } from '@/common/stores/Connectivity.store';

export interface SyncStatus {
  online: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
}

export function useOnline(): boolean {
  return useConnectivityStore((s) => s.online);
}

/**
 * Background revalidation: TanStack Query owns the server-fetch lifecycle
 * (refetch on focus/reconnect/interval); the data itself lands in Dexie and
 * screens read it live from there.
 *
 * The expiry sweep rides along. It has to run on its own too, because the query
 * is disabled offline and expiries do not stop happening when the connection
 * does.
 */
export function useBackgroundSync(): void {
  const online = useOnline();
  const performedBy = useAuthStore((s) => s.appUser?.id ?? null);

  useQuery({
    queryKey: ['pull-all'],
    queryFn: async () => {
      const ok = await pullAll();
      await sweepExpiredClients(performedBy);
      return ok;
    },
    enabled: online,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Offline the query above never runs, so sweep on open and hourly regardless.
  useEffect(() => {
    void sweepExpiredClients(performedBy);
    const id = window.setInterval(() => void sweepExpiredClients(performedBy), 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [performedBy]);
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
