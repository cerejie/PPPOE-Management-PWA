import { useLiveQuery } from 'dexie-react-hooks';
import { entityWriteStates, type EntityWriteState } from '@/api/sync/syncEngine';
import type { EntityTable } from '@/types/sync/sync.types';

/**
 * row_id -> sync state for rows of `table` that are still queued or rejected,
 * so list and detail screens can flag records the server has not accepted.
 *
 * Returns an empty map (not undefined) once loaded, so callers can just do
 * `states.get(id)` without a readiness check.
 */
export function useEntitySync(table: EntityTable): Map<string, EntityWriteState> {
  return useLiveQuery(() => entityWriteStates(table), [table]) ?? new Map();
}
