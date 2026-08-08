import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';

/** How many live clients sit on each plan, keyed by plan id. */
export function usePlanClientCounts(): Record<string, number> | undefined {
  return useLiveQuery(async () => {
    const clients = await db.clients.toArray();
    const counts: Record<string, number> = {};
    for (const client of clients) {
      if (client.deleted_at || !client.plan_id) continue;
      counts[client.plan_id] = (counts[client.plan_id] ?? 0) + 1;
    }
    return counts;
  }, []);
}
