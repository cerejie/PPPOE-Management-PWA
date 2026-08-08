import { SelectField } from '@/common/components/inputs/SelectField';
import * as form from '@/styles/global/Form.css';
import { toDateInputValue } from '@/common/utils/Format.utils';
import type { ClientFormViewModel } from '@/hooks/clients/useClientForm';

/** Where they are, what they bought, and when the subscription starts. */
export function ClientPlacementFields({ vm }: { vm: ClientFormViewModel }) {
  return (
    <>
      <SelectField
        id="room"
        label="Room"
        value={vm.values.room_id ?? ''}
        options={vm.roomOptions}
        onChange={vm.selectRoom}
      />

      <SelectField
        id="plan"
        label="Plan"
        value={vm.values.plan_id ?? ''}
        options={vm.planOptions}
        onChange={vm.selectPlan}
      />

      <div>
        <label htmlFor="installed_at" className={form.label}>
          Date installed
        </label>
        <input
          id="installed_at"
          type="date"
          value={toDateInputValue(vm.values.installed_at)}
          onChange={(e) => vm.setInstalledOn(e.target.value)}
          className={form.field}
        />
        {!vm.isEdit && <p className={form.hint}>{vm.seededExpiryLabel}</p>}
      </div>
    </>
  );
}
