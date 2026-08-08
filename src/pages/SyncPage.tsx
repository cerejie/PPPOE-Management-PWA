import { Screen } from '@/common/components/layout/Screen';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { EmptyState } from '@/common/components/notices/EmptyState';
import { OutboxRow } from '@/components/sync/lists/OutboxRow';
import * as styles from '@/pages/SyncPage.css';
import { useSyncPage } from '@/hooks/sync/useSyncPage';
import { describeOutboxItem } from '@/utils/sync/Outbox.utils';

export function SyncPage() {
  const vm = useSyncPage();

  return (
    <>
      <Screen title="Sync queue" back>
        {vm.items.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Everything is synced"
            message="Nothing is waiting to upload."
          />
        ) : (
          <>
            {vm.online && (
              <button type="button" onClick={vm.flushNow} className={styles.flushButton}>
                Sync now
              </button>
            )}
            <ul className={styles.list}>
              {vm.items.map((item) => (
                <OutboxRow
                  key={item.client_uuid}
                  item={item}
                  onRetry={() => vm.retry(item)}
                  onDiscard={() => vm.requestDiscard(item)}
                />
              ))}
            </ul>
          </>
        )}
      </Screen>

      {vm.discarding && (
        <ConfirmDialog
          title="Discard this item?"
          message={`"${describeOutboxItem(vm.discarding)}" was rejected by the server and will be deleted from this device. This cannot be undone.`}
          confirmLabel="Discard"
          onConfirm={vm.confirmDiscard}
          onCancel={vm.cancelDiscard}
        />
      )}
    </>
  );
}
