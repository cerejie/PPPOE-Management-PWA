// Domain types mirroring the Supabase schema.

export type AppRole = 'superadmin' | 'staff';
export type AccountStatus = 'active' | 'suspended' | 'terminated';
export type ConnectionStatus = 'connected' | 'disconnected';
export type StatusSource = 'manual' | 'router';
export type ConnectionAction = 'connect' | 'disconnect';

export interface AppUser {
  readonly id: string;
  username: string;
  display_name: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface Plan {
  readonly id: string;
  name: string;
  price: number;
  /** Days a payment on this plan extends the client's expires_at. */
  duration_days: number;
  /** Advertised downstream speed. 0 = unspecified. */
  mbps: number;
  /** Date the plan stops being offered to new clients. Null = always offered. */
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Client {
  readonly id: string;
  full_name: string;
  pppoe_username: string;
  room_id: string | null;
  router_id: string | null;
  plan_id: string | null;
  monthly_fee: number;
  account_status: AccountStatus;
  connection_status: ConnectionStatus;
  connection_status_updated_at: string;
  status_source: StatusSource;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Payment {
  readonly id: string;
  client_id: string;
  amount: number;
  paid_at: string;
  method: string | null;
  covers_from: string | null;
  covers_to: string | null;
  recorded_by: string | null;
  note: string | null;
  client_uuid: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionEvent {
  readonly id: string;
  client_id: string;
  action: ConnectionAction;
  performed_by: string | null;
  performed_at: string;
  note: string | null;
  client_uuid: string;
  executed_on_router: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Outbox (offline writes queued for sync)
// ---------------------------------------------------------------------------

export type OutboxKind = 'payment' | 'connection_event';

export interface OutboxPaymentPayload {
  client_id: string;
  amount: number;
  paid_at: string;
  method: string | null;
  note: string | null;
  recorded_by: string | null;
  client_uuid: string;
}

export interface OutboxConnectionEventPayload {
  client_id: string;
  action: ConnectionAction;
  performed_at: string;
  note: string | null;
  performed_by: string | null;
  client_uuid: string;
}

export type OutboxStatus = 'pending' | 'failed';

export interface OutboxItem {
  /** client_uuid doubles as the outbox primary key. */
  readonly client_uuid: string;
  kind: OutboxKind;
  payload: OutboxPaymentPayload | OutboxConnectionEventPayload;
  status: OutboxStatus;
  error: string | null;
  created_at: string; // local timestamp
  attempts: number;
}

export interface SyncMeta {
  readonly key: string;
  value: string;
}
