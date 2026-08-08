import { EditNameButton } from '@/components/settings/buttons/EditNameButton';
import { NameEditor } from '@/components/settings/forms/NameEditor';
import * as styles from '@/components/settings/lists/StaffRow.css';
import type { AppUser } from '@/types/auth/Auth.types';

interface Props {
  user: AppUser;
  isRenaming: boolean;
  onStartRename: () => void;
  onStopRename: () => void;
}

/** One staff account, switching in place between reading and renaming. */
export function StaffRow({ user, isRenaming, onStartRename, onStopRename }: Props) {
  return (
    <li className={styles.row}>
      {isRenaming ? (
        <NameEditor user={user} onDone={onStopRename} />
      ) : (
        <>
          <div className={styles.identity}>
            <p className={styles.name}>{user.display_name}</p>
            <p className={styles.meta}>{`@${user.username} · ${user.role}`}</p>
          </div>
          {!user.is_active && <span className={styles.inactiveTag}>inactive</span>}
          <EditNameButton label={`Rename ${user.display_name}`} onClick={onStartRename} />
        </>
      )}
    </li>
  );
}
