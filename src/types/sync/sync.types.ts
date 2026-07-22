// Outbox (offline writes queued for sync).

import type { ConnectionAction, PauseAction } from '@/types/clients/clients.types';

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
