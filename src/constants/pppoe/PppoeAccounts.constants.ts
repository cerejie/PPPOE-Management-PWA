import type { SelectFieldOption } from '@/common/components/inputs/SelectField';

export const PPPOE_PATH = '/pppoe';

/**
 * PPP services the form offers. RouterOS accepts more, and an imported secret
 * may legitimately carry one of them — which is why PppoeAccount.service is a
 * string. This is only the set an operator can choose from here.
 */
export const PPPOE_SERVICE_OPTIONS: readonly SelectFieldOption[] = [
  { value: 'pppoe', label: 'pppoe' },
  { value: 'any', label: 'any' },
];

export const NO_CLIENT_LABEL = 'Unassigned';
export const NO_PROFILE_LABEL = 'No profile (router default)';

/** How the list is narrowed. Each chip maps to one of these. */
export type PppoeFilter = 'all' | 'enabled' | 'disabled' | 'unassigned' | 'missing';

export interface PppoeFilterChip {
  readonly value: PppoeFilter;
  readonly label: string;
}

export const PPPOE_FILTER_CHIPS: readonly PppoeFilterChip[] = [
  { value: 'all', label: 'All' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'missing', label: 'Not on router' },
];
