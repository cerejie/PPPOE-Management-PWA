/** Query-string keys the clients list reads. Shared with `clientsFilteredPath`. */
export type ClientFilterKey = 'status' | 'expiry' | 'paused' | 'room' | 'sort';

/** List order, by the date the client was added. */
export type ClientSort = 'newest' | 'oldest';

export const DEFAULT_CLIENT_SORT: ClientSort = 'newest';

/** Read out on the sort button — the icon alone carries no direction. */
export const CLIENT_SORT_LABELS: Readonly<Record<ClientSort, string>> = {
  newest: 'Sorted newest first',
  oldest: 'Sorted oldest first',
};

export interface ClientFilterChip {
  readonly label: string;
  /**
   * The parameter the chip owns. Null is the "All" chip, which clears every
   * filter except the room — a room is a scope the user navigated into, not a
   * filter they picked here.
   */
  readonly param: { readonly key: ClientFilterKey; readonly value: string } | null;
}

/** The filter row above the client list, in display order. */
export const CLIENT_FILTER_CHIPS: readonly ClientFilterChip[] = [
  { label: 'All', param: null },
  { label: 'Connected', param: { key: 'status', value: 'connected' } },
  { label: 'Disconnected', param: { key: 'status', value: 'disconnected' } },
  { label: 'Expiring 7d', param: { key: 'expiry', value: 'expiring' } },
  { label: 'Expired', param: { key: 'expiry', value: 'expired' } },
  { label: 'Paused', param: { key: 'paused', value: '1' } },
];
