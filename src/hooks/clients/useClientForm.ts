import { useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useClient, useClients } from '@/hooks/clients/useClients';
import { usePlans } from '@/hooks/plans/usePlans';
import { usePppoeAccounts } from '@/hooks/pppoe/usePppoeAccounts';
import { useRooms } from '@/hooks/rooms/useRooms';
import { useRouters } from '@/hooks/rooms/useRouters';
import { isPlanOfferable } from '@/services/plans/Plans.service';
import {
  createClient,
  deleteClient,
  initialExpiry,
  updateClient,
  type ClientInput,
} from '@/services/clients/Clients.service';
import { CLIENTS_PATH } from '@/constants/clients/ClientRoutes.constants';
import {
  DEFAULT_PLAN_DURATION_DAYS,
  NO_ACCOUNT_LABEL,
  NO_PLAN_LABEL,
  NO_ROOM_LABEL,
  isAccountStatus,
} from '@/constants/clients/ClientForm.constants';
import type { SelectFieldOption } from '@/common/components/inputs/SelectField';
import type { SearchSelectOption } from '@/common/components/inputs/SearchSelect';
import { formatDate, fromDateInputStart, todayInputValue } from '@/common/utils/Format.utils';
import type { Plan } from '@/types/plans/Plans.types';

/** Only used to work out which lines are already taken; order is irrelevant. */
const ACCOUNT_PICKER_FILTERS = {
  search: '',
  status: 'all',
  roomId: 'all',
  expiry: 'all',
  paused: 'all',
  sort: 'name',
} as const;

interface ClientFormState {
  values: ClientInput;
  error: string | null;
  busy: boolean;
  confirmingDelete: boolean;
}

export interface ClientFormViewModel {
  readonly values: ClientInput;
  readonly error: string | null;
  readonly busy: boolean;
  readonly confirmingDelete: boolean;
  readonly isEdit: boolean;
  readonly title: string;
  readonly submitLabel: string;
  readonly roomOptions: readonly SelectFieldOption[];
  /** Retired plans stay listed for the client already on one. */
  readonly planOptions: readonly SelectFieldOption[];
  /** Free lines plus whichever one this client already holds. */
  readonly accountOptions: readonly SearchSelectOption[];
  /** Why the account list is short or empty — null when there is nothing to say. */
  readonly accountHint: string | null;
  /** Billing period of the selected plan, used for the first-expiry preview. */
  readonly durationDays: number;
  /** Expiry a new client would start on; null on edit, where payments own it. */
  readonly seededExpiry: string | null;
  readonly seededExpiryLabel: string;
  setValue: <K extends keyof ClientInput>(key: K, value: ClientInput[K]) => void;
  selectAccountStatus: (value: string) => void;
  /** Picking a room adopts that room's router. */
  selectRoom: (roomId: string) => void;
  /** Picking a plan defaults the monthly fee to its price. */
  selectPlan: (planId: string) => void;
  setInstalledOn: (dateInputValue: string) => void;
  submit: (event: FormEvent) => void;
  requestDelete: () => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
}

const BLANK_CLIENT: ClientInput = {
  full_name: '',
  pppoe_account_id: null,
  room_id: null,
  router_id: null,
  plan_id: null,
  monthly_fee: 0,
  account_status: 'active',
  installed_at: null,
  notes: null,
};

function describePlan(plan: Plan): string {
  const speed = plan.mbps > 0 ? ` · ${plan.mbps} Mbps` : '';
  return `${plan.name} — ₱${plan.price}${speed} · ${plan.duration_days}d`;
}

/**
 * SuperAdmin-only create/edit form. Works offline: the row is written to Dexie
 * with a device-generated id and queued in the outbox, so the new client is
 * navigable immediately and reaches Supabase on the next flush.
 */
