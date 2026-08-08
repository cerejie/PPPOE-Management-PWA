import { Sheet } from '@/common/components/overlays/Sheet';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { OfflineNotice } from '@/common/components/notices/OfflineNotice';
import * as form from '@/styles/global/Form.css';
import * as styles from '@/styles/pages/plans/sheet/PlanFormSheet.css';
import { usePlanForm } from '@/hooks/plans/usePlanForm';
import type { Plan } from '@/types/plans/Plans.types';

interface Props {
  /** Undefined = create mode. */
  plan?: Plan;
  onClose: () => void;
}

export function PlanFormSheet({ plan, onClose }: Props) {
  const vm = usePlanForm(plan, onClose);

  return (
    <>
      <Sheet title={vm.title} subtitle={vm.subtitle} onClose={onClose}>
        <form onSubmit={vm.submit} className={form.stack}>
          <div>
            <label htmlFor="plan-name" className={form.label}>
              Plan name
            </label>
            <input
              id="plan-name"
              type="text"
              required
              autoFocus={!vm.isEdit}
              value={vm.name}
              onChange={(e) => vm.setName(e.target.value)}
              placeholder="e.g. Fiber Basic"
              className={form.field}
            />
          </div>

          <div className={styles.pairGrid}>
            <div>
              <label htmlFor="plan-price" className={form.label}>
                Price (₱)
              </label>
              <input
                id="plan-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                required
                value={vm.price}
                onChange={(e) => vm.setPrice(e.target.value)}
                placeholder="0.00"
                className={form.field}
              />
            </div>

            <div>
              <label htmlFor="plan-mbps" className={form.label}>
                Speed (Mbps)
              </label>
              <input
                id="plan-mbps"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                required
                value={vm.mbps}
                onChange={(e) => vm.setMbps(e.target.value)}
                placeholder="50"
                className={form.field}
              />
            </div>
          </div>

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
            <p className={form.hint}>
              How far each payment pushes the client&apos;s expiry date.
            </p>
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
              After this date the plan stops appearing for new clients. Clients already on it
              keep it.
            </p>
          </div>

          <OfflineNotice message="this plan is saved on the device and synced automatically later." />

          {vm.error && (
            <p role="alert" className={form.errorAlert}>
              {vm.error}
            </p>
          )}

          <button type="submit" disabled={vm.busy} className={form.button.primary}>
            {vm.submitLabel}
          </button>

          {vm.isEdit && (
            <button
              type="button"
              disabled={vm.busy}
              onClick={vm.requestDelete}
              className={form.button.danger}
            >
              Delete plan
            </button>
          )}
        </form>
      </Sheet>

      {vm.confirmingDelete && (
        <ConfirmDialog
          title="Delete plan?"
          message={vm.deleteMessage}
          confirmLabel="Delete"
          busy={vm.busy}
          onConfirm={vm.confirmDelete}
          onCancel={vm.cancelDelete}
        />
      )}
    </>
  );
}
