import { SearchSelect } from '@/common/components/inputs/SearchSelect';
import * as form from '@/styles/global/Form.css';
import type { ClientFormViewModel } from '@/hooks/clients/useClientForm';

/** Who they are and which line they are on. */
export function ClientIdentityFields({ vm }: { vm: ClientFormViewModel }) {
  return (
    <>
      <div>
        <label htmlFor="full_name" className={form.label}>
          Full name
        </label>
        <input
          id="full_name"
          type="text"
          required
          value={vm.values.full_name}
          onChange={(e) => vm.setValue('full_name', e.target.value)}
          className={form.field}
        />
      </div>

      <div>
        <label htmlFor="pppoe_account" className={form.label}>
          PPPoE account
        </label>
        <SearchSelect
          id="pppoe_account"
          value={vm.values.pppoe_account_id ?? ''}
          onChange={(value) => vm.setValue('pppoe_account_id', value || null)}
          options={vm.accountOptions}
          placeholder="Search PPPoE accounts"
          emptyMessage="No accounts match."
        />
        {vm.accountHint && <p className={form.hint}>{vm.accountHint}</p>}
      </div>
    </>
  );
}
