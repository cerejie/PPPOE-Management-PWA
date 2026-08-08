import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import { ENTITY_LABEL } from '@/constants/sync/Outbox.constants';
import { isClientEvent, type OutboxItem } from '@/types/sync/Sync.types';

/**
 * Name of the row an outbox item refers to. Entity writes resolve against their
 * own table — including rows that only exist locally, which is the whole point.
 */
export function useOutboxSubject(item: OutboxItem): string {
  return (
    useLiveQuery(async () => {
      if (isClientEvent(item)) {
        const client = await db.clients.get(item.payload.client_id);
        return client?.full_name ?? 'Unknown client';
      }
      const row = (await db.table(item.payload.table).get(item.payload.row_id)) as
        | { full_name?: string; name?: string; label?: string }
        | undefined;
      return row?.full_name ?? row?.name ?? row?.label ?? ENTITY_LABEL[item.payload.table];
    }, [item.client_uuid]) ?? '…'
  );
}
