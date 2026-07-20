import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { formatDuration } from '@/lib/format';
import { isClientEvent } from '@/lib/types';
import type {
  OutboxConnectionEventPayload,
  OutboxPauseEventPayload,
  OutboxPaymentPayload,
} from '@/lib/types';

export type LedgerKind = 'payment' | 'connection' | 'pause';

export interface LedgerEntry {
  /** Stable across renders: server id, or the outbox idempotency key. */
  id: string;
  at: string;
  kind: LedgerKind;
  title: string;
  detail: string;
  /** Signed peso amount for payments; null for non-financial rows. */
  amount: number | null;
  pending: boolean;
  failed: boolean;
}

export interface Ledger {
  entries: LedgerEntry[];
  totalPaid: number;
  /** Seconds of subscription time returned by completed resumes. */
  totalCredited: number;
  /** True when the local mirror hit a sync cap and history may be incomplete. */
  truncated: boolean;
}

/** Sync mirrors 6 months of payments and the newest 500 rows of each event table. */
const EVENT_MIRROR_LIMIT = 500;

/**
 * One merged, newest-first timeline of everything that happened to a client:
 * payments, connect/disconnect events, and vacation pauses — including rows
 * still sitting in the outbox, so an offline device shows a complete picture.
 *
 * Both the ledger drawer and the PDF export read this, so they cannot drift.
 */
export function useClientLedger(clientId: string | undefined): Ledger | undefined {
  return useLiveQuery(async () => {
    if (!clientId) return undefined;

    const [payments, events, pauses, outbox] = await Promise.all([
      db.payments.where('client_id').equals(clientId).toArray(),
      db.connection_events.where('client_id').equals(clientId).toArray(),
      db.pause_events.where('client_id').equals(clientId).toArray(),
      db.outbox.toArray(),
    ]);

    const entries: LedgerEntry[] = [];

    for (const p of payments) {
      entries.push({
        id: p.id,
        at: p.paid_at,
        kind: 'payment',
        title: p.amount < 0 ? 'Payment correction' : 'Payment',
        detail: [p.method ?? '—', p.note].filter(Boolean).join(' · '),
        amount: p.amount,
        pending: false,
        failed: false,
      });
    }

    for (const e of events) {
      entries.push({
        id: e.id,
        at: e.performed_at,
        kind: 'connection',
        title: e.action === 'connect' ? 'Connected' : 'Disconnected',
        detail: e.note ?? '',
        amount: null,
        pending: false,
        failed: false,
      });
    }

    for (const p of pauses) {
      const credited = p.action === 'resume' ? formatDuration(p.credited_seconds) : '';
      entries.push({
        id: p.id,
        at: p.performed_at,
        kind: 'pause',
        title: p.action === 'pause' ? 'Paused' : 'Resumed',
        detail: [credited && `${credited} credited`, p.note].filter(Boolean).join(' · '),
        amount: null,
        pending: false,
        failed: false,
      });
    }

    // Unsynced writes, so the timeline is honest while offline. Entity writes
    // (client edits, room changes) are not timeline events and are skipped.
    for (const item of outbox) {
      if (!isClientEvent(item) || item.payload.client_id !== clientId) continue;
      const failed = item.status === 'failed';

      if (item.kind === 'payment') {
        const p = item.payload as OutboxPaymentPayload;
        entries.push({
          id: item.client_uuid,
          at: p.paid_at,
          kind: 'payment',
          title: p.amount < 0 ? 'Payment correction' : 'Payment',
          detail: [p.method ?? '—', p.note].filter(Boolean).join(' · '),
          amount: p.amount,
          pending: !failed,
          failed,
        });
      } else if (item.kind === 'pause_event') {
        const p = item.payload as OutboxPauseEventPayload;
        entries.push({
          id: item.client_uuid,
          at: p.performed_at,
          kind: 'pause',
          // Credit is stamped server-side, so it is unknown until this syncs.
          title: p.action === 'pause' ? 'Paused' : 'Resumed',
          detail: p.note ?? '',
          amount: null,
          pending: !failed,
          failed,
        });
      } else {
        const e = item.payload as OutboxConnectionEventPayload;
        entries.push({
          id: item.client_uuid,
          at: e.performed_at,
          kind: 'connection',
          title: e.action === 'connect' ? 'Connected' : 'Disconnected',
          detail: e.note ?? '',
          amount: null,
          pending: !failed,
          failed,
        });
      }
    }

    entries.sort((a, b) => b.at.localeCompare(a.at));

    return {
      entries,
      totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCredited: pauses.reduce((sum, p) => sum + p.credited_seconds, 0),
      truncated:
        events.length >= EVENT_MIRROR_LIMIT || pauses.length >= EVENT_MIRROR_LIMIT,
    };
  }, [clientId]);
}
