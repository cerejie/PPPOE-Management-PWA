import * as form from '@/styles/global/Form.css';
import type { ClientFormViewModel } from '@/hooks/clients/useClientForm';

/** Rejection message and the two submit buttons. */
export function ClientFormActions({ vm }: { vm: ClientFormViewModel }) {
  return (
    <>
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
    </>
  );
}
