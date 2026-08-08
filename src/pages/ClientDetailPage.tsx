import { useNavigate } from 'react-router-dom';
import { Screen } from '@/common/components/layout/Screen';
import { LoadingNotice } from '@/common/components/notices/LoadingNotice';
import { ConnectionCard } from '@/components/clients/cards/ConnectionCard';
import { PauseCard } from '@/components/clients/cards/PauseCard';
import { ClientProfileCard } from '@/components/clients/cards/ClientProfileCard';
import { LedgerSummaryCard } from '@/components/clients/cards/LedgerSummaryCard';
import { LedgerSheet } from '@/components/clients/sheet/LedgerSheet';
import { PauseSheet } from '@/components/clients/sheet/PauseSheet';
import { RecordPaymentSheet } from '@/components/payments/sheet/RecordPaymentSheet';
import * as styles from '@/pages/ClientDetailPage.css';
import { useClientDetailPage } from '@/hooks/clients/useClientDetailPage';

export function ClientDetailPage() {
  const vm = useClientDetailPage();
  const navigate = useNavigate();
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
        eyebrow={client.pppoe_username}
        back
        action={
          vm.canEdit ? (
            <button
              type="button"
              onClick={() => navigate(vm.editPath)}
              aria-label="Edit client"
              className={styles.editButton}
            >
              Edit
            </button>
          ) : undefined
        }
      >
        <ConnectionCard
          isConnected={vm.isConnected}
          isPaused={vm.isPaused}
          statusSince={client.connection_status_updated_at}
          pendingEventCount={vm.pendingEventCount}
          routerPush={vm.routerPush}
          isToggling={vm.isToggling}
          onToggle={vm.toggleConnection}
        />

        <PauseCard
          isPaused={vm.isPaused}
          pausedSeconds={vm.pausedSeconds}
          onOpenPauseSheet={() => vm.openSheet('pause')}
        />

        <ClientProfileCard
          client={client}
          roomLabel={vm.roomLabel}
          planLabel={vm.planLabel}
          isPaused={vm.isPaused}
        />

        <button
          type="button"
          onClick={() => vm.openSheet('payment')}
          className={styles.recordPaymentButton}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          Record payment
        </button>

        <h2 className={styles.sectionTitle}>Ledger</h2>
        <LedgerSummaryCard ledger={vm.ledger} onOpen={() => vm.openSheet('ledger')} />
      </Screen>

      {vm.sheet === 'payment' && <RecordPaymentSheet client={client} onClose={vm.closeSheet} />}

      {vm.sheet === 'pause' && <PauseSheet client={client} onClose={vm.closeSheet} />}

      {vm.sheet === 'ledger' && (
        <LedgerSheet client={client} room={vm.room} plan={vm.plan} onClose={vm.closeSheet} />
      )}
    </>
  );
}
