import { useStore } from 'zustand';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { useDashboardStats, type DashboardStats } from '@/hooks/dashboard/useDashboardStats';

interface DashboardPageState {
  isPaymentSheetOpen: boolean;
}

export interface DashboardPageViewModel {
  /** Undefined until Dexie answers. */
  readonly stats: DashboardStats | undefined;
  readonly greeting: string;
  readonly canAddClient: boolean;
  readonly isPaymentSheetOpen: boolean;
  openPaymentSheet: () => void;
  closePaymentSheet: () => void;
}

const FALLBACK_NAME = 'there';

function firstNameOf(displayName: string | null | undefined): string {
  return displayName?.trim().split(' ')[0] || FALLBACK_NAME;
}

export function useDashboardPage(): DashboardPageViewModel {
  const stats = useDashboardStats();
  const { appUser, isSuperAdmin } = useAuth();

  const store = useInstanceStore<DashboardPageState>(() => ({ isPaymentSheetOpen: false }));
  const isPaymentSheetOpen = useStore(store, (s) => s.isPaymentSheetOpen);

  return {
    stats,
    greeting: `Hi, ${firstNameOf(appUser?.display_name)}`,
    canAddClient: isSuperAdmin,
    isPaymentSheetOpen,
    openPaymentSheet: () => store.setState({ isPaymentSheetOpen: true }),
    closePaymentSheet: () => store.setState({ isPaymentSheetOpen: false }),
  };
}
