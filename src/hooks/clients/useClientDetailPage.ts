import { useParams } from 'react-router-dom';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { useClient, useClientOutbox } from '@/hooks/clients/useClients';
import { useClientLedger, type Ledger } from '@/hooks/clients/useClientLedger';
import { useRouterPushStatus, type RouterPushStatus } from '@/hooks/clients/useRouterPush';
import { usePlans } from '@/hooks/plans/usePlans';
import { useRooms } from '@/hooks/rooms/useRooms';
import { toggleConnection } from '@/services/payments/Payments.service';
import { editClientPath } from '@/constants/clients/ClientRoutes.constants';
import { formatMoney } from '@/common/utils/Format.utils';
import type { Client } from '@/types/clients/Clients.types';
import type { Plan } from '@/types/plans/Plans.types';
import type { Room } from '@/types/rooms/Rooms.types';

/** The one sheet this screen can have open. */
export type ClientDetailSheet = 'payment' | 'ledger' | 'pause' | null;

interface ClientDetailPageState {
  sheet: ClientDetailSheet;
  isToggling: boolean;
}

export interface ClientDetailPageViewModel {
  /** Undefined until Dexie answers. */
  readonly client: Client | undefined;
  readonly room: Room | undefined;
  readonly plan: Plan | undefined;
  readonly ledger: Ledger | undefined;
  readonly routerPush: RouterPushStatus | undefined;
  readonly isConnected: boolean;
  readonly isPaused: boolean;
  /** How long the subscription has been frozen, in seconds; 0 while running. */
  readonly pausedSeconds: number;
  /** Connection changes still queued — payments surface inside the ledger instead. */
  readonly pendingEventCount: number;
  readonly planLabel: string;
  readonly roomLabel: string;
  readonly canEdit: boolean;
  readonly editPath: string;
  readonly isToggling: boolean;
  readonly sheet: ClientDetailSheet;
  toggleConnection: () => void;
  openSheet: (sheet: Exclude<ClientDetailSheet, null>) => void;
  closeSheet: () => void;
}

const EMPTY_VALUE = '—';

function describePlan(plan: Plan | undefined): string {
  if (!plan) return EMPTY_VALUE;
  const speed = plan.mbps > 0 ? ` · ${plan.mbps} Mbps` : '';
  return `${plan.name}${speed} · ${formatMoney(plan.price)}`;
}

function secondsSince(isoTimestamp: string | null): number {
  if (isoTimestamp === null) return 0;
  return Math.max(0, (Date.now() - new Date(isoTimestamp).getTime()) / 1000);
}

export function useClientDetailPage(): ClientDetailPageViewModel {
  const { id } = useParams<{ id: string }>();
  const { appUser, isSuperAdmin } = useAuth();

  const client = useClient(id);
  const rooms = useRooms();
  const plans = usePlans();
  const outbox = useClientOutbox(id);
  const ledger = useClientLedger(id);
  const routerPush = useRouterPushStatus(id);

  const store = useInstanceStore<ClientDetailPageState>(() => ({
    sheet: null,
    isToggling: false,
  }));

  const { sheet, isToggling } = useStore(
    store,
    useShallow((s) => s),
  );

  const room = rooms?.find((r) => r.id === client?.room_id);
  const plan = plans?.find((p) => p.id === client?.plan_id);
  const isConnected = client?.connection_status === 'connected';
  const isPaused = client?.paused_at != null;

  async function runToggle(): Promise<void> {
    if (!client || store.getState().isToggling) return;
    store.setState({ isToggling: true });
    try {
      await toggleConnection({
        clientId: client.id,
        action: isConnected ? 'disconnect' : 'connect',
        performedBy: appUser?.id ?? null,
      });
    } finally {
      store.setState({ isToggling: false });
    }
  }

  return {
    client,
    room,
    plan,
    ledger,
    routerPush,
    isConnected,
    isPaused,
    pausedSeconds: secondsSince(client?.paused_at ?? null),
    pendingEventCount: (outbox ?? []).filter((item) => item.kind === 'connection_event').length,
    planLabel: describePlan(plan),
    roomLabel: room?.name ?? EMPTY_VALUE,
    canEdit: isSuperAdmin,
    editPath: editClientPath(id ?? ''),
    isToggling,
    sheet,
    toggleConnection: () => void runToggle(),
    openSheet: (next) => store.setState({ sheet: next }),
    closeSheet: () => store.setState({ sheet: null }),
  };
}
