import { useState, type FormEvent } from 'react';
import { Sheet } from '@/components/Sheet';
import { fieldClass, labelClass, primaryButtonClass } from '@/components/formStyles';
import { useAuth } from '@/features/auth/AuthContext';
import { useOnline } from '@/features/sync/useSyncStatus';
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
  const online = useOnline();

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

  const subtitle = plan
    ? `${client.full_name} · ${plan.name} (${formatMoney(plan.price)} / ${plan.duration_days}d)`
    : client.full_name;

  return (
    <Sheet title="Record payment" subtitle={subtitle} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${fieldClass} text-lg font-semibold`}
          />
        </div>

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
