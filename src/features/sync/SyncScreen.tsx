import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { discardOutboxItem, flushOutbox, retryOutboxItem } from '@/lib/sync';
import { formatDateTime, formatMoney } from '@/lib/format';
import type {
  OutboxConnectionEventPayload,
  OutboxItem,
  OutboxPaymentPayload,
} from '@/lib/types';
import { Screen } from '@/components/Screen';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { primaryButtonClass } from '@/components/formStyles';
import { useOnline } from './useSyncStatus';

function describeItem(item: OutboxItem): string {
  if (item.kind === 'payment') {
    const p = item.payload as OutboxPaymentPayload;
    return `Payment ${formatMoney(p.amount)}`;
  }
  const e = item.payload as OutboxConnectionEventPayload;
  return e.action === 'connect' ? 'Connect client' : 'Disconnect client';
}

function OutboxRow({
  item,
  onDiscard,
}: {
  item: OutboxItem;
  onDiscard: (item: OutboxItem) => void;
}) {
  const client = useLiveQuery(
    () => db.clients.get(item.payload.client_id),
    [item.payload.client_id],
  );

  return (
    <li className="rounded-3xl bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-fg">{describeItem(item)}</p>
          <p className="truncate text-sm text-muted">
            {client?.full_name ?? 'Unknown client'} · {formatDateTime(item.created_at)}
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
