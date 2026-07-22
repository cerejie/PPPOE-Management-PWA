// Domain types mirroring the Supabase schema.

export type AppRole = 'superadmin' | 'staff';
export type AccountStatus = 'active' | 'suspended' | 'terminated';
export type ConnectionStatus = 'connected' | 'disconnected';
export type StatusSource = 'manual' | 'router';
export type ConnectionAction = 'connect' | 'disconnect';
export type PauseAction = 'pause' | 'resume';

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

// ---------------------------------------------------------------------------
// Outbox (offline writes queued for sync)
// ---------------------------------------------------------------------------

export type OutboxKind = 'payment' | 'connection_event' | 'pause_event' | 'entity_write';

/** Tables whose SuperAdmin CRUD can be queued offline. */
export type EntityTable = 'clients' | 'rooms' | 'routers' | 'plans';

export interface OutboxPaymentPayload {
  client_id: string;
  amount: number;
  /** When the money was collected — often earlier than when it was entered. */
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

export interface OutboxPauseEventPayload {
  client_id: string;
  action: PauseAction;
  performed_at: string;
  note: string | null;
  performed_by: string | null;
  client_uuid: string;
}

/**
 * A queued create/edit/soft-delete of a domain row.
 *
 * `row_id` is generated on the device, so an offline-created row has its real
 * primary key immediately and other offline rows can reference it. For an
 * insert, `values` is the complete row (including `id`); for an update it is a
 * patch — a soft delete is just a patch setting `deleted_at`.
 */
export interface OutboxEntityPayload {
  table: EntityTable;
  op: 'insert' | 'update';
  row_id: string;
  /** A full domain row (insert) or a patch of one (update), matching `table`. */
  values: object;
  client_uuid: string;
}

export type OutboxStatus = 'pending' | 'failed';

export type OutboxPayload =
  | OutboxPaymentPayload
  | OutboxConnectionEventPayload
  | OutboxPauseEventPayload
  | OutboxEntityPayload;

interface OutboxItemBase {
  /** client_uuid doubles as the outbox primary key. */
  readonly client_uuid: string;
  status: OutboxStatus;
  error: string | null;
  created_at: string; // local timestamp
  attempts: number;
}

/**
 * Discriminated on `kind` so payload access is checked. In particular, only
 * the three event kinds carry a `client_id`; an entity write does not belong
 * to any one client's timeline, and the compiler now enforces that.
 */
export type OutboxItem =
  | (OutboxItemBase & { kind: 'payment'; payload: OutboxPaymentPayload })
  | (OutboxItemBase & { kind: 'connection_event'; payload: OutboxConnectionEventPayload })
  | (OutboxItemBase & { kind: 'pause_event'; payload: OutboxPauseEventPayload })
  | (OutboxItemBase & { kind: 'entity_write'; payload: OutboxEntityPayload });

/** Narrow to the kinds that belong to a single client's timeline. */
export function isClientEvent(
  item: OutboxItem,
): item is Extract<OutboxItem, { payload: { client_id: string } }> {
  return item.kind !== 'entity_write';
}

export interface SyncMeta {
  readonly key: string;
  value: string;
}
