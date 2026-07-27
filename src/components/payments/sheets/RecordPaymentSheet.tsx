import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Sheet } from '@/components/common/overlays/Sheet';
import { DateField } from '@/components/common/inputs/DateField';
import { SearchSelect } from '@/components/common/inputs/SearchSelect';
import { fieldClass, labelClass, primaryButtonClass } from '@/styles/common/formStyles';
import { useAuth } from '@/store/auth/AuthContext';
import { useClients, type ClientFilters } from '@/hooks/clients/useClients';
import { usePlans } from '@/hooks/plans/usePlans';
import { OfflineNotice } from '@/components/common/notices/OfflineNotice';
import {
  formatDate,
  formatMoney,
  fromDateInputStart,
  todayInputValue,
} from '@/utils/common/format';
import { nextExpiry } from '@/api/sync/syncEngine';
import type { Client } from '@/types/clients/clients.types';
import { recordPayment } from '@/services/payments/payments.actions';

interface Props {
  /** Preselected client. Omitted on the dashboard, where the operator picks one. */
  client?: Client;
  onClose: () => void;
}

const METHODS = ['Cash', 'GCash', 'Bank', 'Other'] as const;

/**
 * Keeps the field usable mid-typing: digits, one leading minus (a correction is
 * a negative row) and at most one decimal point with two places. Nothing is
 * padded here — the cents only appear on blur.
 */
function sanitiseAmountInput(raw: string): string {
  const negative = raw.trimStart().startsWith('-');
  const [whole = '', ...rest] = raw.replace(/[^\d.]/g, '').split('.');
  const decimals = rest.join('').slice(0, 2);
  const body = rest.length > 0 ? `${whole}.${decimals}` : whole;
  return negative ? `-${body}` : body;
}

/** "1500" -> "1500.00" once the operator leaves the field. */
function formatAmountOnBlur(raw: string): string {
  const value = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(value)) return raw;
  return value.toFixed(2);
}

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
  const clients = useClients(ALL_CLIENTS);
  const plans = usePlans();

  const [clientId, setClientId] = useState(client?.id ?? '');
  const [amount, setAmount] = useState('');
  const [paidOn, setPaidOn] = useState(todayInputValue);
  const [method, setMethod] = useState<string>('Cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clientOptions = useMemo(
    () =>
      (clients ?? []).map((c) => ({
        value: c.id,
        label: c.full_name,
        hint: c.pppoe_username,
      })),
    [clients],
  );

  const selected = client ?? clients?.find((c) => c.id === clientId);
  const plan = plans?.find((p) => p.id === selected?.plan_id);

  // The plan price is the subscription amount; monthly_fee covers clients on no
  // plan (or on one since archived). `??` would not fall through on a 0 price,
  // which is why this tests the value rather than nullishness.
  const due = plan && plan.price > 0 ? plan.price : (selected?.monthly_fee ?? 0);

  // Plans arrive from Dexie a tick after clients do. Prefilling from
  // monthly_fee in that gap would flash the wrong number and could overwrite
  // an amount the operator had already started typing.
  const awaitingPlan = plans === undefined && selected?.plan_id != null;

  // Choosing a customer fills in what they owe; the operator can still edit it.
  useEffect(() => {
    if (awaitingPlan) return;
    setAmount(due > 0 ? due.toFixed(2) : '');
  }, [selected?.id, due, awaitingPlan]);

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
            {/* Deliberately not autofocused: opening the sheet should show the
                whole form, not a dropdown over it with the keyboard up. */}
            <SearchSelect
              id="pay-client"
              value={clientId}
              onChange={setClientId}
              options={clientOptions}
              placeholder="Search name or PPPoE username…"
              emptyMessage="No customer matches that search."
            />
          </div>
        )}

        <div>
          <label htmlFor="paid-on" className={labelClass}>
            Date paid
          </label>
          <DateField
            id="paid-on"
            max={todayInputValue()}
            value={paidOn}
            onChange={setPaidOn}
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
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            autoFocus={client !== undefined}
            value={amount}
            onChange={(e) => setAmount(sanitiseAmountInput(e.target.value))}
            onBlur={(e) => setAmount(formatAmountOnBlur(e.target.value))}
            className={`${fieldClass} text-lg font-semibold`}
          />
          {selected && (
            <p className="mt-1.5 text-xs text-muted">
              {due > 0
                ? `Prefilled from ${plan ? plan.name : 'their monthly fee'} (${formatMoney(due)}). Edit it if they paid a different amount.`
                : 'This customer has no plan price or monthly fee set — enter the amount manually.'}
            </p>
          )}
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

        <OfflineNotice message="the payment is queued and synced automatically later." />

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Saving…' : 'Save payment'}
        </button>
      </form>
    </Sheet>
  );
}
