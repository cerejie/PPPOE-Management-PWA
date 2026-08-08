import { SyncBadge } from '@/common/components/badges/SyncBadge';
import * as styles from '@/styles/pages/rooms/lists/RoomListItem.css';
import type { EntityWriteState } from '@/api/sync/syncEngine';
import type { RoomRow } from '@/hooks/rooms/useRoomRows';

interface Props {
  row: RoomRow;
  syncState: EntityWriteState | undefined;
  onOpen: () => void;
  /** Null for staff, who may not edit rooms. */
  onEdit: (() => void) | null;
}

export function RoomListItem({ row, syncState, onOpen, onEdit }: Props) {
  const { room, routerLabel, clientCount, connectedCount } = row;

  return (
    <li className={styles.row}>
      <button type="button" onClick={onOpen} className={styles.open}>
        <div className={styles.identity}>
          <p className={styles.name}>{room.name}</p>
          <p className={styles.meta}>
            {routerLabel || 'No router'}
            {room.notes ? ` · ${room.notes}` : ''}
          </p>
        </div>

        <SyncBadge state={syncState} />

        <span className={styles.occupancy}>
          {connectedCount > 0 && <span aria-hidden className={styles.liveDot} />}
          <span className={styles.connected}>{connectedCount}</span>/{clientCount}
        </span>

        {!onEdit && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className={styles.chevron}>
            <path
              d="M9 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${room.name}`}
          className={styles.editButton}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 20h4l10-10-4-4L4 16v4z"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </li>
  );
}
