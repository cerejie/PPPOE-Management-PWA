import { OfflineNotice } from '@/common/components/notices/OfflineNotice';
import * as form from '@/styles/global/Form.css';
import type { PppoeAccountForm } from '@/hooks/pppoe/usePppoeAccountForm';

/** Router status, offline explanation, rejection, and the two submit buttons. */
export function PppoeAccountFormActions({ vm }: { vm: PppoeAccountForm }) {
  return (
    <>
      {vm.routerHint && <p className={form.infoPanel}>{vm.routerHint}</p>}

      <OfflineNotice message="this account is saved on the device and reaches the router on the next sync." />

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
          Delete account
        </button>
      )}
    </>
  );
}
