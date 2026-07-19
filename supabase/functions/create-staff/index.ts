// =============================================================================
// Edge Function: create-staff
//
// Only a SuperAdmin may create staff accounts. Creating an auth user requires
// the service role key, which must never reach the browser — so it lives here.
//
// Flow:
//   1. Verify the caller's JWT and that their app_users role is 'superadmin'.
//   2. Create the auth user with a synthetic email (username@STAFF_EMAIL_DOMAIN).
//   3. Insert the matching app_users row (role 'staff').
//
// Env (set with `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are injected
//   automatically. STAFF_EMAIL_DOMAIN must be set to match the client.
// =============================================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

interface CreateStaffBody {
  username: string;
  password: string;
  display_name: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const USERNAME_RE = /^[a-z0-9._-]{3,32}$/;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const emailDomain = Deno.env.get('STAFF_EMAIL_DOMAIN') ?? 'pppoe.local';

  if (!url || !anonKey || !serviceKey) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'missing_authorization' }, 401);
  }

  // --- 1. Verify the caller is an active superadmin ------------------------
  const callerClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const {
    data: { user: caller },
    error: callerErr,
  } = await callerClient.auth.getUser();

  if (callerErr || !caller) {
    return json({ error: 'invalid_token' }, 401);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: callerRow, error: roleErr } = await admin
    .from('app_users')
    .select('role, is_active')
    .eq('id', caller.id)
    .single();

  if (roleErr || !callerRow || callerRow.role !== 'superadmin' || !callerRow.is_active) {
    return json({ error: 'forbidden' }, 403);
  }

  // --- 2. Validate input ---------------------------------------------------
  let body: CreateStaffBody;
  try {
    body = (await req.json()) as CreateStaffBody;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const username = (body.username ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const displayName = (body.display_name ?? '').trim();

  if (!USERNAME_RE.test(username)) {
    return json({ error: 'invalid_username' }, 400);
  }
  if (password.length < 8) {
    return json({ error: 'weak_password' }, 400);
  }
  if (displayName.length < 1) {
    return json({ error: 'invalid_display_name' }, 400);
  }

  const email = `${username}@${emailDomain}`;

  // --- 3. Create auth user, then the app_users row -------------------------
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
  });

  if (createErr || !created.user) {
    return json({ error: 'create_failed', detail: createErr?.message }, 400);
  }

  const { error: insertErr } = await admin.from('app_users').insert({
    id: created.user.id,
    username,
    display_name: displayName,
    role: 'staff',
    is_active: true,
  });

  if (insertErr) {
    // Roll back the auth user so we don't leave an orphan.
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: 'profile_insert_failed', detail: insertErr.message }, 400);
  }

  return json(
    { ok: true, user: { id: created.user.id, username, display_name: displayName } },
    201,
  );
});
