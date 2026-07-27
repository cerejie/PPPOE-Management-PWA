import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import { discardOutboxItem, flushOutbox, retryOutboxItem } from '@/api/sync/syncEngine';
import { formatDateTime, formatMoney } from '@/utils/common/format';
import { isClientEvent, type EntityTable, type OutboxItem } from '@/types/sync/sync.types';
import { Screen } from '@/components/common/layout/Screen';
import { ConfirmDialog } from '@/components/common/overlays/ConfirmDialog';
import { primaryButtonClass } from '@/styles/common/formStyles';
import { useOnline } from '@/hooks/sync/useSyncStatus';

/** Singular noun per table, for describing a queued entity write. */
const ENTITY_LABEL: Record<EntityTable, string> = {
  clients: 'client',
  rooms: 'room',
  routers: 'router',
  plans: 'plan',
  payments: 'payment',
  connection_events: 'connection event',
  pause_events: 'pause event',
  app_users: 'staff account',
};

function describeItem(item: OutboxItem): string {
  if (item.kind === 'payment') return `Payment ${formatMoney(item.payload.amount)}`;
  if (item.kind === 'pause_event') {
    return item.payload.action === 'pause' ? 'Pause client' : 'Resume client';
  }
  if (item.kind === 'connection_event') {
    return item.payload.action === 'connect' ? 'Connect client' : 'Disconnect client';
  }

  const e = item.payload;
  const noun = ENTITY_LABEL[e.table];
  if (e.op === 'insert') return `Add ${noun}`;
  if (e.op === 'delete') return `Delete ${noun}`;
  // A soft delete is an update that sets deleted_at; name it as a delete.
  return e.values && 'deleted_at' in e.values ? `Delete ${noun}` : `Edit ${noun}`;
}

/**
 * Name of the row an item refers to. Entity writes resolve against their own
 * table — including rows that only exist locally, which is the whole point.
 */
function useSubject(item: OutboxItem): string {
  return (
    useLiveQuery(async () => {
      if (isClientEvent(item)) {
        const client = await db.clients.get(item.payload.client_id);
        return client?.full_name ?? 'Unknown client';
      }
      const row = (await db.table(item.payload.table).get(item.payload.row_id)) as
        | { full_name?: string; name?: string; label?: string }
        | undefined;
      return row?.full_name ?? row?.name ?? row?.label ?? ENTITY_LABEL[item.payload.table];
    }, [item.client_uuid]) ?? '…'
  );
}

function OutboxRow({
  item,
  onDiscard,
}: {
  item: OutboxItem;
  onDiscard: (item: OutboxItem) => void;
}) {
  const subject = useSubject(item);

  return (
    <li className="rounded-3xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-fg">{describeItem(item)}</p>
          <p className="truncate text-sm text-muted">
            {subject} · {formatDateTime(item.created_at)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            item.status === 'failed' ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'
          }`}
        >
          {item.status}
        </span>
      </div>

      {item.error && (
        <p className="mt-3 rounded-2xl bg-danger-soft px-3 py-2 text-xs text-danger">
          {item.error}
        </p>
      )}

      {item.status === 'failed' && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void retryOutboxItem(item.client_uuid)}
            className="min-h-[46px] flex-1 rounded-2xl bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-text active:opacity-70"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => onDiscard(item)}
            className="min-h-[46px] flex-1 rounded-2xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger active:opacity-70"
          >
            Discard
          </button>
        </div>
      )}
    </li>
  );
}

export function SyncScreen() {
  const online = useOnline();
  const items = useLiveQuery(() => db.outbox.orderBy('created_at').toArray(), []) ?? [];
  const [discarding, setDiscarding] = useState<OutboxItem | null>(null);

  return (
    <>
      <Screen title="Sync queue" back>
        {items.length === 0 ? (
          <div className="rounded-4xl bg-surface p-10 text-center shadow-card">
            <p className="text-3xl">✅</p>
            <p className="mt-3 font-semibold text-fg">Everything is synced</p>
            <p className="mt-1 text-sm text-muted">Nothing is waiting to upload.</p>
          </div>
        ) : (
          <>
            {online && (
              <button
                type="button"
                onClick={() => void flushOutbox()}
                className={`mb-4 ${primaryButtonClass}`}
              >
                Sync now
              </button>
            )}
            <ul className="space-y-3">
              {items.map((item) => (
                <OutboxRow key={item.client_uuid} item={item} onDiscard={setDiscarding} />
              ))}
            </ul>
          </>
        )}
      </Screen>

      {discarding && (
        <ConfirmDialog
          title="Discard this item?"
          message={`"${describeItem(discarding)}" was rejected by the server and will be deleted from this device. This cannot be undone.`}
          confirmLabel="Discard"
          onConfirm={() => {
            void discardOutboxItem(discarding.client_uuid);
            setDiscarding(null);
          }}
          onCancel={() => setDiscarding(null)}
        />
      )}
    </>
  );
}
