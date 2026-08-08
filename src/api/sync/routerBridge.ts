import { supabase } from '@/api/common/supabaseClient';
import type { RouterImportResult } from '@/types/pppoe/Pppoe.types';

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

/**
 * Pull the router's `/ppp/secret` and `/ppp/profile` lists into Supabase.
 *
 * The router owns both, so this is how an account the app has never seen —
 * added straight on the MikroTik, enabled or disabled — becomes visible here.
 * Unlike `pushRouterState` this is operator-initiated and reports its outcome,
 * because someone is watching the screen and needs to know why nothing arrived.
 *
 * Online only, and deliberately not queued: there is no meaningful way to
 * "import later", and the next import supersedes this one anyway.
 */
export async function importRouterState(): Promise<RouterImportResult> {
  try {
    const { data, error } = await supabase.functions.invoke('mikrotik-sync', {
      body: { action: 'import' },
    });
    if (error) return { ok: false, secrets: 0, profiles: 0, error: error.message };

    const body = data as
      | { ok?: boolean; secrets?: number; profiles?: number; detail?: string }
      | null;

    if (body?.ok !== true) {
      return { ok: false, secrets: 0, profiles: 0, error: body?.detail ?? 'Import failed.' };
    }

    // A deployment predating the import action answers the sync sweep instead —
    // ok: true with no counts. Defaulting those to 0 reported "imported 0
    // accounts and 0 profiles" for a call that never reached the router, so an
    // answer without both counts is a failure, not an empty success.
    if (typeof body.secrets !== 'number' || typeof body.profiles !== 'number') {
      return {
        ok: false,
        secrets: 0,
        profiles: 0,
        error:
          'The mikrotik-sync function did not return an import result. It is most likely running an older deployment that does not support importing.',
      };
    }

    return { ok: true, secrets: body.secrets, profiles: body.profiles };
  } catch (err) {
    return { ok: false, secrets: 0, profiles: 0, error: (err as Error).message };
  }
}
