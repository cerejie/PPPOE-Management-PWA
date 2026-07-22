import { useState, type FormEvent } from 'react';
import { Sheet } from '@/components/common/overlays/Sheet';
import { ConfirmDialog } from '@/components/common/overlays/ConfirmDialog';
import {
  dangerButtonClass,
  fieldClass,
  labelClass,
  primaryButtonClass,
} from '@/styles/common/formStyles';
import { useOnline } from '@/hooks/sync/useSyncStatus';
import { fromDateInputValue, toDateInputValue } from '@/utils/common/format';
import type { Plan } from '@/types/plans/plans.types';
import { createPlan, softDeletePlan, updatePlan, type PlanInput } from '@/services/plans/plans.actions';

interface Props {
  /** Undefined = create mode. */
  plan?: Plan;
  onClose: () => void;
}

export function PlanFormSheet({ plan, onClose }: Props) {
  const isEdit = plan !== undefined;
  const online = useOnline();

  // Kept as strings so the number inputs can be cleared while typing.
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState(plan ? String(plan.price) : '');
  const [durationDays, setDurationDays] = useState(plan ? String(plan.duration_days) : '30');
  const [mbps, setMbps] = useState(plan ? String(plan.mbps) : '');
  const [validUntil, setValidUntil] = useState(toDateInputValue(plan?.valid_until ?? null));

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;

    const parsedPrice = Number(price);
    const parsedDays = Number(durationDays);
    const parsedMbps = Number(mbps);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('Enter a price of 0 or more.');
      return;
    }
    if (!Number.isInteger(parsedDays) || parsedDays < 1) {
      setError('Validity must be at least 1 day.');
      return;
    }
    if (!Number.isInteger(parsedMbps) || parsedMbps < 0) {
      setError('Speed must be a whole number of Mbps.');
      return;
    }

    const input: PlanInput = {
      name,
      price: parsedPrice,
      duration_days: parsedDays,
      mbps: parsedMbps,
      valid_until: fromDateInputValue(validUntil),
    };

    setError(null);
    setBusy(true);
    const err = isEdit && plan ? await updatePlan(plan.id, input) : await createPlan(input);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  async function handleDelete() {
    if (!plan) return;
    setError(null);
    setBusy(true);
    const err = await softDeletePlan(plan.id);
    setBusy(false);
    setConfirmingDelete(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <>
      <Sheet
        title={isEdit ? 'Edit plan' : 'New plan'}
        subtitle={isEdit ? plan?.name : 'Plans set the price, speed and billing period.'}
        onClose={onClose}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="plan-name" className={labelClass}>
              Plan name
            </label>
            <input
              id="plan-name"
              type="text"
              required
              autoFocus={!isEdit}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fiber Basic"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="plan-price" className={labelClass}>
                Price (₱)
              </label>
              <input
                id="plan-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="plan-mbps" className={labelClass}>
                Speed (Mbps)
              </label>
              <input
                id="plan-mbps"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                required
                value={mbps}
                onChange={(e) => setMbps(e.target.value)}
                placeholder="50"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="plan-days" className={labelClass}>
              Validity (days)
            </label>
            <input
              id="plan-days"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              required
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-muted">
              How far each payment pushes the client's expiry date.
            </p>
          </div>

          <div>
            <label htmlFor="plan-valid-until" className={labelClass}>
              Offered until <span className="font-normal text-muted/70">(optional)</span>
            </label>
            <input
              id="plan-valid-until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-muted">
              After this date the plan stops appearing for new clients. Clients already on it
              keep it.
            </p>
          </div>

          {!online && (
            <p className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
              Plan changes need a connection. Go online and try again.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || !online} className={primaryButtonClass}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add plan'}
          </button>

          {isEdit && (
            <button
              type="button"
              disabled={busy || !online}
              onClick={() => setConfirmingDelete(true)}
              className={dangerButtonClass}
            >
              Delete plan
            </button>
          )}
        </form>
      </Sheet>

      {confirmingDelete && plan && (
        <ConfirmDialog
          title="Delete plan?"
          message={`"${plan.name}" will be removed from the app. Past payments keep their history. This is refused if clients are still on the plan.`}
          confirmLabel="Delete"
          busy={busy}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
