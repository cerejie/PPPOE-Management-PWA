import { ConnectionCard } from '@/components/clients/cards/ConnectionCard';
import { PauseCard } from '@/components/clients/cards/PauseCard';
import { ClientProfileCard } from '@/components/clients/cards/ClientProfileCard';
import type { ClientDetailPageViewModel } from '@/hooks/clients/useClientDetailPage';
import type { Client } from '@/types/clients/Clients.types';

interface Props {
  client: Client;
  vm: ClientDetailPageViewModel;
}

/** Line state, vacation pause and profile — the read-only half of the screen. */
export function ClientDetailCards({ client, vm }: Props) {
  return (
    <>
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
    </>
  );
}
