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
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="truncate text-right text-sm font-semibold text-fg">{value}</span>
    </div>
  );
}

function SectionHeading({ children }: { children: string }) {
  return <h2 className="mb-2 mt-7 text-base font-bold tracking-tight text-fg">{children}</h2>;
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

  const planValue = plan
    ? `${plan.name}${plan.mbps > 0 ? ` · ${plan.mbps} Mbps` : ''} · ${formatMoney(plan.price)}`
    : '—';

  return (
    <>
      <Screen
        title={client.full_name}
        eyebrow={client.pppoe_username}
        back
        action={
          isSuperAdmin ? (
            <button
              type="button"
              onClick={() => navigate(`/clients/${client.id}/edit`)}
              aria-label="Edit client"
              className="flex h-10 items-center justify-center rounded-full bg-surface-2 px-4 text-sm font-semibold text-fg active:opacity-60"
            >
              Edit
            </button>
          ) : undefined
        }
      >
        {/* Status card + toggle */}
        <section className="rounded-4xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    connected ? 'bg-ok ring-4 ring-ok/20' : 'bg-muted/40'
                  }`}
                  aria-hidden
                />
                <p className={`text-lg font-bold ${connected ? 'text-ok' : 'text-muted'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted">
                since {formatDateTime(client.connection_status_updated_at)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleToggle()}
              disabled={toggling}
              aria-pressed={connected}
              className={`min-h-[48px] shrink-0 rounded-2xl px-5 py-3 font-semibold text-white shadow-float active:opacity-80 disabled:opacity-50 ${
                connected ? 'bg-danger' : 'bg-ok'
              }`}
            >
              {connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          {pendingEvents.length > 0 && (
            <p className="mt-4 rounded-2xl bg-warn-soft px-3 py-2 text-xs font-medium text-warn">
              {pendingEvents.length} connection change{pendingEvents.length > 1 ? 's' : ''} pending
              sync
            </p>
          )}
        </section>

        {/* Profile */}
        <section className="mt-3 rounded-4xl bg-surface px-5 py-1 shadow-card">
          <InfoRow label="Room" value={room?.name ?? '—'} />
          <InfoRow label="Plan" value={planValue} />
          <InfoRow label="Monthly fee" value={formatMoney(client.monthly_fee)} />
          <InfoRow label="Account" value={client.account_status} />
          <div className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-b-0">
            <span className="text-sm text-muted">Expires</span>
            <span className="flex items-center gap-2 text-sm font-semibold text-fg">
              {formatDate(client.expires_at)} <ExpiryBadge expiresAt={client.expires_at} />
            </span>
          </div>
          {client.notes && (
            <p className="border-t border-line/60 py-3 text-sm text-muted">{client.notes}</p>
          )}
        </section>

        <button
          type="button"
          onClick={() => setShowPayment(true)}
          className="mt-4 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-accent-gradient px-4 py-3.5 font-semibold text-white shadow-float active:opacity-80"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Record payment
        </button>

        {/* Payment history */}
        <SectionHeading>Payments</SectionHeading>
        <section className="overflow-hidden rounded-3xl bg-surface shadow-card">
          {pendingPayments.map((item) => {
            const p = item.payload as OutboxPaymentPayload;
            return (
              <div
                key={item.client_uuid}
                className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-fg">{formatMoney(p.amount)}</p>
                  <p className="truncate text-xs text-muted">
                    {formatDateTime(p.paid_at)} · {p.method ?? '—'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    item.status === 'failed'
                      ? 'bg-danger-soft text-danger'
                      : 'bg-warn-soft text-warn'
                  }`}
                >
                  {item.status === 'failed' ? 'failed' : 'pending'}
                </span>
              </div>
            );
          })}
          {(payments ?? []).length === 0 && pendingPayments.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No payments yet.</p>
          ) : (
            (payments ?? []).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className={`font-semibold ${p.amount < 0 ? 'text-danger' : 'text-fg'}`}>
                    {formatMoney(p.amount)}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {formatDateTime(p.paid_at)} · {p.method ?? '—'}
                    {p.note ? ` · ${p.note}` : ''}
                  </p>
                </div>
                {p.covers_to && (
                  <span className="shrink-0 text-xs text-muted">→ {formatDate(p.covers_to)}</span>
                )}
              </div>
            ))
          )}
        </section>

        {/* Event history */}
        <SectionHeading>Connection events</SectionHeading>
        <section className="overflow-hidden rounded-3xl bg-surface shadow-card">
          {pendingEvents.map((item) => {
            const e = item.payload as OutboxConnectionEventPayload;
            return (
              <div
                key={item.client_uuid}
                className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3"
              >
                <p className="text-sm font-semibold capitalize text-fg">{e.action}</p>
                <span className="shrink-0 text-xs text-warn">
                  pending · {formatDateTime(e.performed_at)}
                </span>
              </div>
            );
          })}
          {(events ?? []).length === 0 && pendingEvents.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No events yet.</p>
          ) : (
            (events ?? []).map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3 last:border-b-0"
              >
                <p className="text-sm font-semibold capitalize text-fg">{e.action}</p>
                <span className="shrink-0 text-xs text-muted">
                  {formatDateTime(e.performed_at)}
                </span>
              </div>
            ))
          )}
        </section>
      </Screen>

      {showPayment && (
        <RecordPaymentSheet client={client} plan={plan} onClose={() => setShowPayment(false)} />
      )}
    </>
  );
}
