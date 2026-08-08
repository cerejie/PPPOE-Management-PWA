import { CLIENTS_PATH } from '@/constants/clients/ClientRoutes.constants';

export interface ManageLinkConfig {
  readonly to: string;
  readonly label: string;
  readonly hint: string;
}

/** SuperAdmin shortcuts into the management screens, in reading order. */
export const MANAGE_LINKS: readonly ManageLinkConfig[] = [
  { to: '/rooms', label: 'Rooms', hint: 'Add, rename or remove rooms & routers' },
  { to: '/plans', label: 'Plans', hint: 'Price, speed and validity' },
  { to: CLIENTS_PATH, label: 'Clients', hint: 'Add or edit client accounts' },
];
