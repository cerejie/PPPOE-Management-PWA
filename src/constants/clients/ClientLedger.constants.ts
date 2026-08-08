import type { LedgerKind } from '@/types/clients/Clients.types';

export interface LedgerFilterOption {
  readonly id: LedgerKind | 'all';
  readonly label: string;
}

export const LEDGER_FILTERS: readonly LedgerFilterOption[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payments' },
  { id: 'connection', label: 'Connection' },
  { id: 'pause', label: 'Pauses' },
];

/** Glyph shown in a row's badge. The tone lives in LedgerSheet.css.ts. */
export const LEDGER_KIND_ICON: Record<LedgerKind, string> = {
  payment: '₱',
  connection: '⇄',
  pause: '❚❚',
};
