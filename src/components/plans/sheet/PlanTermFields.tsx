import * as form from '@/styles/global/Form.css';
import type { PlanForm } from '@/hooks/plans/usePlanForm';

/** How long a payment lasts, and how long the plan itself is offered. */
export function PlanTermFields({ vm }: { vm: PlanForm }) {
  return (
    <>
      <div>
        <label htmlFor="plan-days" className={form.label}>
          Validity (days)
        </label>
        <input
          id="plan-days"
          type="number"
          inputMode="numeric"
          step="1"
          min="1"
          required
          value={vm.durationDays}
          onChange={(e) => vm.setDurationDays(e.target.value)}
          className={form.field}
        />
        <p className={form.hint}>How far each payment pushes the client&apos;s expiry date.</p>
      </div>

      <div>
        <label htmlFor="plan-valid-until" className={form.label}>
          Offered until <span className={form.optional}>(optional)</span>
        </label>
        <input
          id="plan-valid-until"
          type="date"
          value={vm.validUntil}
          onChange={(e) => vm.setValidUntil(e.target.value)}
          className={form.field}
        />
        <p className={form.hint}>
          After this date the plan stops appearing for new clients. Clients already on it keep it.
        </p>
      </div>
    </>
  );
}
