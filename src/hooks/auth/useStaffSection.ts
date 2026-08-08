import { type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { db } from '@/api/common/db';
import { supabase } from '@/api/common/supabaseClient';
import { pullAll } from '@/api/sync/syncEngine';
import { useOnline } from '@/hooks/sync/useSyncStatus';
import type { AppUser } from '@/types/auth/Auth.types';

interface StaffSectionState {
  /** Id of the user whose name is being edited inline, if any. */
  renamingId: string | null;
  username: string;
  displayName: string;
  password: string;
  error: string | null;
  success: string | null;
  busy: boolean;
}

/** What the create-staff Edge Function answers with. */
interface CreateStaffResult {
  ok?: boolean;
  error?: string;
}

export interface StaffSectionViewModel {
  /** Undefined until Dexie answers. */
  readonly staff: readonly AppUser[] | undefined;
  readonly renamingId: string | null;
  readonly username: string;
  readonly displayName: string;
  readonly password: string;
  readonly error: string | null;
  readonly success: string | null;
  readonly busy: boolean;
  readonly online: boolean;
  setUsername: (value: string) => void;
  setDisplayName: (value: string) => void;
  setPassword: (value: string) => void;
  startRename: (userId: string) => void;
  stopRename: () => void;
  submit: (event: FormEvent) => void;
}

function readResult(data: unknown): CreateStaffResult | null {
  return typeof data === 'object' && data !== null ? (data as CreateStaffResult) : null;
}

/**
 * Staff list and account creation.
 *
 * Creating an account is the one write in the app that cannot be queued: the
 * login itself is minted on the server, so this form needs a connection.
 */
export function useStaffSection(): StaffSectionViewModel {
  const online = useOnline();

  const staff = useLiveQuery(async () => {
    const users = await db.app_users.toArray();
    return users.sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, []);

  const store = useInstanceStore<StaffSectionState>(() => ({
    renamingId: null,
    username: '',
    displayName: '',
    password: '',
    error: null,
    success: null,
    busy: false,
  }));

  const { renamingId, username, displayName, password, error, success, busy } = useStore(
    store,
    useShallow((s) => s),
  );

  async function createStaff(): Promise<void> {
    const current = store.getState();
    const normalisedUsername = current.username.trim().toLowerCase();

    store.setState({ error: null, success: null, busy: true });

    const { data, error: functionError } = await supabase.functions.invoke('create-staff', {
      body: {
        username: normalisedUsername,
        display_name: current.displayName.trim(),
        password: current.password,
      },
    });

    store.setState({ busy: false });

    if (functionError) {
      store.setState({ error: functionError.message });
      return;
    }

    const result = readResult(data);
    if (!result?.ok) {
      store.setState({ error: result?.error ?? 'Failed to create staff account.' });
      return;
    }

    store.setState({
      success: `Staff account "${normalisedUsername}" created.`,
      username: '',
      displayName: '',
      password: '',
    });
    await pullAll();
  }

  return {
    staff,
    renamingId,
    username,
    displayName,
    password,
    error,
    success,
    busy,
    online,
    setUsername: (value) => store.setState({ username: value }),
    setDisplayName: (value) => store.setState({ displayName: value }),
    setPassword: (value) => store.setState({ password: value }),
    startRename: (userId) => store.setState({ renamingId: userId }),
    stopRename: () => store.setState({ renamingId: null }),
    submit: (event) => {
      event.preventDefault();
      if (store.getState().busy) return;
      void createStaff();
    },
  };
}
