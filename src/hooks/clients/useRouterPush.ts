import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';

export interface RouterPushStatus {
  /** Connection events that reached Supabase but not yet the MikroTik. */
  unapplied: number;
  /** Newest reason the push failed, when the server recorded one. */
  error: string | null;
}

/**
 * Whether this client's connection state has actually landed on the router.
 *
 * A disconnect that synced to Supabase but never reached the MikroTik leaves
 * the client online while the app shows them cut off — the one failure mode of
 * this integration that must never be silent, so the detail screen surfaces it.
 *
 * Reads the Dexie mirror like every other read; `executed_on_router` is set by
 * the mikrotik-sync Edge Function and arrives on the next pull.
 */
export function useRouterPushStatus(clientId: string | undefined): RouterPushStatus | undefined {
  return useLiveQuery(async () => {
    if (!clientId) return undefined;

    const events = await db.connection_events.where('client_id').equals(clientId).toArray();
    const pending = events.filter((e) => !e.executed_on_router);

    pending.sort((a, b) => b.performed_at.localeCompare(a.performed_at));

    return {
      unapplied: pending.length,
      error: pending.find((e) => e.router_error)?.router_error ?? null,
    };
  }, [clientId]);
}
