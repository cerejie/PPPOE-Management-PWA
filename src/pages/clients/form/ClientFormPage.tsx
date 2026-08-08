import { Screen } from '@/common/components/layout/Screen';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { OfflineNotice } from '@/common/components/notices/OfflineNotice';
import { ClientIdentityFields } from '@/components/clients/form/ClientIdentityFields';
import { ClientPlacementFields } from '@/components/clients/form/ClientPlacementFields';
import { ClientBillingFields } from '@/components/clients/form/ClientBillingFields';
import { ClientFormActions } from '@/components/clients/form/ClientFormActions';
import * as form from '@/styles/global/Form.css';
import * as styles from '@/styles/pages/clients/form/ClientFormPage.css';
import { useClientForm } from '@/hooks/clients/useClientForm';

export function ClientFormPage() {
  const vm = useClientForm();

  return (
    <>
      <Screen title={vm.title} back>
        <OfflineNotice
          className={styles.offlineNotice}
          message="this client is saved on the device and synced automatically later."
        />

        <form onSubmit={vm.submit} className={form.stack}>
          <ClientIdentityFields vm={vm} />
          <ClientPlacementFields vm={vm} />
          <ClientBillingFields vm={vm} />
          <ClientFormActions vm={vm} />
        </form>
      </Screen>

      {vm.confirmingDelete && (
        <ConfirmDialog
          title="Delete client?"
          message="The client is deleted along with their payments, connection events and pauses. Their PPPoE account is freed for someone else — the line itself stays on the router. This cannot be undone."
          confirmLabel="Delete"
          busy={vm.busy}
          onConfirm={vm.confirmDelete}
          onCancel={vm.cancelDelete}
        />
      )}
    </>
  );
}
