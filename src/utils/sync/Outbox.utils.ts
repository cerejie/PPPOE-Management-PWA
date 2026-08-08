import { ENTITY_LABEL } from '@/constants/sync/Outbox.constants';
import { formatMoney } from '@/common/utils/Format.utils';
import type { OutboxItem } from '@/types/sync/Sync.types';

/** One-line description of a queued write, for the sync screen and its confirm. */
export function describeOutboxItem(item: OutboxItem): string {
  if (item.kind === 'payment') return `Payment ${formatMoney(item.payload.amount)}`;
  if (item.kind === 'pause_event') {
    return item.payload.action === 'pause' ? 'Pause client' : 'Resume client';
  }
  if (item.kind === 'connection_event') {
    return item.payload.action === 'connect' ? 'Connect client' : 'Disconnect client';
  }

  const write = item.payload;
  const noun = ENTITY_LABEL[write.table];
  if (write.op === 'insert') return `Add ${noun}`;
  if (write.op === 'delete') return `Delete ${noun}`;
  // A soft delete is an update that sets deleted_at; name it as a delete.
  return write.values && 'deleted_at' in write.values ? `Delete ${noun}` : `Edit ${noun}`;
}
