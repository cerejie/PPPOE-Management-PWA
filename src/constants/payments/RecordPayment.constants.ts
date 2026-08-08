import type { ClientFilters } from '@/hooks/clients/useClients';

export interface PaymentMethodOption {
  readonly value: string;
  readonly label: string;
}

/**
 * The methods offered on the payment form. A typed list rather than a switch so
 * adding one is a data change, not a JSX change.
 */
export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'GCash', label: 'GCash' },
  { value: 'Bank', label: 'Bank' },
  { value: 'Other', label: 'Other' },
];

export const DEFAULT_PAYMENT_METHOD = 'Cash';

/** The customer picker offers everyone, so its list hook runs unfiltered. */
export const ALL_CLIENTS: ClientFilters = {
  search: '',
  status: 'all',
  roomId: 'all',
  expiry: 'all',
  paused: 'all',
  sort: 'name',
};

/** Billing period assumed for a client with no plan attached. */
export const DEFAULT_DURATION_DAYS = 30;
