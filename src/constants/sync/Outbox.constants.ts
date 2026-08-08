import type { EntityTable } from '@/types/sync/Sync.types';

/** Singular noun per table, for describing a queued entity write. */
export const ENTITY_LABEL: Record<EntityTable, string> = {
  clients: 'client',
  rooms: 'room',
  routers: 'router',
  plans: 'plan',
  pppoe_accounts: 'PPPoE account',
  payments: 'payment',
  connection_events: 'connection event',
  pause_events: 'pause event',
  app_users: 'staff account',
};
