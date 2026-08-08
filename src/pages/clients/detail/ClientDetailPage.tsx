import { Screen } from '@/common/components/layout/Screen';
import { LoadingNotice } from '@/common/components/notices/LoadingNotice';
import { ClientDetailCards } from '@/components/clients/cards/ClientDetailCards';
import { LedgerSummaryCard } from '@/components/clients/cards/LedgerSummaryCard';
import { ClientEditButton } from '@/components/clients/buttons/ClientEditButton';
import { RecordPaymentButton } from '@/components/clients/buttons/RecordPaymentButton';
import { ClientDetailSheets } from '@/components/clients/sheet/ClientDetailSheets';
import * as styles from '@/styles/pages/clients/detail/ClientDetailPage.css';
import { NO_ACCOUNT_LABEL } from '@/constants/clients/ClientForm.constants';
import { useClientDetailPage } from '@/hooks/clients/useClientDetailPage';

export function ClientDetailPage() {
  const vm = useClientDetailPage();
  const { client } = vm;

  if (client === undefined) {
    return (
      <Screen title="Client" back>
        <LoadingNotice />
      </Screen>
    );
  }

  return (
    <>
      <Screen
        title={client.full_name}
        eyebrow={client.pppoe_username ?? NO_ACCOUNT_LABEL}
        back
        action={vm.canEdit ? <ClientEditButton to={vm.editPath} /> : undefined}
      >
        <ClientDetailCards client={client} vm={vm} />

        <RecordPaymentButton onClick={() => vm.openSheet('payment')} />

        <h2 className={styles.sectionTitle}>Ledger</h2>
        <LedgerSummaryCard ledger={vm.ledger} onOpen={() => vm.openSheet('ledger')} />
      </Screen>

      <ClientDetailSheets client={client} vm={vm} />
    </>
  );
}
