/**
 * Client routes in one place, so a screen that links into the list — the
 * dashboard tiles, a room's occupancy row — cannot drift from the query
 * parameters `useClientsPage` actually reads.
 */

export const CLIENTS_PATH = '/clients';
export const NEW_CLIENT_PATH = '/clients/new';

export const clientDetailPath = (clientId: string): string => `${CLIENTS_PATH}/${clientId}`;

export const editClientPath = (clientId: string): string => `${clientDetailPath(clientId)}/edit`;

export const clientsFilteredPath = (params: Readonly<Record<string, string>>): string =>
  `${CLIENTS_PATH}?${new URLSearchParams(params).toString()}`;
