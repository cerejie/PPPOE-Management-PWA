import { useState, type FormEvent } from 'react';
import { Sheet } from '@/components/Sheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  dangerButtonClass,
  fieldClass,
  labelClass,
  primaryButtonClass,
} from '@/components/formStyles';
import { useOnline } from '@/features/sync/useSyncStatus';
import type { Room } from '@/lib/types';
import { createRoom, softDeleteRoom, updateRoom, type RoomInput } from './actions';

interface Props {
  /** Undefined = create mode. */
  room?: Room;
  /** Current router label for the room, if any. */
  routerLabel?: string;
  onClose: () => void;
}

export function RoomFormSheet({ room, routerLabel = '', onClose }: Props) {
  const isEdit = room !== undefined;
  const online = useOnline();

  const [form, setForm] = useState<RoomInput>({
    name: room?.name ?? '',
    notes: room?.notes ?? null,
    routerLabel,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function set<K extends keyof RoomInput>(key: K, value: RoomInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const err = isEdit && room ? await updateRoom(room.id, form) : await createRoom(form);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  async function handleDelete() {
    if (!room) return;
    setError(null);
    setBusy(true);
    const err = await softDeleteRoom(room.id);
    setBusy(false);
    setConfirmingDelete(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <>
      <Sheet
        title={isEdit ? 'Edit room' : 'New room'}
        subtitle={isEdit ? room?.name : 'Rooms group clients by location.'}
        onClose={onClose}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="room-name" className={labelClass}>
              Room name
            </label>
            <input
              id="room-name"
              type="text"
              required
              autoFocus={!isEdit}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Building A – 2F"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="room-router" className={labelClass}>
              Router label <span className="font-normal text-muted/70">(optional)</span>
            </label>
            <input
              id="room-router"
              type="text"
              value={form.routerLabel}
              onChange={(e) => set('routerLabel', e.target.value)}
              placeholder="e.g. RB750-A"
              className={fieldClass}
            />
            <p className="mt-1.5 text-xs text-muted">
              Clearing this detaches the router from the room.
            </p>
          </div>

          <div>
            <label htmlFor="room-notes" className={labelClass}>
              Notes <span className="font-normal text-muted/70">(optional)</span>
            </label>
            <textarea
              id="room-notes"
              rows={2}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || null)}
              className={fieldClass}
            />
          </div>

          {!online && (
            <p className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
              Room changes need a connection. Go online and try again.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || !online} className={primaryButtonClass}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add room'}
          </button>

          {isEdit && (
            <button
              type="button"
              disabled={busy || !online}
              onClick={() => setConfirmingDelete(true)}
              className={dangerButtonClass}
            >
              Delete room
            </button>
          )}
        </form>
      </Sheet>

      {confirmingDelete && room && (
        <ConfirmDialog
          title="Delete room?"
          message={`"${room.name}" will be removed from the app. Any router attached to it is detached. This is refused if clients are still assigned to the room.`}
          confirmLabel="Delete"
          busy={busy}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
