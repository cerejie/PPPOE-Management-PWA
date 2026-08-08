// Domain types mirroring the Supabase schema.

export type AccountStatus = 'active' | 'suspended' | 'terminated';
export type ConnectionStatus = 'connected' | 'disconnected';
export type StatusSource = 'manual' | 'router';
export type ConnectionAction = 'connect' | 'disconnect';
export type PauseAction = 'pause' | 'resume';

/** The three row types a client's ledger merges, and can delete individually. */
export type LedgerKind = 'payment' | 'connection' | 'pause';

export interface Client {
  readonly id: string;
  full_name: string;
  /**
   * The PPPoE line this client is on. 1:1 — an account belongs to at most one
   * client — and the only half the app writes.
   */
  pppoe_account_id: string | null;
  /**
   * Name of that account, maintained by a DB trigger (migration 0009) so search,
   * the ledger PDF and the router sweep keep resolving a client to a line
   * without a join. Read-only: assign the account, never this.
   */
  pppoe_username: string | null;
  room_id: string | null;
  router_id: string | null;
  plan_id: string | null;
  monthly_fee: number;
  account_status: AccountStatus;
  connection_status: ConnectionStatus;
  connection_status_updated_at: string;
  status_source: StatusSource;
  /** Install date. Seeds the first expires_at at creation; a record afterwards. */
  installed_at: string | null;
  expires_at: string | null;
  /** Non-null while a vacation pause is open; expires_at is frozen until resume. */
  paused_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ConnectionEvent {
  readonly id: string;
  client_id: string;
  action: ConnectionAction;
  performed_by: string | null;
  performed_at: string;
  note: string | null;
  client_uuid: string;
  /** Set once the Edge Function has asserted this state on the MikroTik. */
  executed_on_router: boolean;
  /** Why the last router push failed. Optional: added by the dispatch migration. */
  router_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PauseEvent {
  readonly id: string;
  client_id: string;
  action: PauseAction;
  performed_by: string | null;
  performed_at: string;
  note: string | null;
  client_uuid: string;
  /** Seconds of subscription time given back. Stamped by the server on resume. */
  credited_seconds: number;
  created_at: string;
  updated_at: string;
}
