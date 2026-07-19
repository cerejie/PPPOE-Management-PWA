import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { ExpiryBadge } from '@/components/ExpiryBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { RecordPaymentSheet } from '@/features/payments/RecordPaymentSheet';
import { toggleConnection } from '@/features/payments/actions';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import type { OutboxConnectionEventPayload, OutboxPaymentPayload } from '@/lib/types';
import {
  useClient,
  useClientEvents,
  useClientOutbox,
  useClientPayments,
  usePlans,
  useRooms,
} from './hooks';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function ClientDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appUser, isSuperAdmin } = useAuth();

  const client = useClient(id);
  const rooms = useRooms();
  const plans = usePlans();
  const payments = useClientPayments(id);
  const events = useClientEvents(id);
  const outbox = useClientOutbox(id);

  const [showPayment, setShowPayment] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (client === undefined) {
    return (
      <Screen title="Client" back>
        <p className="py-16 text-center text-sm text-muted">Loading…</p>
      </Screen>
    );
  }

  const room = rooms?.find((r) => r.id === client.room_id);
  const plan = plans?.find((p) => p.id === client.plan_id);
  const connected = client.connection_status === 'connected';

  const pendingPayments = (outbox ?? []).filter((i) => i.kind === 'payment');
  const pendingEvents = (outbox ?? []).filter((i) => i.kind === 'connection_event');

  async function handleToggle() {
    if (!client || toggling) return;
    setToggling(true);
    await toggleConnection({
      clientId: client.id,
      action: connected ? 'disconnect' : 'connect',
      performedBy: appUser?.id ?? null,
    });
    setToggling(false);
  }

  return (
    <Screen
      title={client.full_name}
      back
      action={
        isSuperAdmin ? (
          <button
            type="button"
            onClick={() => navigate(`/clients/${client.id}/edit`)}
            aria-label="Edit client"
            className="flex h-11 items-center justify-center rounded-full px-2 text-sm font-medium text-white active:opacity-60"
          >
            Edit
          </button>
        ) : undefined
      }
    >
      {/* Status card + toggle */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-lg font-semibold ${connected ? 'text-ok' : 'text-slate-500'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </p>
            <p className="text-xs text-muted">
              since {formatDateTime(client.connection_status_updated_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleToggle()}
            disabled={toggling}
            aria-pressed={connected}
            className={`min-h-[48px] rounded-xl px-5 py-3 font-semibold text-white active:opacity-80 disabled:opacity-50 ${
              connected ? 'bg-danger' : 'bg-ok'
            }`}
          >
            {connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        {pendingEvents.length > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-warn">
            {pendingEvents.length} connection change{pendingEvents.length > 1 ? 's' : ''} pending sync
          </p>
        )}
      </section>

      {/* Profile */}
      <section className="mt-4 rounded-2xl bg-white px-4 py-2 shadow-sm">
        <InfoRow label="PPPoE username" value={client.pppoe_username} />
        <InfoRow label="Room" value={room?.name ?? '—'} />
        <InfoRow label="Plan" value={plan ? `${plan.name} · ${formatMoney(plan.price)}` : '—'} />
        <InfoRow label="Monthly fee" value={formatMoney(client.monthly_fee)} />
        <InfoRow label="Account" value={client.account_status} />
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="text-sm text-muted">Expires</span>
          <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
            {formatDate(client.expires_at)} <ExpiryBadge expiresAt={client.expires_at} />
          </span>
        </div>
        {client.notes && (
          <p className="border-t border-slate-100 py-3 text-sm text-slate-600">{client.notes}</p>
        )}
      </section>

      {/* Record payment */}
      <button
        type="button"
        onClick={() => setShowPayment(true)}
        className="mt-4 min-h-[52px] w-full rounded-2xl bg-accent px-4 py-3.5 font-semibold text-white shadow-sm active:opacity-80"
      >
        Record payment
      </button>

      {/* Payment history */}
      <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Payments</h2>
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {pendingPayments.map((item) => {
          const p = item.payload as OutboxPaymentPayload;
          return (
            <div
              key={item.client_uuid}
              className="flex items-center justify-between border-b border-slate-100 px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900">{formatMoney(p.amount)}</p>
                <p className="text-xs text-muted">{formatDateTime(p.paid_at)} · {p.method ?? '—'}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-warn">
                {item.status === 'failed' ? 'failed' : 'pending'}
              </span>
            </div>
          );
        })}
        {(payments ?? []).length === 0 && pendingPayments.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No payments yet.</p>
        ) : (
          (payments ?? []).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0"
            >
              <div>
                <p className={`font-medium ${p.amount < 0 ? 'text-danger' : 'text-slate-900'}`}>
                  {formatMoney(p.amount)}
                </p>
                <p className="text-xs text-muted">
                  {formatDateTime(p.paid_at)} · {p.method ?? '—'}
                  {p.note ? ` · ${p.note}` : ''}
                </p>
              </div>
              {p.covers_to && (
                <span className="text-xs text-muted">→ {formatDate(p.covers_to)}</span>
              )}
            </div>
          ))
        )}
      </section>

      {/* Event history */}
      <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Connection events</h2>
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {pendingEvents.map((item) => {
          const e = item.payload as OutboxConnectionEventPayload;
          return (
            <div
              key={item.client_uuid}
              className="flex items-center justify-between border-b border-slate-100 px-4 py-3"
            >
              <p className="text-sm font-medium capitalize text-slate-900">{e.action}</p>
              <span className="text-xs text-warn">pending · {formatDateTime(e.performed_at)}</span>
            </div>
          );
        })}
        {(events ?? []).length === 0 && pendingEvents.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">No events yet.</p>
        ) : (
          (events ?? []).map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0"
            >
              <p className="text-sm font-medium capitalize text-slate-900">{e.action}</p>
              <span className="text-xs text-muted">{formatDateTime(e.performed_at)}</span>
            </div>
          ))
        )}
      </section>

      {showPayment && (
        <RecordPaymentSheet client={client} plan={plan} onClose={() => setShowPayment(false)} />
      )}
    </Screen>
  );
}
