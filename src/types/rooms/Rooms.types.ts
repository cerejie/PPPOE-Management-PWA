// Domain types mirroring the Supabase schema.

export interface Room {
  readonly id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Router {
  readonly id: string;
  room_id: string | null;
  label: string;
  model: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// --- MikroTik API connection -------------------------------------------------
//
// Not a Dexie table. The credentials live server-side and are only ever reached
// through the mikrotik-sync Edge Function, so none of this is mirrored locally.

/** What the SuperAdmin types into Settings → MikroTik. */
export interface MikrotikCredentials {
  /** Host, or `host:port`. Port defaults to 8729 (api-ssl). */
  address: string;
  username: string;
  password: string;
  /** api-ssl when true, plain api when false. */
  tls: boolean;
  /** PEM of the router's CA. Required for api-ssl with a self-signed certificate. */
  caCert: string;
}

/** Non-secret view of the stored connection. The password is never returned. */
export interface MikrotikStatus {
  configured: boolean;
  host: string | null;
  port: number | null;
  username: string | null;
  tls: boolean;
  /** Router identity/firmware, captured at the last successful connection. */
  identity: string | null;
  version: string | null;
  board: string | null;
  lastOkAt: string | null;
  lastError: string | null;
}
