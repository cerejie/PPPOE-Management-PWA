import { type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { useOnline } from '@/hooks/sync/useSyncStatus';

interface LoginFormState {
  identifier: string;
  password: string;
  error: string | null;
  busy: boolean;
}

export interface LoginForm {
  readonly identifier: string;
  readonly password: string;
  readonly error: string | null;
  readonly busy: boolean;
  readonly online: boolean;
  /** Signing in is the one action that genuinely needs the auth server. */
  readonly canSubmit: boolean;
  setIdentifier: (value: string) => void;
  setPassword: (value: string) => void;
  submit: (event: FormEvent) => void;
}

export function useLoginForm(): LoginForm {
  const { signIn } = useAuth();
  const online = useOnline();

  const store = useInstanceStore<LoginFormState>(() => ({
    identifier: '',
    password: '',
    error: null,
    busy: false,
  }));

  const { identifier, password, error, busy } = useStore(
    store,
    useShallow((s) => s),
  );

  async function runSignIn() {
    if (store.getState().busy) return;
    store.setState({ error: null, busy: true });
    const { identifier: id, password: secret } = store.getState();
    const err = await signIn(id, secret);
    store.setState({ busy: false, error: err });
  }

  return {
    identifier,
    password,
    error,
    busy,
    online,
    canSubmit: !busy && online,
    setIdentifier: (value) => store.setState({ identifier: value }),
    setPassword: (value) => store.setState({ password: value }),
    submit: (event) => {
      event.preventDefault();
      void runSignIn();
    },
  };
}
