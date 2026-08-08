import * as form from '@/styles/global/Form.css';
import { srOnly } from '@/styles/global/A11y.css';
import * as styles from '@/styles/pages/settings/forms/NameEditor.css';
import { useRenameUserForm } from '@/hooks/auth/useRenameUserForm';
import type { AppUser } from '@/types/auth/Auth.types';

interface Props {
  user: AppUser;
  onDone: () => void;
}

/** Inline display-name field, shown in place of the name it replaces. */
export function NameEditor({ user, onDone }: Props) {
  const vm = useRenameUserForm(user, onDone);
  const fieldId = `name-${user.id}`;

  return (
    <form onSubmit={vm.submit} className={styles.form}>
      <label htmlFor={fieldId} className={srOnly}>
        {`Display name for @${user.username}`}
      </label>
      <input
        id={fieldId}
        type="text"
        required
        autoFocus
        value={vm.displayName}
        onChange={(e) => vm.setDisplayName(e.target.value)}
        className={form.field}
      />

      {vm.error && (
        <p role="alert" className={styles.error}>
          {vm.error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" disabled={vm.busy} className={styles.save}>
          {vm.busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onDone} className={styles.cancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
