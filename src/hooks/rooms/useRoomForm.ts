import { type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { createRoom, softDeleteRoom, updateRoom, type RoomInput } from '@/services/rooms/Rooms.service';
import { pluralize } from '@/common/utils/Format.utils';
import type { Room } from '@/types/rooms/Rooms.types';

interface RoomFormState {
  values: RoomInput;
  error: string | null;
  busy: boolean;
  confirmingDelete: boolean;
}

export interface RoomForm {
  readonly values: RoomInput;
  readonly error: string | null;
  readonly busy: boolean;
  readonly confirmingDelete: boolean;
  readonly isEdit: boolean;
  readonly title: string;
  readonly subtitle: string;
  readonly submitLabel: string;
  /** What deleting this room does to the clients still in it. */
  readonly deleteMessage: string;
  setValue: <K extends keyof RoomInput>(key: K, value: RoomInput[K]) => void;
  submit: (event: FormEvent) => void;
  requestDelete: () => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
}

interface RoomFormOptions {
  /** Undefined = create mode. */
  room?: Room;
  routerLabel: string;
  clientCount: number;
  onDone: () => void;
}

function describeDelete(room: Room | undefined, clientCount: number): string {
  if (!room) return '';
  if (clientCount === 0) {
    return `"${room.name}" will be removed from the app. Any router attached to it is detached.`;
  }
  return `"${room.name}" will be removed and its router detached. ${pluralize(
    clientCount,
    'client',
  )} will be left without a room and will need reassigning — they are not deleted.`;
}

export function useRoomForm({ room, routerLabel, clientCount, onDone }: RoomFormOptions): RoomForm {
  const isEdit = room !== undefined;

  const store = useInstanceStore<RoomFormState>(() => ({
    values: {
      name: room?.name ?? '',
      notes: room?.notes ?? null,
      routerLabel,
    },
    error: null,
    busy: false,
    confirmingDelete: false,
  }));

  const { values, error, busy, confirmingDelete } = useStore(
    store,
    useShallow((s) => s),
  );

  async function save(): Promise<void> {
    store.setState({ error: null, busy: true });
    const input = store.getState().values;
    const err = room ? await updateRoom(room.id, input) : await createRoom(input);
    store.setState({ busy: false });
    if (err) {
      store.setState({ error: err });
      return;
    }
    onDone();
  }

  async function remove(): Promise<void> {
    if (!room) return;
    store.setState({ error: null, busy: true });
    const err = await softDeleteRoom(room.id);
    store.setState({ busy: false, confirmingDelete: false });
    if (err) {
      store.setState({ error: err });
      return;
    }
    onDone();
  }

  return {
    values,
    error,
    busy,
    confirmingDelete,
    isEdit,
    title: isEdit ? 'Edit room' : 'New room',
    subtitle: room?.name ?? 'Rooms group clients by location.',
    submitLabel: busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add room',
    deleteMessage: describeDelete(room, clientCount),
    setValue: (key, value) => store.setState((s) => ({ values: { ...s.values, [key]: value } })),
    submit: (event) => {
      event.preventDefault();
      if (store.getState().busy) return;
      void save();
    },
    requestDelete: () => store.setState({ confirmingDelete: true }),
    cancelDelete: () => store.setState({ confirmingDelete: false }),
    confirmDelete: () => void remove(),
  };
}
