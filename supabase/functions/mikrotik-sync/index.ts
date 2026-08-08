// =============================================================================
// Edge Function: mikrotik-sync
//
// Pushes connection state to the MikroTik. Disconnect in the app => the PPPoE
// secret is disabled and any live session is dropped; connect => the secret is
// re-enabled.
//
// Why here and not in the PWA:
//   * Router credentials must never reach the browser (anything VITE_* is
//     public, and Dexie is readable by anyone holding the device), and a
//     browser cannot open a raw TCP socket to the API service.
//   * A disconnect performed offline has to reach the router eventually. The
//     app already queues it into the outbox -> connection_events, so hanging
//     the router push off that table means offline works for free.
//
// It reconciles *desired state*, not the event log: for each client with
// unexecuted events it reads clients.connection_status (already correct, the
// apply_connection_event trigger owns it) and asserts that on the router. Two
// queued events for one client collapse into one router operation, and a retry
// after a partial failure is harmless.
//
// Actions:
//   { action: 'configure', host, port, tls, username, password, ca_cert }
//        SuperAdmin. Verifies the credentials against the router and only
//        stores them if the session succeeds.
//   { action: 'status' }   SuperAdmin. Stored connection, never the password.
//   { action: 'probe' }    SuperAdmin or cron. Re-test the stored credentials.
//   { action: 'sync', client_id? }  Any active user, or cron. Push state. A
//        sweep with no client_id also reconciles pppoe_accounts — see §7.
//   { action: 'import' }   SuperAdmin or cron. Mirror the router's secret and
//        profile lists into the database. Router -> app, the one direction the
//        rest of this function never goes.
//
// Credentials come from public.router_settings (written by Settings ->
// MikroTik). The MIKROTIK_* env vars remain as a fallback so a deployment
// configured before that screen existed keeps working.
//
// Env: SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are
// injected. MIKROTIK_CRON_SECRET authorises the scheduled sweep.
// =============================================================================

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { applyLineState, readIdentity, RouterOsClient } from './routeros.ts';
import { importRouterState, profilesByPlan, reconcileAccounts } from './accounts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface Body {
  action?: 'sync' | 'probe' | 'configure' | 'status' | 'import';
  client_id?: string;
  host?: string;
  port?: number;
  tls?: boolean;
  username?: string;
  password?: string;
  ca_cert?: string | null;
}

interface ClientRow {
  id: string;
  pppoe_username: string | null;
  plan_id: string | null;
  connection_status: 'connected' | 'disconnected';
  deleted_at: string | null;
}

interface RouterConfig {
  host: string;
  port: number;
  tls: boolean;
  user: string;
  password: string;
  caCert?: string;
  timeoutMs: number;
}

/** Events processed per invocation. Bounded so one sweep cannot outrun the wall clock. */
const SWEEP_LIMIT = 500;

const SETTINGS_TABLE = 'router_settings';

// --- configuration -----------------------------------------------------------

function envConfig(): RouterConfig | null {
  const host = Deno.env.get('MIKROTIK_HOST');
  const user = Deno.env.get('MIKROTIK_USER');
  const password = Deno.env.get('MIKROTIK_PASSWORD');
  if (!host || !user || !password) return null;

  const tls = (Deno.env.get('MIKROTIK_TLS') ?? 'true') !== 'false';
  return {
    host,
    port: Number(Deno.env.get('MIKROTIK_PORT') ?? (tls ? 8729 : 8728)),
    tls,
    user,
    password,
    caCert: Deno.env.get('MIKROTIK_CA_CERT') || undefined,
    timeoutMs: 12_000,
  };
}

interface SettingsRow {
  host: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
  ca_cert: string | null;
  identity: string | null;
  version: string | null;
  board: string | null;
  last_ok_at: string | null;
  last_error: string | null;
}

/**
 * Stored settings, or null. Tolerates the table not existing so the function
 * still runs on a deployment where the migration has not been applied.
 */
