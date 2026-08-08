import { Sheet } from '@/common/components/overlays/Sheet';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { OfflineNotice } from '@/common/components/notices/OfflineNotice';
import * as form from '@/styles/global/Form.css';
import { useRoomForm } from '@/hooks/rooms/useRoomForm';
import type { Room } from '@/types/rooms/Rooms.types';

interface Props {
  /** Undefined = create mode. */
  room?: Room;
  /** Current router label for the room, if any. */
  routerLabel?: string;
  /** Clients currently assigned — what the delete confirm has to warn about. */
  clientCount?: number;
  onClose: () => void;
}

export function RoomFormSheet({ room, routerLabel = '', clientCount = 0, onClose }: Props) {
  const vm = useRoomForm({ room, routerLabel, clientCount, onDone: onClose });
  const { values } = vm;

  return (
    <>
      <Sheet title={vm.title} subtitle={vm.subtitle} onClose={onClose}>
        <form onSubmit={vm.submit} className={form.stack}>
          <div>
            <label htmlFor="room-name" className={form.label}>
              Room name
            </label>
            <input
              id="room-name"
              type="text"
              required
              autoFocus={!vm.isEdit}
              value={values.name}
              onChange={(e) => vm.setValue('name', e.target.value)}
              placeholder="e.g. Building A – 2F"
              className={form.field}
            />
          </div>

          <div>
            <label htmlFor="room-router" className={form.label}>
              Router label <span className={form.optional}>(optional)</span>
            </label>
            <input
              id="room-router"
              type="text"
              value={values.routerLabel}
              onChange={(e) => vm.setValue('routerLabel', e.target.value)}
              placeholder="e.g. RB750-A"
              className={form.field}
            />
            <p className={form.hint}>Clearing this detaches the router from the room.</p>
          </div>

          <div>
            <label htmlFor="room-notes" className={form.label}>
              Notes <span className={form.optional}>(optional)</span>
            </label>
            <textarea
              id="room-notes"
              rows={2}
              value={values.notes ?? ''}
              onChange={(e) => vm.setValue('notes', e.target.value || null)}
              className={form.field}
            />
          </div>

          <OfflineNotice message="this room is saved on the device and synced automatically later." />

          {vm.error && (
            <p role="alert" className={form.errorAlert}>
              {vm.error}
            </p>
          )}

          <button type="submit" disabled={vm.busy} className={form.button.primary}>
            {vm.submitLabel}
          </button>

          {vm.isEdit && (
            <button
              type="button"
              disabled={vm.busy}
              onClick={vm.requestDelete}
              className={form.button.danger}
            >
              Delete room
            </button>
          )}
        </form>
      </Sheet>

      {vm.confirmingDelete && (
        <ConfirmDialog
          title="Delete room?"
          message={vm.deleteMessage}
          confirmLabel="Delete"
          busy={vm.busy}
          onConfirm={vm.confirmDelete}
          onCancel={vm.cancelDelete}
        />
      )}
    </>
  );
}
