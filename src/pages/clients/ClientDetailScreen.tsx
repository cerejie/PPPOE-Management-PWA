import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/common/layout/Screen';
import { ExpiryBadge } from '@/components/common/badges/ExpiryBadge';
import { useAuth } from '@/store/auth/AuthContext';
import { RecordPaymentSheet } from '@/components/payments/sheets/RecordPaymentSheet';
import { toggleConnection } from '@/services/payments/payments.actions';
import { formatDate, formatDateTime, formatDuration, formatMoney } from '@/utils/common/format';
import { useClient, useClientOutbox } from '@/hooks/clients/useClients';
import { usePlans } from '@/hooks/plans/usePlans';
import { useRooms } from '@/hooks/rooms/useRooms';
import { useClientLedger } from '@/hooks/clients/useClientLedger';
import { LedgerSheet } from '@/components/clients/sheets/LedgerSheet';
import { PauseSheet } from '@/components/clients/sheets/PauseSheet';

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
  const outbox = useClientOutbox(id);
  const ledger = useClientLedger(id);

  const [showPayment, setShowPayment] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showPause, setShowPause] = useState(false);
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
  const paused = client.paused_at !== null;
  const pausedSeconds = paused
    ? Math.max(0, (Date.now() - new Date(client.paused_at as string).getTime()) / 1000)
    : 0;

  // Pending payments show inside the ledger drawer; only the connection card
  // needs its own pending count.
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
            {/*
              While paused the line is down *because* of the pause, and Resume
              already reconnects it. Offering Connect here would duplicate that
              button — and worse, connecting without resuming leaves the client
              online with a frozen clock, a state Resume can never produce.
            */}
            {paused ? (
              <span className="shrink-0 text-right text-xs font-medium text-muted">
                Resume to
                <br />
                reconnect
              </span>
            ) : (
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
            )}
          </div>
          {pendingEvents.length > 0 && (
            <p className="mt-4 rounded-2xl bg-warn-soft px-3 py-2 text-xs font-medium text-warn">
              {pendingEvents.length} connection change{pendingEvents.length > 1 ? 's' : ''} pending
              sync
            </p>
          )}
        </section>

        {/* Vacation pause */}
        <section
          className={`mt-3 rounded-4xl p-5 shadow-card ${paused ? 'bg-warn-soft' : 'bg-surface'}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={`font-bold ${paused ? 'text-warn' : 'text-fg'}`}>
                {paused ? 'Subscription paused' : 'Subscription running'}
              </p>
              <p className="mt-1 text-xs text-muted">
                {paused
                  ? `Frozen ${formatDuration(pausedSeconds)} ago — resuming adds that back to the expiry.`
                  : 'Pause to freeze the remaining days while the room is empty.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPause(true)}
              className={`min-h-[48px] shrink-0 rounded-2xl px-5 py-3 font-semibold active:opacity-80 ${
                paused ? 'bg-ok text-white shadow-float' : 'bg-surface-2 text-fg'
              }`}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </section>

        {/* Profile */}
        <section className="mt-3 rounded-4xl bg-surface px-5 py-1 shadow-card">
          <InfoRow label="Room" value={room?.name ?? '—'} />
          <InfoRow label="Plan" value={planValue} />
          <InfoRow label="Monthly fee" value={formatMoney(client.monthly_fee)} />
          <InfoRow label="Account" value={client.account_status} />
          <InfoRow label="Installed" value={formatDate(client.installed_at)} />
          <div className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-b-0">
            <span className="text-sm text-muted">{paused ? 'Expires (frozen)' : 'Expires'}</span>
            <span className="flex items-center gap-2 text-sm font-semibold text-fg">
              {formatDate(client.expires_at)}{' '}
              <ExpiryBadge expiresAt={client.expires_at} pausedAt={client.paused_at} />
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

        {/* Ledger: payments, connection events and pauses in one timeline. */}
        <SectionHeading>Ledger</SectionHeading>
        <button
          type="button"
          onClick={() => setShowLedger(true)}
          className="flex w-full items-center gap-3 rounded-3xl bg-surface px-4 py-4 text-left shadow-card active:bg-surface-2"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-fg">
              {ledger ? `${ledger.entries.length} entries` : 'Loading…'}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {ledger
                ? `${formatMoney(ledger.totalPaid)} paid${
                    ledger.totalCredited > 0
                      ? ` · ${formatDuration(ledger.totalCredited)} credited`
                      : ''
                  }`
                : 'Payments, connection events and pauses'}
            </p>
          </div>
          {ledger && ledger.entries.length > 0 && (
            <span className="shrink-0 text-xs font-semibold text-muted">
              {formatDateTime(ledger.entries[0]?.at ?? null)}
            </span>
          )}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="shrink-0 text-muted/60"
            aria-hidden
          >
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </Screen>

      {showPayment && (
        <RecordPaymentSheet client={client} onClose={() => setShowPayment(false)} />
      )}

      {showPause && <PauseSheet client={client} onClose={() => setShowPause(false)} />}

      {showLedger && (
        <LedgerSheet
          client={client}
          room={room}
          plan={plan}
          onClose={() => setShowLedger(false)}
        />
      )}
    </>
  );
}
