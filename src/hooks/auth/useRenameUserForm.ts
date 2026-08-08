import { type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { renameUser } from '@/services/auth/Auth.service';
import type { AppUser } from '@/types/auth/Auth.types';

interface RenameUserFormState {
  displayName: string;
  error: string | null;
  busy: boolean;
}

export interface RenameUserForm {
  readonly displayName: string;
  readonly error: string | null;
  readonly busy: boolean;
  setDisplayName: (value: string) => void;
  submit: (event: FormEvent) => void;
}

/**
 * Inline rename. Only display_name is editable anywhere in the app — the
 * username derives the login email, so changing it would lock the account out.
 */
export function useRenameUserForm(user: AppUser, onDone: () => void): RenameUserForm {
  const store = useInstanceStore<RenameUserFormState>(() => ({
    displayName: user.display_name,
    error: null,
    busy: false,
  }));

  const { displayName, error, busy } = useStore(
    store,
    useShallow((s) => s),
  );

  async function save(): Promise<void> {
    store.setState({ error: null, busy: true });
    const err = await renameUser(user.id, store.getState().displayName);
    store.setState({ busy: false });
    if (err) {
      store.setState({ error: err });
      return;
    }
    onDone();
  }

  return {
    displayName,
    error,
    busy,
    setDisplayName: (value) => store.setState({ displayName: value }),
    submit: (event) => {
      event.preventDefault();
      if (store.getState().busy) return;
      void save();
    },
  };
}