async function loadSettings(admin: SupabaseClient): Promise<SettingsRow | null> {
  const { data, error } = await admin.from(SETTINGS_TABLE).select('*').limit(1).maybeSingle();
  if (error || !data) return null;
  return data as SettingsRow;
}

function toConfig(row: SettingsRow): RouterConfig {
  return {
    host: row.host,
    port: row.port,
    tls: row.tls,
    user: row.username,
    password: row.password,
    caCert: row.ca_cert || undefined,
    timeoutMs: 12_000,
  };
}

/** Non-secret projection sent to the browser. Never includes the password. */
function toStatus(row: SettingsRow | null, envCfg: RouterConfig | null) {
  if (row) {
    return {
      configured: true,
      host: row.host,
      port: row.port,
      username: row.username,
      tls: row.tls,
      identity: row.identity,
      version: row.version,
      board: row.board,
      lastOkAt: row.last_ok_at,
      lastError: row.last_error,
    };
  }
  if (envCfg) {
    // Configured by deployment secrets rather than the Settings screen.
    return {
      configured: true,
      host: envCfg.host,
      port: envCfg.port,
      username: envCfg.user,
      tls: envCfg.tls,
      identity: null,
      version: null,
      board: null,
      lastOkAt: null,
      lastError: null,
    };
  }
  return {
    configured: false,
    host: null,
    port: null,
    username: null,
    tls: true,
    identity: null,
    version: null,
    board: null,
    lastOkAt: null,
    lastError: null,
  };
}

/**
 * Turn Deno's TLS errors into something a SuperAdmin can act on.
 *
 * `UnknownIssuer` is by far the most common first-run failure: RouterOS serves
 * a self-signed chain, and Deno has no "skip verification" escape hatch, so the
 * CA has to be supplied explicitly. The raw message does not hint at that.
 */
function explainConnectError(raw: string, hasCaCert: boolean): string {
  if (/UnknownIssuer|invalid peer certificate/i.test(raw)) {
    return hasCaCert
      ? `The stored CA certificate does not match the one the router presents (${raw}). Re-export api-ca from the router and paste it again.`
      : 'The router uses a self-signed certificate, so its CA must be supplied. Paste the api-ca PEM under "Show advanced".';
  }
  if (/NotValidForName|CertNotValidForName/i.test(raw)) {
    return `The router's certificate is not valid for this address (${raw}). Its subject-alt-name must match exactly what you typed here.`;
  }
  if (/CertExpired|NotValidYet/i.test(raw)) {
    return `The router's certificate is outside its validity window (${raw}). Check the router's clock.`;
  }
  if (/cannot log in|not logged in/i.test(raw)) {
    return 'Wrong username or password, or the user\'s group is missing the "api" policy.';
  }
  return raw;
}

/** Best-effort health stamp. Silently skipped when the table is absent. */
async function recordHealth(
  admin: SupabaseClient,
  patch: Record<string, unknown>,
): Promise<void> {
  await admin.from(SETTINGS_TABLE).update(patch).eq('id', true);
}

// --- outbox bookkeeping ------------------------------------------------------

async function noteError(
  admin: SupabaseClient,
  eventIds: string[],
  message: string,
): Promise<void> {
  // PostgREST reports an unknown column in `error`, it does not reject, so the
  // missing-column case has to be swallowed explicitly.
  await admin.from('connection_events').update({ router_error: message }).in('id', eventIds);
}

/** Mark events pushed. Clears router_error when that column exists. */
async function markExecuted(admin: SupabaseClient, eventIds: string[]): Promise<void> {
  const { error } = await admin
    .from('connection_events')
    .update({ executed_on_router: true, router_error: null })
    .in('id', eventIds);

  if (error) {
    await admin.from('connection_events').update({ executed_on_router: true }).in('id', eventIds);
  }
}

/**
 * How many accounts the router still owes work for: created or edited while it
 * was out of reach (`synced_to_router = false`), or deleted in the app with the
 * secret still on the box (`deleted_at` set). Counted head-only so a sweep with
 * nothing to do never opens a TCP session.
 */
