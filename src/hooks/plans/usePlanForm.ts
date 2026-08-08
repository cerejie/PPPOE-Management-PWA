import { type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { createPlan, softDeletePlan, updatePlan, type PlanInput } from '@/services/plans/Plans.service';
import { fromDateInputValue, toDateInputValue } from '@/common/utils/Format.utils';
import type { Plan } from '@/types/plans/Plans.types';

/** Numbers are held as strings so the inputs can be cleared while typing. */
interface PlanFormState {
  name: string;
  price: string;
  durationDays: string;
  mbps: string;
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
  readonly validUntil: string;
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
      valid_until: fromDateInputValue(state.validUntil),
    },
  };
}

export function usePlanForm(plan: Plan | undefined, onDone: () => void): PlanForm {
  const isEdit = plan !== undefined;

  const store = useInstanceStore<PlanFormState>(() => ({
    name: plan?.name ?? '',
    price: plan ? String(plan.price) : '',
    durationDays: plan ? String(plan.duration_days) : '30',
    mbps: plan ? String(plan.mbps) : '',
    validUntil: toDateInputValue(plan?.valid_until ?? null),
    error: null,
    busy: false,
    confirmingDelete: false,
  }));

  const { name, price, durationDays, mbps, validUntil, error, busy, confirmingDelete } = useStore(
    store,
    useShallow((s) => s),
  );

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

  return {
    name,
    price,
    durationDays,
    mbps,
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
