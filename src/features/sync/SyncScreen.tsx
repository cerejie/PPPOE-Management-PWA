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
import { useOnline } from './useSyncStatus';

function describeItem(item: OutboxItem): string {
  if (item.kind === 'payment') {
    const p = item.payload as OutboxPaymentPayload;
    return `Payment ${formatMoney(p.amount)}`;
  }
  const e = item.payload as OutboxConnectionEventPayload;
  return e.action === 'connect' ? 'Connect client' : 'Disconnect client';
}

function OutboxRow({ item }: { item: OutboxItem }) {
  const client = useLiveQuery(
    () => db.clients.get(item.payload.client_id),
    [item.payload.client_id],
  );

  return (
    <li className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-slate-900">{describeItem(item)}</p>
          <p className="text-sm text-muted">
            {client?.full_name ?? 'Unknown client'} · {formatDateTime(item.created_at)}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            item.status === 'failed' ? 'bg-red-50 text-danger' : 'bg-amber-50 text-warn'
          }`}
        >
          {item.status}
        </span>
      </div>

      {item.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-danger">{item.error}</p>
      )}

      {item.status === 'failed' && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void retryOutboxItem(item.client_uuid)}
            className="min-h-[44px] flex-1 rounded-xl bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-text active:opacity-70"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Discard this unsynced item? This cannot be undone.')) {
                void discardOutboxItem(item.client_uuid);
              }
            }}
            className="min-h-[44px] flex-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-danger active:opacity-70"
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

  return (
    <Screen title="Sync queue" back>
      {items.length === 0 ? (
        <div className="py-16 text-center text-muted">
          <p className="text-4xl">✅</p>
          <p className="mt-2 text-sm">Everything is synced.</p>
        </div>
      ) : (
        <>
          {online && (
            <button
              type="button"
              onClick={() => void flushOutbox()}
              className="mb-4 min-h-[48px] w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white active:opacity-80"
            >
              Sync now
            </button>
          )}
          <ul className="space-y-3">
            {items.map((item) => (
              <OutboxRow key={item.client_uuid} item={item} />
            ))}
          </ul>
        </>
      )}
    </Screen>
  );
}
