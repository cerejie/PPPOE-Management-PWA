import { Sheet } from '@/common/components/overlays/Sheet';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { PlanRateFields } from '@/components/plans/sheet/PlanRateFields';
import { PlanProfileField } from '@/components/plans/sheet/PlanProfileField';
import { PlanTermFields } from '@/components/plans/sheet/PlanTermFields';
import { PlanFormActions } from '@/components/plans/sheet/PlanFormActions';
import * as form from '@/styles/global/Form.css';
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

          <PlanRateFields vm={vm} />
          <PlanProfileField vm={vm} />
          <PlanTermFields vm={vm} />
          <PlanFormActions vm={vm} />
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
