import { useMemo, type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { usePppoeProfiles } from '@/hooks/pppoe/usePppoeProfiles';
import { createPlan, softDeletePlan, updatePlan, type PlanInput } from '@/services/plans/Plans.service';
import { fromDateInputValue, toDateInputValue } from '@/common/utils/Format.utils';
import { NO_PROFILE_LABEL } from '@/constants/pppoe/PppoeAccounts.constants';
import type { SearchSelectOption } from '@/common/components/inputs/SearchSelect';
import type { Plan } from '@/types/plans/Plans.types';

/** Numbers are held as strings so the inputs can be cleared while typing. */
interface PlanFormState {
  name: string;
  price: string;
  durationDays: string;
  mbps: string;
  profile: string;
  validUntil: string;
  error: string | null;
  busy: boolean;
  confirmingDelete: boolean;
}

export interface PlanForm {
  readonly name: string;
  readonly price: string;
  readonly durationDays: string;
  readonly mbps: string;
  readonly profile: string;
  readonly validUntil: string;
  /** The router's profiles, plus whatever this plan already names. */
  readonly profileOptions: readonly SearchSelectOption[];
  /** Why the profile list is empty, or what the chosen one does. Null if neither. */
  readonly profileHint: string | null;
  readonly error: string | null;
  readonly busy: boolean;
  readonly confirmingDelete: boolean;
  readonly isEdit: boolean;
  readonly title: string;
  readonly subtitle: string;
  readonly submitLabel: string;
  readonly deleteMessage: string;
  setName: (value: string) => void;
  setPrice: (value: string) => void;
  setDurationDays: (value: string) => void;
  setMbps: (value: string) => void;
  setProfile: (value: string) => void;
  setValidUntil: (value: string) => void;
  submit: (event: FormEvent) => void;
  requestDelete: () => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
}

type ParsedPlan = { readonly input: PlanInput } | { readonly error: string };

/** Parses and validates the raw strings; the message is what the sheet shows. */
function parsePlan(state: PlanFormState): ParsedPlan {
  const price = Number(state.price);
  const durationDays = Number(state.durationDays);
  const mbps = Number(state.mbps);

  if (!Number.isFinite(price) || price < 0) return { error: 'Enter a price of 0 or more.' };
  if (!Number.isInteger(durationDays) || durationDays < 1) {
    return { error: 'Validity must be at least 1 day.' };
  }
  if (!Number.isInteger(mbps) || mbps < 0) {
    return { error: 'Speed must be a whole number of Mbps.' };
  }

  return {
    input: {
      name: state.name,
      price,
      duration_days: durationDays,
      mbps,
      profile: state.profile || null,
      valid_until: fromDateInputValue(state.validUntil),
    },
  };
}

export function usePlanForm(plan: Plan | undefined, onDone: () => void): PlanForm {
  const isEdit = plan !== undefined;
  const profiles = usePppoeProfiles();

  const store = useInstanceStore<PlanFormState>(() => ({
    name: plan?.name ?? '',
    price: plan ? String(plan.price) : '',
    durationDays: plan ? String(plan.duration_days) : '30',
    mbps: plan ? String(plan.mbps) : '',
    profile: plan?.profile ?? '',
    validUntil: toDateInputValue(plan?.valid_until ?? null),
    error: null,
    busy: false,
    confirmingDelete: false,
  }));

  const { name, price, durationDays, mbps, profile, validUntil, error, busy, confirmingDelete } =
    useStore(
      store,
      useShallow((s) => s),
    );

  /**
   * A name the router no longer has is still offered, so opening a plan does
   * not silently blank its profile. It renders as "missing from the router",
   * which is the honest state — the plan is pointing at nothing.
   */
  const profileOptions = useMemo<readonly SearchSelectOption[]>(() => {
    const known = profiles ?? [];
    const stale = profile && !known.some((p) => p.name === profile);

    return [
      { value: '', label: NO_PROFILE_LABEL },
      ...known.map((p) => ({
        value: p.name,
        label: p.name,
        hint: p.rate_limit ?? 'no rate limit',
      })),
      ...(stale ? [{ value: profile, label: profile, hint: 'missing from the router' }] : []),
    ];
  }, [profiles, profile]);

  async function save(): Promise<void> {
    const parsed = parsePlan(store.getState());
    if ('error' in parsed) {
      store.setState({ error: parsed.error });
      return;
    }

    store.setState({ error: null, busy: true });
    const err = plan ? await updatePlan(plan.id, parsed.input) : await createPlan(parsed.input);
    store.setState({ busy: false });
    if (err) {
      store.setState({ error: err });
      return;
    }
    onDone();
  }

  async function remove(): Promise<void> {
    if (!plan) return;
    store.setState({ error: null, busy: true });
    const err = await softDeletePlan(plan.id);
    store.setState({ busy: false, confirmingDelete: false });
    if (err) {
      store.setState({ error: err });
      return;
    }
    onDone();
  }

  const chosenProfile = profiles?.find((p) => p.name === profile);

  return {
    name,
    price,
    durationDays,
    mbps,
    profile,
    profileOptions,
    profileHint:
      profiles !== undefined && profiles.length === 0
        ? 'No profiles yet — import them from the router on the PPPoE tab.'
        : chosenProfile?.rate_limit
          ? `Clients on this plan get ${chosenProfile.rate_limit} on the router.`
          : null,
    validUntil,
    error,
    busy,
    confirmingDelete,
    isEdit,
    title: isEdit ? 'Edit plan' : 'New plan',
    subtitle: plan?.name ?? 'Plans set the price, speed and billing period.',
    submitLabel: busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add plan',
    deleteMessage: plan
      ? `"${plan.name}" will be removed from the app. Past payments keep their history. This is refused if clients are still on the plan.`
      : '',
    setName: (value) => store.setState({ name: value }),
    setPrice: (value) => store.setState({ price: value }),
    setDurationDays: (value) => store.setState({ durationDays: value }),
    setMbps: (value) => store.setState({ mbps: value }),
    setProfile: (value) => store.setState({ profile: value }),
    setValidUntil: (value) => store.setState({ validUntil: value }),
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
