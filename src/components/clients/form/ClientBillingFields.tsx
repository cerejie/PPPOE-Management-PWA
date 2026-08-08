import { SelectField } from '@/common/components/inputs/SelectField';
import * as form from '@/styles/global/Form.css';
import { ACCOUNT_STATUS_OPTIONS } from '@/constants/clients/ClientForm.constants';
import type { ClientFormViewModel } from '@/hooks/clients/useClientForm';

/** What they pay, whether the account is live, and anything else worth noting. */
export function ClientBillingFields({ vm }: { vm: ClientFormViewModel }) {
  return (
    <>
      <div>
        <label htmlFor="monthly_fee" className={form.label}>
          Monthly fee
        </label>
        <input
          id="monthly_fee"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          value={vm.values.monthly_fee}
          onChange={(e) => vm.setValue('monthly_fee', Number(e.target.value))}
          className={form.field}
        />
      </div>

      <SelectField
        id="account_status"
        label="Account status"
        value={vm.values.account_status}
        options={ACCOUNT_STATUS_OPTIONS}
        onChange={vm.selectAccountStatus}
      />

      <div>
        <label htmlFor="notes" className={form.label}>
          Notes <span className={form.optional}>(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={vm.values.notes ?? ''}
          onChange={(e) => vm.setValue('notes', e.target.value || null)}
          className={form.field}
        />
      </div>
    </>
  );
}
