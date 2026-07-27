import { supabase } from '@/api/common/supabaseClient';

/**
 * Ask the `mikrotik-sync` Edge Function to push connection state to the router.
 *
 * The browser never talks to the MikroTik itself — it cannot open a raw TCP
 * socket to the API service, and router credentials would be public in any
 * VITE_* variable. This only nudges the server, which does the real work.
 *
 * Best-effort by design: the function sweeps every connection_event still
 * flagged executed_on_router = false, so a call lost to a dead network is
 * picked up by the next flush or by the scheduled sweep. Never throws, and
 * never blocks a sync for longer than ROUTER_PUSH_TIMEOUT_MS.
 */

const ROUTER_PUSH_TIMEOUT_MS = 15_000;

export interface RouterPushResult {
  ok: boolean;
  applied: number;
  error?: string;
}

export async function pushRouterState(clientId?: string): Promise<RouterPushResult> {
  const timeout = new Promise<RouterPushResult>((resolve) =>
    setTimeout(
      () => resolve({ ok: false, applied: 0, error: 'router push timed out' }),
      ROUTER_PUSH_TIMEOUT_MS,
    ),
  );

  const call = (async (): Promise<RouterPushResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
        body: { action: 'sync', ...(clientId ? { client_id: clientId } : {}) },
      });
      if (error) return { ok: false, applied: 0, error: error.message };

      const body = data as { ok?: boolean; applied?: number; detail?: string } | null;
      return {
        ok: body?.ok === true,
        applied: body?.applied ?? 0,
        error: body?.ok === true ? undefined : (body?.detail ?? 'router push failed'),
      };
    } catch (err) {
      return { ok: false, applied: 0, error: (err as Error).message };
    }
  })();

  return Promise.race([call, timeout]);
}
