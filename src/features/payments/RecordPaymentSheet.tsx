import { useEffect, useState, type FormEvent } from 'react';
import { Sheet } from '@/components/Sheet';
import { fieldClass, labelClass, primaryButtonClass } from '@/components/formStyles';
import { useAuth } from '@/features/auth/AuthContext';
import { useClients, usePlans, type ClientFilters } from '@/features/clients/hooks';
import { useOnline } from '@/features/sync/useSyncStatus';
import {
  formatDate,
  formatMoney,
  fromDateInputStart,
  todayInputValue,
} from '@/lib/format';
import { nextExpiry } from '@/lib/sync';
import type { Client } from '@/lib/types';
import { recordPayment } from './actions';

interface Props {
  /** Preselected client. Omitted on the dashboard, where the operator picks one. */
  client?: Client;
  onClose: () => void;
}

const METHODS = ['Cash', 'GCash', 'Bank', 'Other'] as const;

const ALL_CLIENTS: ClientFilters = {
  search: '',
  status: 'all',
  roomId: 'all',
  expiry: 'all',
  paused: 'all',
};

/** Bottom sheet for recording a payment. Works fully offline. */
export function RecordPaymentSheet({ client, onClose }: Props) {
  const { appUser } = useAuth();
  const online = useOnline();
  const clients = useClients(ALL_CLIENTS);
  const plans = usePlans();

  const [clientId, setClientId] = useState(client?.id ?? '');
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayInputValue);
  const [method, setMethod] = useState<string>('Cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = client ?? clients?.find((c) => c.id === clientId);
  const plan = plans?.find((p) => p.id === selected?.plan_id);
  const due = plan?.price ?? selected?.monthly_fee ?? 0;

  // Choosing a customer fills in what they owe; the operator can still edit it.
  useEffect(() => {
    setAmount(due > 0 ? String(due) : '');
  }, [selected?.id, due]);

  const paidAt = fromDateInputStart(paidOn);
  const parsed = Number(amount);
  const preview =
    selected && paidAt && Number.isFinite(parsed) && parsed > 0
      ? nextExpiry({
          expiresAt: selected.expires_at,
          pausedAt: selected.paused_at,
          paidAt,
          durationDays: plan?.duration_days ?? 30,
        })
      : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!selected) {
      setError('Select a customer.');
      return;
    }
    if (!paidAt) {
      setError('Pick the date the payment was received.');
      return;
    }
    if (!Number.isFinite(parsed) || parsed === 0) {
      setError('Enter a valid amount (negative for a correction).');
      return;
    }
    setBusy(true);
    await recordPayment({
      clientId: selected.id,
      amount: parsed,
      paidAt,
      method,
      note: note.trim() || null,
      recordedBy: appUser?.id ?? null,
    });
    onClose();
  }

  const subtitle = selected
    ? plan
      ? `${selected.full_name} · ${plan.name} (${formatMoney(plan.price)} / ${plan.duration_days}d)`
      : selected.full_name
    : 'Pick the customer and the date the money came in.';

  return (
    <Sheet title="Record payment" subtitle={subtitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!client && (
          <div>
            <label htmlFor="pay-client" className={labelClass}>
              Customer
            </label>
            <select
              id="pay-client"
              required
              autoFocus
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Select customer…</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} — {c.pppoe_username}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="paid-on" className={labelClass}>
            Date paid
          </label>
          <input
            id="paid-on"
            type="date"
            required
            max={todayInputValue()}
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            className={fieldClass}
          />
          <p className="mt-1.5 text-xs text-muted">
            Defaults to today. Set it back if the payment is being recorded late — the new expiry
            counts from this date.
          </p>
        </div>

        <div>
          <label htmlFor="amount" className={labelClass}>
            Amount
          </label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            autoFocus={client !== undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${fieldClass} text-lg font-semibold`}
          />
        </div>

        {selected && (
          <div className="rounded-2xl bg-surface-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">Expires now</span>
              <span className="font-semibold text-fg">{formatDate(selected.expires_at)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">After this payment</span>
              <span className="font-semibold text-accent-text">
                {preview ? formatDate(preview) : '—'}
              </span>
            </div>
            {selected.paused_at !== null && (
              <p className="mt-2 text-xs text-warn">
                Paused — the clock stays frozen at the pause date, so the extension starts there.
              </p>
            )}
          </div>
        )}

        <div>
          <p className={labelClass}>Method</p>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={`min-h-[46px] rounded-2xl px-2 py-2 text-sm font-semibold transition-colors ${
                  method === m
                    ? 'bg-accent-gradient text-white shadow-float'
                    : 'bg-surface-2 text-muted'
                } active:opacity-70`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="pay-note" className={labelClass}>
            Note <span className="font-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="pay-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        {!online && (
          <p className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
            You're offline — the payment is queued and synced automatically later.
          </p>
        )}

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Saving…' : 'Save payment'}
        </button>
      </form>
    </Sheet>
  );
}
