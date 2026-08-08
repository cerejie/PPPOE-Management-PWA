import { useMemo, type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useClients } from '@/hooks/clients/useClients';
import { usePppoeAccountHolders } from '@/hooks/pppoe/usePppoeAccounts';
import {
  createPppoeAccount,
  deletePppoeAccount,
  updatePppoeAccount,
} from '@/services/pppoe/Pppoe.service';
import { NO_CLIENT_LABEL } from '@/constants/pppoe/PppoeAccounts.constants';
import type { SearchSelectOption } from '@/common/components/inputs/SearchSelect';
import type { PppoeAccount } from '@/types/pppoe/Pppoe.types';

interface PppoeAccountFormState {
  name: string;
  password: string;
  service: string;
  /**
   * Null until the picker is touched, because the current holder lives on
   * `clients` and is not known when the store is created. An empty string is
   * therefore a real choice — "unassign" — and must not fall back.
   */
  clientId: string | null;
  disabled: boolean;
  error: string | null;
  busy: boolean;
  confirmingDelete: boolean;
}

export interface PppoeAccountForm {
  readonly name: string;
  readonly password: string;
  readonly service: string;
  readonly clientId: string;
  readonly disabled: boolean;
  readonly error: string | null;
  readonly busy: boolean;
  readonly confirmingDelete: boolean;
  readonly isEdit: boolean;
  readonly title: string;
  readonly subtitle: string;
  readonly submitLabel: string;
  readonly deleteMessage: string;
  /** Every client, each hinting at the line they are on today. */
  readonly clientOptions: readonly SearchSelectOption[];
  /**
   * True while a client holds this line, which is when its enabled state stops
   * being the operator's to set — payments and disconnects own it instead.
   */
  readonly assigned: boolean;
  readonly lineStateHint: string;
  /** Set when the account is not (yet) on the router, explaining why. */
  readonly routerHint: string | null;
  setName: (value: string) => void;
  setPassword: (value: string) => void;
  setService: (value: string) => void;
  setClientId: (value: string) => void;
  setDisabled: (value: boolean) => void;
  submit: (event: FormEvent) => void;
  requestDelete: () => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
}

/** All clients, alphabetical — the only order that helps someone hunting a name. */
const CLIENT_PICKER_FILTERS = {
  search: '',
  status: 'all',
  roomId: 'all',
  expiry: 'all',
  paused: 'all',
  sort: 'name',
} as const;

/**
 * Create or edit one `/ppp/secret`, including who is on it.
 *
 * Assignment is offered from this side as well as from the client form; both
 * call the same service, which owns releasing whichever side already held the
 * line so the 1:1 constraint can never be the thing that reports the error.
 */
export function usePppoeAccountForm(
  account: PppoeAccount | undefined,
  onDone: () => void,
): PppoeAccountForm {
  const isEdit = account !== undefined;
  const clients = useClients(CLIENT_PICKER_FILTERS);
  const holders = usePppoeAccountHolders();

  const store = useInstanceStore<PppoeAccountFormState>(() => ({
    name: account?.name ?? '',
    password: account?.password ?? '',
    service: account?.service ?? 'pppoe',
    clientId: null,
    disabled: account?.disabled ?? false,
    error: null,
    busy: false,
    confirmingDelete: false,
  }));

  const state = useStore(
    store,
    useShallow((s) => s),
  );

  // The holder lives on `clients`, so it is resolved rather than passed in.
  const currentHolderId = useMemo(() => {
    if (!account || !clients) return '';
    return clients.find((c) => c.pppoe_account_id === account.id)?.id ?? '';
  }, [account, clients]);

  const clientId = state.clientId ?? currentHolderId;

  const clientOptions = useMemo<readonly SearchSelectOption[]>(() => {
    const lineOf = (accountId: string | null): string | undefined => {
      if (!accountId) return undefined;
      return accountId === account?.id ? 'on this account' : 'on another account';
    };

    return [
      { value: '', label: NO_CLIENT_LABEL },
      ...(clients ?? []).map((client) => ({
        value: client.id,
        label: client.full_name,
        hint: lineOf(client.pppoe_account_id) ?? 'no account yet',
      })),
    ];
  }, [clients, account]);

  const assigned = clientId !== '';

  async function save(): Promise<void> {
    const s = store.getState();
    const input = {
      name: s.name,
      password: s.password,
      service: s.service,
      // An assigned line's state belongs to its client's connection status, so
      // never let the form overwrite it with a stale toggle.
      disabled: clientId === '' ? s.disabled : (account?.disabled ?? false),
      client_id: clientId || null,
    };

    store.setState({ error: null, busy: true });
    const err = account
      ? await updatePppoeAccount(account.id, input)
      : await createPppoeAccount(input);
    store.setState({ busy: false });

    if (err) {
      store.setState({ error: err });
      return;
    }
    onDone();
  }

  async function remove(): Promise<void> {
    if (!account) return;
    store.setState({ error: null, busy: true });
    const err = await deletePppoeAccount(account.id);
    store.setState({ busy: false, confirmingDelete: false });
    if (err) {
      store.setState({ error: err });
      return;
    }
    onDone();
  }

  const holderName = account ? holders?.get(account.id) : undefined;

  return {
    ...state,
    clientId,
    isEdit,
    assigned,
    title: isEdit ? 'Edit PPPoE account' : 'New PPPoE account',
    subtitle: account
      ? (holderName ?? 'Not assigned to a client')
      : 'Creates a /ppp/secret on the router.',
    submitLabel: state.busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add account',
    // Names the holder rather than refusing the delete: losing a line is the
    // consequence an operator has to weigh, and the sheet is the only place
    // they can see it before it happens.
    deleteMessage: account
      ? `"${account.name}" is removed from the app and its /ppp/secret is deleted from the router on the next sync.${
          holderName ? ` ${holderName} is on this line and is left with no PPPoE account.` : ''
        } This cannot be undone.`
      : '',
    clientOptions,
    lineStateHint: assigned
      ? 'This line follows its client — a payment enables it, an expiry or disconnect disables it and kicks the session.'
      : 'With no client on it, the line is enabled or disabled here.',
    routerHint:
      account && !account.present_on_router
        ? account.synced_to_router
          ? 'Not found on the router. It may have been deleted there — import to refresh.'
          : 'Queued: the secret is created on the router on the next sync.'
        : null,
    setName: (value) => store.setState({ name: value }),
    setPassword: (value) => store.setState({ password: value }),
    setService: (value) => store.setState({ service: value }),
    setClientId: (value) => store.setState({ clientId: value }),
    setDisabled: (value) => store.setState({ disabled: value }),
    submit: (event) => {
      event.preventDefault();
      if (store.getState().busy) return;
      void save();
    },
    requestDelete: () => store.setState({ confirmingDelete: true }),
    cancelDelete: () => store.setState({ confirmingDelete: false }),
    confirmDelete: () => void remove(),
  };
}
