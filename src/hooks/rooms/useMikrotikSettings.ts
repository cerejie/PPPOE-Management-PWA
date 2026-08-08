import { type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useMikrotikStatus } from '@/hooks/rooms/useMikrotikStatus';
import { connectMikrotik, testMikrotik } from '@/services/rooms/Rooms.service';
import type { MikrotikStatus } from '@/types/rooms/Rooms.types';

/** Ports RouterOS listens on, by transport. Shown as the address hint. */
const API_PORT = { tls: '8729', plain: '8728' } as const;

interface MikrotikSettingsState {
  editing: boolean;
  showAdvanced: boolean;
  address: string;
  username: string;
  password: string;
  tls: boolean;
  caCert: string;
  busy: boolean;
  error: string | null;
  success: string | null;
}

export interface MikrotikSettingsViewModel {
  readonly status: MikrotikStatus | null;
  readonly loading: boolean;
  /** The router answered on the last attempt — drives the header pill. */
  readonly connected: boolean;
  /** True when the credential form replaces the summary. */
  readonly showForm: boolean;
  readonly editing: boolean;
  readonly showAdvanced: boolean;
  readonly address: string;
  readonly username: string;
  readonly password: string;
  readonly tls: boolean;
  readonly caCert: string;
  readonly busy: boolean;
  readonly error: string | null;
  readonly success: string | null;
  readonly defaultPort: string;
  setAddress: (value: string) => void;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  setTls: (value: boolean) => void;
  setCaCert: (value: string) => void;
  toggleAdvanced: () => void;
  beginEdit: () => void;
  cancelEdit: () => void;
  connect: (event: FormEvent) => void;
  test: () => void;
}

/**
 * Settings → MikroTik.
 *
 * This is not a per-device login. The browser cannot open a raw socket to the
 * router, so credentials are stored server-side and every disconnect is pushed
 * by the Edge Function — connecting here connects *the system*, once, for
 * everyone, which is what lets a disconnect queued offline still reach the
 * router later. It is also why this needs a connection at all.
 */
export function useMikrotikSettings(online: boolean): MikrotikSettingsViewModel {
  const { status, loading, refresh, setStatus } = useMikrotikStatus(online);

  const store = useInstanceStore<MikrotikSettingsState>(() => ({
    editing: false,
    showAdvanced: false,
    address: '',
    username: '',
    password: '',
    tls: true,
    caCert: '',
    busy: false,
    error: null,
    success: null,
  }));

  const state = useStore(
    store,
    useShallow((s) => s),
  );

  const connected = Boolean(status?.configured && status.lastOkAt && !status.lastError);
  const showForm = state.editing || !status?.configured;

  function beginEdit() {
    store.setState({
      // The password is never returned by the Edge Function, so an edit always
      // starts blank and re-sends it.
      address: status?.host ? `${status.host}:${status.port}` : '',
      username: status?.username ?? '',
      password: '',
      tls: status?.tls ?? true,
      caCert: '',
      error: null,
      success: null,
      editing: true,
    });
  }

  async function runConnect() {
    if (store.getState().busy) return;
    store.setState({ error: null, success: null, busy: true });

    const { address, username, password, tls, caCert } = store.getState();
    const result = await connectMikrotik({ address, username, password, tls, caCert });

    if (result.error) {
      store.setState({ busy: false, error: result.error });
      return;
    }

    setStatus(result.status);
    store.setState({
      busy: false,
      password: '',
      caCert: '',
      editing: false,
      success: `Connected to ${result.status?.identity ?? 'the router'}.`,
    });
  }

  async function runTest() {
    if (store.getState().busy) return;
    store.setState({ error: null, success: null, busy: true });

    const result = await testMikrotik();

    if (result.error) {
      store.setState({ busy: false, error: result.error });
      await refresh();
      return;
    }
    if (result.status) setStatus(result.status);
    store.setState({ busy: false, success: 'Router responded.' });
  }

  return {
    ...state,
    status,
    loading,
    connected,
    showForm,
    defaultPort: state.tls ? API_PORT.tls : API_PORT.plain,
    setAddress: (value) => store.setState({ address: value }),
    setUsername: (value) => store.setState({ username: value }),
    setPassword: (value) => store.setState({ password: value }),
    setTls: (value) => store.setState({ tls: value }),
    setCaCert: (value) => store.setState({ caCert: value }),
    toggleAdvanced: () => store.setState((s) => ({ showAdvanced: !s.showAdvanced })),
    beginEdit,
    cancelEdit: () => store.setState({ editing: false, error: null }),
    connect: (event) => {
      event.preventDefault();
      void runConnect();
    },
    test: () => void runTest(),
  };
}
