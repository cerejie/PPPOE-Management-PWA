import { clientsFilteredPath } from '@/constants/clients/ClientRoutes.constants';
import type { StatTone } from '@/components/dashboard/cards/StatCard';
import type { DashboardStats } from '@/hooks/dashboard/useDashboardStats';

export interface StatCardConfig {
  readonly label: string;
  readonly tone: StatTone;
  /** Clients screen filtered to exactly the set `countOf` counts. */
  readonly to: string;
  readonly countOf: (stats: DashboardStats) => number;
}

/** The dashboard grid, in reading order. */
export const DASHBOARD_STAT_CARDS: readonly StatCardConfig[] = [
  {
    label: 'Connected',
    tone: 'ok',
    to: clientsFilteredPath({ status: 'connected' }),
    countOf: (stats) => stats.connected,
  },
  {
    label: 'Disconnected',
    tone: 'muted',
    to: clientsFilteredPath({ status: 'disconnected' }),
    countOf: (stats) => stats.disconnected,
  },
  {
    label: 'Expiring in 7 days',
    tone: 'warn',
    to: clientsFilteredPath({ expiry: 'expiring' }),
    countOf: (stats) => stats.expiring7d,
  },
  {
    label: 'Expired',
    tone: 'danger',
    to: clientsFilteredPath({ expiry: 'expired' }),
    countOf: (stats) => stats.expired,
  },
];

export const PAUSED_CLIENTS_PATH = clientsFilteredPath({ paused: '1' });
