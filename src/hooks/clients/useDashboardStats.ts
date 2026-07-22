import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import { daysUntil } from '@/utils/common/format';
import type { Client } from '@/types/clients/clients.types';

export interface DashboardStats {
  total: number;
  /** Sum of monthly_fee across clients whose account_status is 'active'. */
  monthlyRevenue: number;
  connected: number;
  disconnected: number;
  expiring7d: number;
  expired: number;
  /** Clients on a vacation pause; excluded from the expiry counts above. */
  paused: number;
  soonest: Client[];
}

export function useDashboardStats(): DashboardStats | undefined {
  return useLiveQuery(async () => {
    const clients = (await db.clients.toArray()).filter((c) => !c.deleted_at);

    let connected = 0;
    let disconnected = 0;
    let expiring7d = 0;
    let expired = 0;
    let paused = 0;
    let monthlyRevenue = 0;

    for (const c of clients) {
      if (c.connection_status === 'connected') connected += 1;
      else disconnected += 1;
      if (c.account_status === 'active') monthlyRevenue += c.monthly_fee;
      if (c.paused_at !== null) {
        paused += 1;
        continue; // Frozen expiry — not expiring, not expired.
      }
      const d = daysUntil(c.expires_at);
      if (d !== null) {
        if (d < 0) expired += 1;
        else if (d <= 7) expiring7d += 1;
      }
    }

    const soonest = clients
      .filter(
        (c) =>
          c.paused_at === null &&
          c.expires_at !== null &&
          (daysUntil(c.expires_at) ?? 0) >= 0,
      )
      .sort((a, b) => (a.expires_at ?? '').localeCompare(b.expires_at ?? ''))
      .slice(0, 8);

    return {
      total: clients.length,
      monthlyRevenue,
      connected,
      disconnected,
      expiring7d,
      expired,
      paused,
      soonest,
    };
  }, []);
}
