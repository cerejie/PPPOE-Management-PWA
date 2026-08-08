// Domain types mirroring the Supabase schema.

/**
 * One `/ppp/secret` on the MikroTik.
 *
 * The router owns this list: every secret it holds is mirrored here, enabled or
 * disabled, whether or not the app knows a client for it. Rows the app creates
 * start with `synced_to_router: false` and are pushed on the next sweep.
 */
export interface PppoeAccount {
  readonly id: string;
  name: string;
  /** Plaintext — the only form RouterOS accepts. Mirrored to this device. */
  password: string;
  /**
   * Mirrored verbatim from the router rather than narrowed to a union:
   * RouterOS accepts any/async/l2tp/ovpn/pppoe/pptp/sstp and adds more between
   * releases. The app only ever offers the values in PPPOE_SERVICE_OPTIONS.
   */
  service: string;
  comment: string | null;
  /** Desired line state. Assigned accounts follow their client's connection. */
  disabled: boolean;
  /** RouterOS's internal id ("*1A"), cached so updates need no re-print. */
  router_secret_id: string | null;
  present_on_router: boolean;
  last_seen_at: string | null;
  /** False until the router has been told about this row. */
  synced_to_router: boolean;
  router_error: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * One `/ppp/profile`. Read-only: the router owns these, `importFromRouter`
 * fills the table, and a plan points at one by name to set its bandwidth.
 */
export interface PppoeProfile {
  readonly id: string;
  name: string;
  /** RouterOS's opaque "rx/tx" string, e.g. "10M/10M". Displayed, never parsed. */
  rate_limit: string | null;
  local_address: string | null;
  remote_address: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Outcome of pulling secrets and profiles in from the router. */
export interface RouterImportResult {
  ok: boolean;
  secrets: number;
  profiles: number;
  error?: string;
}