export function useClientForm(): ClientFormViewModel {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();

  const existing = useClient(id);
  const rooms = useRooms();
  const routers = useRouters();
  const plans = usePlans();
  const accounts = usePppoeAccounts();
  const clients = useClients(ACCOUNT_PICKER_FILTERS);

  const store = useInstanceStore<ClientFormState>(() => ({
    values: { ...BLANK_CLIENT, installed_at: fromDateInputStart(todayInputValue()) },
    error: null,
    busy: false,
    confirmingDelete: false,
  }));

  const { values, error, busy, confirmingDelete } = useStore(
    store,
    useShallow((s) => s),
  );

  useEffect(() => {
    if (!existing) return;
    store.setState({
      values: {
        full_name: existing.full_name,
        pppoe_account_id: existing.pppoe_account_id,
        room_id: existing.room_id,
        router_id: existing.router_id,
        plan_id: existing.plan_id,
        monthly_fee: existing.monthly_fee,
        account_status: existing.account_status,
        installed_at: existing.installed_at,
        notes: existing.notes,
      },
    });
  }, [store, existing]);

  const roomOptions = useMemo<readonly SelectFieldOption[]>(
    () => [
      { value: '', label: NO_ROOM_LABEL },
      ...(rooms ?? []).map((room) => ({ value: room.id, label: room.name })),
    ],
    [rooms],
  );

  const planOptions = useMemo<readonly SelectFieldOption[]>(
    () => [
      { value: '', label: NO_PLAN_LABEL },
      ...(plans ?? [])
        .filter((plan) => isPlanOfferable(plan) || plan.id === values.plan_id)
        .map((plan) => ({ value: plan.id, label: describePlan(plan) })),
    ],
    [plans, values.plan_id],
  );

  /**
   * A line already on someone else is deliberately not offered. Moving a
   * subscriber onto an occupied account is a real operation, but it belongs on
   * the PPPoE screen where the person losing the line is visible — silently
   * cutting them off from inside someone else's edit form is not something an
   * operator can see themselves doing.
   */
  const accountOptions = useMemo<readonly SearchSelectOption[]>(() => {
    const taken = new Set(
      (clients ?? [])
        .filter((c) => c.pppoe_account_id && c.id !== id)
        .map((c) => c.pppoe_account_id),
    );

    return [
      { value: '', label: NO_ACCOUNT_LABEL },
      ...(accounts ?? [])
        .filter((account) => !taken.has(account.id))
        .map((account) => ({
          value: account.id,
          label: account.name,
          hint: account.present_on_router
            ? account.disabled
              ? 'disabled on the router'
              : account.service
            : 'not on the router yet',
        })),
    ];
  }, [accounts, clients, id]);

  const durationDays =
    plans?.find((plan) => plan.id === values.plan_id)?.duration_days ?? DEFAULT_PLAN_DURATION_DAYS;

  // Only creation derives the expiry from the install date, so only creation
  // previews it. On an existing client expires_at has moved on with payments.
  const seededExpiry = isEdit ? null : initialExpiry(values.installed_at, durationDays);

  function setValue<K extends keyof ClientInput>(key: K, value: ClientInput[K]): void {
    store.setState((s) => ({ values: { ...s.values, [key]: value } }));
  }

  function selectRoom(roomId: string): void {
    const nextRoomId = roomId || null;
    const roomRouter = routers?.find((router) => router.room_id === nextRoomId);
    store.setState((s) => ({
      values: { ...s.values, room_id: nextRoomId, router_id: roomRouter?.id ?? null },
    }));
  }

  function selectPlan(planId: string): void {
    const plan = plans?.find((p) => p.id === planId);
    store.setState((s) => ({
      values: {
        ...s.values,
        plan_id: planId || null,
        monthly_fee: plan && s.values.monthly_fee === 0 ? plan.price : s.values.monthly_fee,
      },
    }));
  }

  async function save(): Promise<void> {
    const input = store.getState().values;
    store.setState({ error: null, busy: true });
    const err = isEdit && id ? await updateClient(id, input) : await createClient(input);
    store.setState({ busy: false });
    if (err) {
      store.setState({ error: err });
      return;
    }
    navigate(-1);
  }

  async function remove(): Promise<void> {
    if (!id) return;
    store.setState({ busy: true });
    const err = await deleteClient(id);
    store.setState({ busy: false, confirmingDelete: false });
    if (err) {
      store.setState({ error: err });
      return;
    }
    navigate(CLIENTS_PATH, { replace: true });
  }

  return {
    values,
    error,
    busy,
    confirmingDelete,
    isEdit,
    title: isEdit ? 'Edit client' : 'New client',
    submitLabel: busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add client',
    roomOptions,
    planOptions,
    accountOptions,
    // One option means the list holds nothing but "No PPPoE account".
    accountHint:
      accounts === undefined
        ? null
        : accounts.length === 0
          ? 'No PPPoE accounts yet — add or import them on the PPPoE tab.'
          : accountOptions.length === 1
            ? 'Every account is already on a client. Free one up, or add a new account on the PPPoE tab.'
            : null,
    durationDays,
    seededExpiry,
    seededExpiryLabel: seededExpiry
      ? `First expiry: ${formatDate(seededExpiry)} (${durationDays} days).`
      : 'Leave empty to start with no expiry until the first payment.',
    setValue,
    selectAccountStatus: (value) => {
      if (isAccountStatus(value)) setValue('account_status', value);
    },
    selectRoom,
    selectPlan,
    setInstalledOn: (dateInputValue) =>
      setValue('installed_at', fromDateInputStart(dateInputValue)),
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
