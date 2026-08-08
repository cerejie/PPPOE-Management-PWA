import { OfflineNotice } from '@/common/components/notices/OfflineNotice';
import * as form from '@/styles/global/Form.css';
import type { PlanForm } from '@/hooks/plans/usePlanForm';

/** Offline explanation, rejection, and the two submit buttons. */
export function PlanFormActions({ vm }: { vm: PlanForm }) {
  return (
    <>
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
    </>
  );
}
