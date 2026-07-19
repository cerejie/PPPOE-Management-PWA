import { useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { formatMoney } from '@/lib/format';
import type { Client, Plan } from '@/lib/types';
import { recordPayment } from './actions';

interface Props {
  client: Client;
  plan: Plan | undefined;
  onClose: () => void;
}

const METHODS = ['Cash', 'GCash', 'Bank', 'Other'] as const;

/** Bottom sheet for recording a payment. Works fully offline. */
export function RecordPaymentSheet({ client, plan, onClose }: Props) {
  const { appUser } = useAuth();
  const defaultAmount = plan?.price ?? client.monthly_fee;
  const [amount, setAmount] = useState(defaultAmount > 0 ? String(defaultAmount) : '');
  const [method, setMethod] = useState<string>('Cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed === 0) {
      setError('Enter a valid amount (negative for a correction).');
      return;
    }
    setBusy(true);
    await recordPayment({
      clientId: client.id,
      amount: parsed,
      method,
      note: note.trim() || null,
      recordedBy: appUser?.id ?? null,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Record payment">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-app rounded-t-3xl bg-white p-5 pb-8"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" aria-hidden />
        <h2 className="text-lg font-semibold text-slate-900">Record payment</h2>
        <p className="mt-0.5 text-sm text-muted">
          {client.full_name}
          {plan ? ` · ${plan.name} (${formatMoney(plan.price)} / ${plan.duration_days}d)` : ''}
        </p>

        <label htmlFor="amount" className="mt-4 block text-sm font-medium text-slate-700">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 text-lg font-semibold outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />

        <p className="mt-4 text-sm font-medium text-slate-700">Method</p>
        <div className="mt-1 grid grid-cols-4 gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`min-h-[44px] rounded-xl px-2 py-2 text-sm font-medium ${
                method === m ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600'
              } active:opacity-70`}
            >
              {m}
            </button>
          ))}
        </div>

        <label htmlFor="pay-note" className="mt-4 block text-sm font-medium text-slate-700">
          Note (optional)
        </label>
        <input
          id="pay-note"
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        />

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        {!navigator.onLine && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-warn">
            You're offline — the payment will be queued and synced later.
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 min-h-[48px] w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white active:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save payment'}
        </button>
      </form>
    </div>
  );
}
