import { LedgerSheet } from '@/components/clients/sheet/LedgerSheet';
import { PauseSheet } from '@/components/clients/sheet/PauseSheet';
import { RecordPaymentSheet } from '@/components/payments/sheet/RecordPaymentSheet';
import type { ClientDetailPageViewModel } from '@/hooks/clients/useClientDetailPage';
import type { Client } from '@/types/clients/Clients.types';

interface Props {
  client: Client;
  vm: ClientDetailPageViewModel;
}

/** The three sheets the detail screen can open; at most one is ever mounted. */
export function ClientDetailSheets({ client, vm }: Props) {
  return (
    <>
      {vm.sheet === 'payment' && <RecordPaymentSheet client={client} onClose={vm.closeSheet} />}

      {vm.sheet === 'pause' && <PauseSheet client={client} onClose={vm.closeSheet} />}

      {vm.sheet === 'ledger' && (
        <LedgerSheet client={client} room={vm.room} plan={vm.plan} onClose={vm.closeSheet} />
      )}
    </>
  );
}
