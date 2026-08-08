import { useNavigate } from 'react-router-dom';
import { Screen } from '@/common/components/layout/Screen';
import { Fab } from '@/common/components/buttons/Fab';
import { FilterChip } from '@/common/components/buttons/FilterChip';
import { SearchInput } from '@/common/components/inputs/SearchInput';
import { EmptyState } from '@/common/components/notices/EmptyState';
import { LoadingNotice } from '@/common/components/notices/LoadingNotice';
import { RoomListItem } from '@/components/rooms/lists/RoomListItem';
import { RoomFormSheet } from '@/components/rooms/sheet/RoomFormSheet';
import * as styles from '@/pages/RoomsPage.css';
import { clientsFilteredPath } from '@/constants/clients/ClientRoutes.constants';
import { useRoomsPage } from '@/hooks/rooms/useRoomsPage';

export function RoomsPage() {
  const vm = useRoomsPage();
  const navigate = useNavigate();
  const { rows, visible, editing } = vm;

  return (
    <>
      <Screen title="Rooms" eyebrow={visible ? `${visible.length} shown` : undefined}>
        <div className={styles.search}>
          <SearchInput
            value={vm.search}
            onChange={vm.setSearch}
            placeholder="Search room number"
            ariaLabel="Search rooms"
          />
        </div>

        <div className={styles.filterBar}>
          <FilterChip active={vm.activity === 'all'} onClick={() => vm.toggleActivity('all')}>
            {`All ${vm.totalCount}`}
          </FilterChip>
          <FilterChip active={vm.activity === 'active'} onClick={() => vm.toggleActivity('active')}>
            {`Active ${vm.activeCount}`}
          </FilterChip>
          <FilterChip
            active={vm.activity === 'inactive'}
            onClick={() => vm.toggleActivity('inactive')}
          >
            {`Not active ${vm.inactiveCount}`}
          </FilterChip>
        </div>

        {rows === undefined || visible === undefined ? (
          <LoadingNotice />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="🏠"
            title="No rooms yet"
            message={
              vm.canEdit ? 'Tap + to add your first room.' : 'An admin needs to add rooms first.'
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No rooms match"
            message="Try clearing the filter or the search."
          />
        ) : (
          <ul className={styles.list}>
            {visible.map((row) => (
              <RoomListItem
                key={row.room.id}
                row={row}
                syncState={vm.syncState(row.room.id)}
                onOpen={() => navigate(clientsFilteredPath({ room: row.room.id }))}
                onEdit={vm.canEdit ? () => vm.edit(row) : null}
              />
            ))}
          </ul>
        )}
      </Screen>

      {vm.canEdit && <Fab onClick={vm.create} label="Add room" />}

      {editing === 'new' && <RoomFormSheet onClose={vm.closeForm} />}
      {editing !== null && editing !== 'new' && (
        <RoomFormSheet
          room={editing.room}
          routerLabel={editing.routerLabel}
          clientCount={editing.clientCount}
          onClose={vm.closeForm}
        />
      )}
    </>
  );
}
