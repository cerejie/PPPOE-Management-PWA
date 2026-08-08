import { CLIENTS_PATH } from '@/constants/clients/ClientRoutes.constants';
import { PPPOE_PATH } from '@/constants/pppoe/PppoeAccounts.constants';

export interface ManageLinkConfig {
  readonly to: string;
  readonly label: string;
  readonly hint: string;
}

/**
 * SuperAdmin shortcuts into the management screens, in reading order.
 *
 * Plans live here rather than in the tab bar: they are set up once and rarely
 * revisited, so the tab went to PPPoE accounts, which are worked with daily.
 */
export const MANAGE_LINKS: readonly ManageLinkConfig[] = [
  { to: '/rooms', label: 'Rooms', hint: 'Add, rename or remove rooms & routers' },
  { to: '/plans', label: 'Plans', hint: 'Price, bandwidth profile and validity' },
  { to: PPPOE_PATH, label: 'PPPoE accounts', hint: 'Router secrets and who is on them' },
  { to: CLIENTS_PATH, label: 'Clients', hint: 'Add or edit client accounts' },
];
