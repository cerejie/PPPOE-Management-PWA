import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { useOnline } from '@/hooks/sync/useSyncStatus';
import type { AppUser } from '@/types/auth/Auth.types';

interface SettingsPageState {
  isEditingOwnName: boolean;
  confirmingSignOut: boolean;
  signOutError: string | null;
}

export interface SettingsPageViewModel {
  /** Null while the session is still resolving. */
  readonly appUser: AppUser | null;
  /** Up to two initials for the avatar; "?" before the profile has loaded. */
  readonly initials: string;
  readonly isSuperAdmin: boolean;
  readonly online: boolean;
  readonly isEditingOwnName: boolean;
  readonly confirmingSignOut: boolean;
  readonly signOutError: string | null;
  startEditOwnName: () => void;
  stopEditOwnName: () => void;
  requestSignOut: () => void;
  cancelSignOut: () => void;
  confirmSignOut: () => void;
}

function toInitials(displayName: string | undefined): string {
  return (displayName ?? '?')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function useSettingsPage(): SettingsPageViewModel {
  const { appUser, signOut, isSuperAdmin } = useAuth();
  const online = useOnline();

  const store = useInstanceStore<SettingsPageState>(() => ({
    isEditingOwnName: false,
    confirmingSignOut: false,
    signOutError: null,
  }));

  const { isEditingOwnName, confirmingSignOut, signOutError } = useStore(
    store,
    useShallow((s) => s),
  );

  return {
    appUser,
    initials: toInitials(appUser?.display_name),
    isSuperAdmin,
    online,
    isEditingOwnName,
    confirmingSignOut,
    signOutError,
    startEditOwnName: () => store.setState({ isEditingOwnName: true }),
    stopEditOwnName: () => store.setState({ isEditingOwnName: false }),
    requestSignOut: () => store.setState({ confirmingSignOut: true }),
    cancelSignOut: () => store.setState({ confirmingSignOut: false }),
    // Sign-out flushes the outbox, then wipes this device; a failure has to stay
    // visible, so the error the store returns is surfaced rather than thrown.
    confirmSignOut: () => {
      store.setState({ confirmingSignOut: false });
      void signOut().then((error) => store.setState({ signOutError: error }));
    },
  };
}
