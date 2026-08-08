import type { SelectFieldOption } from '@/common/components/inputs/SelectField';
import type { AccountStatus } from '@/types/clients/Clients.types';

export const ACCOUNT_STATUS_OPTIONS: readonly SelectFieldOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
];

/** The select can only hold what it was given, but the value arrives as a string. */
export function isAccountStatus(value: string): value is AccountStatus {
  return ACCOUNT_STATUS_OPTIONS.some((option) => option.value === value);
}

/** Billing period assumed when the client is on no plan. */
export const DEFAULT_PLAN_DURATION_DAYS = 30;

export const NO_ROOM_LABEL = 'No room';
export const NO_PLAN_LABEL = 'No plan';

/** Stands in for pppoe_username wherever a client has no line assigned yet. */
export const NO_ACCOUNT_LABEL = 'No PPPoE account';
