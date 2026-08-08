import { formatDate, formatMoney } from '@/common/utils/Format.utils';
import type { Client } from '@/types/clients/Clients.types';

/** Everything a profile row may read: the record plus its resolved relations. */
export interface ClientProfileContext {
  readonly client: Client;
  readonly roomLabel: string;
  readonly planLabel: string;
}

export interface ClientProfileField {
  readonly label: string;
  readonly valueOf: (context: ClientProfileContext) => string;
}

/**
 * The plain label/value rows of the profile card, in reading order. Expiry is
 * not here: it carries a badge, so the card renders it separately.
 */
export const CLIENT_PROFILE_FIELDS: readonly ClientProfileField[] = [
  { label: 'Room', valueOf: (context) => context.roomLabel },
  { label: 'Plan', valueOf: (context) => context.planLabel },
  { label: 'Monthly fee', valueOf: (context) => formatMoney(context.client.monthly_fee) },
  { label: 'Account', valueOf: (context) => context.client.account_status },
  { label: 'Installed', valueOf: (context) => formatDate(context.client.installed_at) },
];
