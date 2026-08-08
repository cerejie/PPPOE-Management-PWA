import { EditNameButton } from '@/components/settings/buttons/EditNameButton';
import { NameEditor } from '@/components/settings/forms/NameEditor';
import * as styles from '@/styles/pages/settings/cards/ProfileCard.css';
import type { AppUser } from '@/types/auth/Auth.types';

interface Props {
  /** Null while the session is still resolving. */
  user: AppUser | null;
  initials: string;
  isEditingName: boolean;
  onStartEditName: () => void;
  onStopEditName: () => void;
}

/** The signed-in user, with an inline rename of their display name. */
export function ProfileCard({
  user,
  initials,
  isEditingName,
  onStartEditName,
  onStopEditName,
}: Props) {
  return (
    <section className={styles.card}>
      <div className={styles.avatar} aria-hidden>
        {initials}
      </div>

      {user && isEditingName ? (
        <NameEditor user={user} onDone={onStopEditName} />
      ) : (
        <>
          <div className={styles.identity}>
            <p className={styles.name}>{user?.display_name}</p>
            <p className={styles.meta}>{user ? `@${user.username} · ${user.role}` : ''}</p>
          </div>
          {user && (
            <EditNameButton label="Edit your display name" onClick={onStartEditName} />
          )}
        </>
      )}
    </section>
  );
}