async function countAccountWork(admin: SupabaseClient): Promise<number> {
  const { count, error } = await admin
    .from('pppoe_accounts')
    .select('id', { count: 'exact', head: true })
    .or('synced_to_router.eq.false,deleted_at.not.is.null');

  // Tolerates the table not existing, like loadSettings: a deployment without
  // migration 0009 keeps pushing connection state.
  return error ? 0 : (count ?? 0);
}

// -----------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json({ error: 'server_misconfigured' }, 500);

  let body: Body;
  try {
    body = req.body ? ((await req.json()) as Body) : {};
  } catch {
    body = {};
  }
  const action = body.action ?? 'sync';

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // --- 1. Authenticate the caller ------------------------------------------
  const cronSecret = Deno.env.get('MIKROTIK_CRON_SECRET');
  const presentedSecret = req.headers.get('x-cron-secret');
  const isCron = Boolean(cronSecret && presentedSecret && presentedSecret === cronSecret);

  let callerRole: string | null = null;
  let callerId: string | null = null;

  if (!isCron) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'missing_authorization' }, 401);

    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const {
      data: { user: caller },
      error: callerErr,
    } = await callerClient.auth.getUser();
    if (callerErr || !caller) return json({ error: 'invalid_token' }, 401);

    const { data: callerRow } = await admin
      .from('app_users')
      .select('role, is_active')
      .eq('id', caller.id)
      .single();

    if (!callerRow || !callerRow.is_active) return json({ error: 'forbidden' }, 403);
    callerRole = callerRow.role;
    callerId = caller.id;
  }

  const isSuperAdmin = callerRole === 'superadmin';
  const envCfg = envConfig();

  // --- 2. status -----------------------------------------------------------
  if (action === 'status') {
    if (!isSuperAdmin) return json({ error: 'forbidden' }, 403);
    const row = await loadSettings(admin);
    return json({ ok: true, status: toStatus(row, envCfg) }, 200);
  }

  // --- 3. configure --------------------------------------------------------
  if (action === 'configure') {
    if (!isSuperAdmin) return json({ error: 'forbidden' }, 403);

    const host = (body.host ?? '').trim();
    const username = (body.username ?? '').trim();
    const password = body.password ?? '';
    const tls = body.tls !== false;
    const port = Number(body.port ?? (tls ? 8729 : 8728));

    // Blank means "keep the certificate already stored", so an admin changing
    // only the password does not have to paste the PEM again.
    const existing = await loadSettings(admin);
    const caCert = (body.ca_cert ?? '').trim() || existing?.ca_cert || null;

    if (!host) return json({ ok: false, detail: 'Router address is required.' }, 400);
    if (!username) return json({ ok: false, detail: 'API username is required.' }, 400);
    if (!password) return json({ ok: false, detail: 'API password is required.' }, 400);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return json({ ok: false, detail: 'Port must be between 1 and 65535.' }, 400);
    }

    const cfg: RouterConfig = {
      host,
      port,
      tls,
      user: username,
      password,
      caCert: caCert || undefined,
      timeoutMs: 12_000,
    };

    // Verify before storing, so "connected" in Settings always means a real
    // session succeeded — not merely that the form was filled in.
    const client = new RouterOsClient(cfg);
    let info: { version: string; board: string; identity: string };
    try {
      await client.connect();
      info = await readIdentity(client);
    } catch (err) {
      return json(
        {
          ok: false,
          error: 'router_unreachable',
          detail: explainConnectError((err as Error).message, Boolean(caCert)),
        },
        502,
      );
    } finally {
      client.close();
    }

    const row: SettingsRow & { id: boolean; updated_by: string | null } = {
      id: true,
      host,
      port,
      tls,
      username,
      password,
      ca_cert: caCert,
      identity: info.identity,
      version: info.version,
      board: info.board,
      last_ok_at: new Date().toISOString(),
      last_error: null,
      updated_by: callerId,
    };

    const { error: saveErr } = await admin.from(SETTINGS_TABLE).upsert(row, { onConflict: 'id' });
    if (saveErr) {
      return json(
        {
          ok: false,
          error: 'save_failed',
          detail: `Connected to the router, but could not store the settings: ${saveErr.message}`,
        },
        500,
      );
    }

    return json({ ok: true, status: toStatus(row, envCfg) }, 200);
  }

  // --- 4. Resolve the connection for probe / sync --------------------------
  const settings = await loadSettings(admin);
  const cfg = settings ? toConfig(settings) : envCfg;

  if (!cfg) {
    return json(
      {
        ok: false,
        error: 'router_not_configured',
        detail: 'No MikroTik connection yet. Set one up in Settings → MikroTik.',
      },
      400,
    );
  }

  // --- 5. probe ------------------------------------------------------------
  if (action === 'probe') {
    if (!isCron && !isSuperAdmin) return json({ error: 'forbidden' }, 403);

    const client = new RouterOsClient(cfg);
    try {
      await client.connect();
      const info = await readIdentity(client);
      const stamp = { ...info, last_ok_at: new Date().toISOString(), last_error: null };

      if (settings) {
        await recordHealth(admin, {
          identity: info.identity,
          version: info.version,
          board: info.board,
          last_ok_at: stamp.last_ok_at,
          last_error: null,
        });
      }

      return json(
        {
          ok: true,
          router: { host: cfg.host, port: cfg.port, tls: cfg.tls, ...info },
          status: toStatus(
            settings ? { ...settings, ...info, last_ok_at: stamp.last_ok_at, last_error: null } : null,
            envCfg,
          ),
        },
        200,
      );
    } catch (err) {
      const detail = explainConnectError((err as Error).message, Boolean(cfg.caCert));
      if (settings) await recordHealth(admin, { last_error: detail });
      return json({ ok: false, error: 'router_unreachable', detail }, 502);
    } finally {
      client.close();
    }
  }

  // --- 5b. import -----------------------------------------------------------
  if (action === 'import') {
    if (!isCron && !isSuperAdmin) return json({ error: 'forbidden' }, 403);

    const client = new RouterOsClient(cfg);
    try {
      await client.connect();
      const result = await importRouterState(admin, client);
      if (settings) {
        await recordHealth(admin, { last_ok_at: new Date().toISOString(), last_error: null });
      }
      return json({ ok: true, ...result }, 200);
    } catch (err) {
      const detail = explainConnectError((err as Error).message, Boolean(cfg.caCert));
      if (settings) await recordHealth(admin, { last_error: detail });
      return json({ ok: false, error: 'router_unreachable', detail }, 502);
    } finally {
      client.close();
    }
  }

  // --- 6. Collect the work --------------------------------------------------
  let query = admin
    .from('connection_events')
    .select('id, client_id')
    .eq('executed_on_router', false)
    .order('performed_at', { ascending: true })
    .limit(SWEEP_LIMIT);

  if (body.client_id) query = query.eq('client_id', body.client_id);

  const { data: pending, error: pendingErr } = await query;
  if (pendingErr) return json({ error: 'query_failed', detail: pendingErr.message }, 500);
  const events = (pending ?? []) as { id: string; client_id: string }[];

  // Secrets the app owes the router. Only on a full sweep: a targeted push is
  // about one client's line, and reconciliation is a whole-list operation that
  // would make every such call pay for it.
  const reconciling = !body.client_id && (await countAccountWork(admin)) > 0;

  if (events.length === 0 && !reconciling) {
    return json({ ok: true, applied: 0, results: [] }, 200);
  }

  const eventsByClient = new Map<string, string[]>();
  for (const row of events) {
    const list = eventsByClient.get(row.client_id) ?? [];
    list.push(row.id);
    eventsByClient.set(row.client_id, list);
  }

  const clientById = new Map<string, ClientRow>();
  const profileByPlan = new Map<string, string>();

  if (eventsByClient.size > 0) {
    const { data: clients, error: clientsErr } = await admin
      .from('clients')
      .select('id, pppoe_username, plan_id, connection_status, deleted_at')
      .in('id', [...eventsByClient.keys()]);

    if (clientsErr) return json({ error: 'query_failed', detail: clientsErr.message }, 500);

    for (const client of (clients ?? []) as ClientRow[]) clientById.set(client.id, client);

    // The plan's RouterOS profile is asserted alongside the line state, so a
    // client moved to another plan actually changes speed.
    const planIds = [
      ...new Set(
        [...clientById.values()].map((c) => c.plan_id).filter((id): id is string => Boolean(id)),
      ),
    ];
    for (const [planId, profile] of await profilesByPlan(admin, planIds)) {
      profileByPlan.set(planId, profile);
    }
  }

  // --- 7. Apply, one TCP session for the whole batch ------------------------
  const router = new RouterOsClient(cfg);
  try {
    await router.connect();
  } catch (err) {
    const detail = explainConnectError((err as Error).message, Boolean(cfg.caCert));
    if (events.length > 0) await noteError(admin, events.map((e) => e.id), detail);
    if (settings) await recordHealth(admin, { last_error: detail });
    // Events stay executed_on_router = false and accounts stay unsynced, so the
    // next sweep retries both.
    return json({ ok: false, error: 'router_unreachable', detail, applied: 0 }, 502);
  }

  const results: Array<Record<string, unknown>> = [];
  let applied = 0;
  let accounts: Awaited<ReturnType<typeof reconcileAccounts>> | undefined;

  try {
    // Before the events: an account created offline and a connection event for
    // the client on it arrive in the same flush, and applyLineState can only
    // find a secret that already exists.
    //
    // Contained: reconciliation failing wholesale must not strand the
    // connection events, which are the older and more urgent job.
    if (reconciling) {
      try {
        accounts = await reconcileAccounts(admin, router);
      } catch (err) {
        accounts = {
          created: 0,
          updated: 0,
          removed: 0,
          missing: 0,
          errors: [{ name: '(reconcile)', error: (err as Error).message }],
        };
      }
    }

    for (const [clientId, eventIds] of eventsByClient) {
      const client = clientById.get(clientId);

      if (!client || client.deleted_at) {
        // Nothing left to assert state on; do not strand the events forever.
        await admin
          .from('connection_events')
          .update({ executed_on_router: true })
          .in('id', eventIds);
        results.push({ client_id: clientId, skipped: 'client_deleted' });
        continue;
      }

      if (!client.pppoe_username) {
        await noteError(admin, eventIds, 'client has no pppoe_username');
        results.push({ client_id: clientId, error: 'missing_pppoe_username' });
        continue;
      }

      try {
        const outcome = await applyLineState(
          router,
          client.pppoe_username,
          client.connection_status === 'connected',
          client.plan_id ? (profileByPlan.get(client.plan_id) ?? null) : null,
        );

        if (!outcome.secretFound) {
          await noteError(
            admin,
            eventIds,
            `no /ppp/secret named "${client.pppoe_username}" on the router`,
          );
          results.push({
            client_id: clientId,
            pppoe_username: client.pppoe_username,
            error: 'secret_not_found',
          });
          continue;
        }

        await markExecuted(admin, eventIds);
        applied += eventIds.length;
        results.push({
          client_id: clientId,
          pppoe_username: client.pppoe_username,
          desired: client.connection_status,
          ...outcome,
        });
      } catch (err) {
        const detail = (err as Error).message;
        await noteError(admin, eventIds, detail);
        results.push({ client_id: clientId, error: detail });
      }
    }
  } finally {
    router.close();
  }

  if (settings) {
    await recordHealth(admin, { last_ok_at: new Date().toISOString(), last_error: null });
  }

  return json({ ok: true, applied, results, ...(accounts ? { accounts } : {}) }, 200);
});
