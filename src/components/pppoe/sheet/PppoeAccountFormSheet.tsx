import { Sheet } from '@/common/components/overlays/Sheet';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { PppoeSecretFields } from '@/components/pppoe/sheet/PppoeSecretFields';
import { PppoeAssignmentFields } from '@/components/pppoe/sheet/PppoeAssignmentFields';
import { PppoeAccountFormActions } from '@/components/pppoe/sheet/PppoeAccountFormActions';
import * as form from '@/styles/global/Form.css';
import { usePppoeAccountForm } from '@/hooks/pppoe/usePppoeAccountForm';
import type { PppoeAccount } from '@/types/pppoe/Pppoe.types';

interface Props {
  /** Undefined = create mode. */
  account?: PppoeAccount;
  onClose: () => void;
}

export function PppoeAccountFormSheet({ account, onClose }: Props) {
  const vm = usePppoeAccountForm(account, onClose);

  return (
    <>
      <Sheet title={vm.title} subtitle={vm.subtitle} onClose={onClose}>
        <form onSubmit={vm.submit} className={form.stack}>
          <PppoeSecretFields vm={vm} />
          <PppoeAssignmentFields vm={vm} />
          <PppoeAccountFormActions vm={vm} />
        </form>
      </Sheet>

      {vm.confirmingDelete && (
        <ConfirmDialog
          title="Delete PPPoE account?"
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
