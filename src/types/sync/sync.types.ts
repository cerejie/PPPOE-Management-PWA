// Outbox (offline writes queued for sync).

import type {
  ConnectionAction,
  ConnectionStatus,
  PauseAction,
} from '@/types/clients/clients.types';

/** The client columns a queued event's optimistic mirror can move. */
export interface ClientDerivedState {
  expires_at: string | null;
  paused_at: string | null;
  connection_status: ConnectionStatus;
  connection_status_updated_at: string;
}

export type OutboxKind = 'payment' | 'connection_event' | 'pause_event' | 'entity_write';

/**
 * Tables whose SuperAdmin CRUD can be queued offline.
 *
 * The three event tables are here only for deletes — their inserts go through
 * the dedicated payment/connection/pause kinds, which carry the idempotency key
 * the server's onConflict clause needs.
 */
export type EntityTable =
  | 'clients'
  | 'rooms'
  | 'routers'
  | 'plans'
  | 'payments'
  | 'connection_events'
  | 'pause_events'
  | 'app_users';

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
 * A queued create/edit/delete of a domain row.
 *
 * `row_id` is generated on the device, so an offline-created row has its real
 * primary key immediately and other offline rows can reference it. For an
 * insert, `values` is the complete row (including `id`); for an update it is a
 * patch — a soft delete of a client or room is just a patch setting
 * `deleted_at`. `op: 'delete'` is the hard delete used on ledger rows, which
 * have no `deleted_at` and are removed outright.
 */
export interface OutboxEntityPayload {
  table: EntityTable;
  op: 'insert' | 'update' | 'delete';
  row_id: string;
  /** A full domain row (insert) or a patch of one (update); absent on delete. */
  values?: object;
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
  /**
   * The client's derived state immediately before this item's mirror was
   * applied. Set on the three event kinds only, and read when a queued event is
   * discarded before it ever reaches the server: there is no server row to
   * delete in that case, so the optimistic effect has to be unwound from here.
   */
  undo?: ClientDerivedState;
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
