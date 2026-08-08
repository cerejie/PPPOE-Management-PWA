import { Screen } from '@/common/components/layout/Screen';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { OfflineNotice } from '@/common/components/notices/OfflineNotice';
import { SelectField } from '@/common/components/inputs/SelectField';
import * as form from '@/styles/global/Form.css';
import * as styles from '@/styles/pages/clients/form/ClientFormPage.css';
import { ACCOUNT_STATUS_OPTIONS } from '@/constants/clients/ClientForm.constants';
import { toDateInputValue } from '@/common/utils/Format.utils';
import { useClientForm } from '@/hooks/clients/useClientForm';

export function ClientFormPage() {
  const vm = useClientForm();
  const { values } = vm;

  return (
    <>
      <Screen title={vm.title} back>
        <OfflineNotice
          className={styles.offlineNotice}
          message="this client is saved on the device and synced automatically later."
        />

        <form onSubmit={vm.submit} className={form.stack}>
          <div>
            <label htmlFor="full_name" className={form.label}>
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              required
              value={values.full_name}
              onChange={(e) => vm.setValue('full_name', e.target.value)}
              className={form.field}
            />
          </div>

          <div>
            <label htmlFor="pppoe_username" className={form.label}>
              PPPoE username
            </label>
            <input
              id="pppoe_username"
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={values.pppoe_username}
              onChange={(e) => vm.setValue('pppoe_username', e.target.value.trim())}
              className={form.field}
            />
          </div>

          <SelectField
            id="room"
            label="Room"
            value={values.room_id ?? ''}
            options={vm.roomOptions}
            onChange={vm.selectRoom}
          />

          <SelectField
            id="plan"
            label="Plan"
            value={values.plan_id ?? ''}
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
              value={toDateInputValue(values.installed_at)}
              onChange={(e) => vm.setInstalledOn(e.target.value)}
              className={form.field}
            />
            {!vm.isEdit && <p className={form.hint}>{vm.seededExpiryLabel}</p>}
          </div>

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
              value={values.monthly_fee}
              onChange={(e) => vm.setValue('monthly_fee', Number(e.target.value))}
              className={form.field}
            />
          </div>

          <SelectField
            id="account_status"
            label="Account status"
            value={values.account_status}
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
              value={values.notes ?? ''}
              onChange={(e) => vm.setValue('notes', e.target.value || null)}
              className={form.field}
            />
          </div>

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
              Delete client
            </button>
          )}
        </form>
      </Screen>

      {vm.confirmingDelete && (
        <ConfirmDialog
          title="Delete client?"
          message="The client is deleted along with their payments, connection events and pauses. This frees their PPPoE username so it can be used again. It cannot be undone."
          confirmLabel="Delete"
          busy={vm.busy}
          onConfirm={vm.confirmDelete}
          onCancel={vm.cancelDelete}
        />
      )}
    </>
  );
}
