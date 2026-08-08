import { useEffect, useMemo, type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import type { SearchSelectOption } from '@/common/components/inputs/SearchSelect';
import { formatMoney, fromDateInputStart, todayInputValue } from '@/common/utils/Format.utils';
import { sanitiseAmountInput, formatAmountOnBlur } from '@/utils/payments/PaymentAmount.utils';
import {
  ALL_CLIENTS,
  DEFAULT_DURATION_DAYS,
  DEFAULT_PAYMENT_METHOD,
} from '@/constants/payments/RecordPayment.constants';
import { useAuth } from '@/stores/auth/Auth.store';
import { useClients } from '@/hooks/clients/useClients';
import { usePlans } from '@/hooks/plans/usePlans';
import { nextExpiry } from '@/api/sync/syncEngine';
import { recordPayment } from '@/services/payments/Payments.service';
import type { Client } from '@/types/clients/Clients.types';

interface RecordPaymentFormState {
  clientId: string;
  amount: string;
  paidOn: string;
  method: string;
  note: string;
  error: string | null;
  busy: boolean;
}

export interface RecordPaymentForm {
  readonly clientId: string;
  readonly amount: string;
  readonly paidOn: string;
  readonly method: string;
  readonly note: string;
  readonly error: string | null;
  readonly busy: boolean;
  /** Options for the customer picker, empty until Dexie has answered. */
  readonly clientOptions: readonly SearchSelectOption[];
  /** The client being paid for — the prop, or whoever the operator picked. */
  readonly selected: Client | undefined;
  /** What the plan or monthly fee says is owed; 0 when neither is set. */
  readonly due: number;
  /** Plan name for the "prefilled from" hint, null when they are on no plan. */
  readonly planName: string | null;
  /** Expiry this payment would produce, null while the form is incomplete. */
  readonly previewExpiry: string | null;
  readonly subtitle: string;
  readonly maxPaidOn: string;
  setClientId: (value: string) => void;
  setAmount: (raw: string) => void;
  blurAmount: (raw: string) => void;
  setPaidOn: (value: string) => void;
  setMethod: (value: string) => void;
  setNote: (value: string) => void;
  submit: (event: FormEvent) => void;
}

/**
 * Everything the record-payment form knows: field state, the derived expiry
 * preview, and the write. The sheet renders this and nothing else.
 */
export function useRecordPaymentForm(client: Client | undefined, onDone: () => void): RecordPaymentForm {
  const { appUser } = useAuth();
  const clients = useClients(ALL_CLIENTS);
  const plans = usePlans();

  const store = useInstanceStore<RecordPaymentFormState>(() => ({
    clientId: client?.id ?? '',
    amount: '',
    paidOn: todayInputValue(),
    method: DEFAULT_PAYMENT_METHOD,
    note: '',
    error: null,
    busy: false,
  }));

  const { clientId, amount, paidOn, method, note, error, busy } = useStore(
    store,
    useShallow((s) => s),
  );

  const clientOptions = useMemo<readonly SearchSelectOption[]>(
    () =>
      (clients ?? []).map((c) => ({
        value: c.id,
        label: c.full_name,
        hint: c.pppoe_username,
      })),
    [clients],
  );

  const selected = client ?? clients?.find((c) => c.id === clientId);
  const plan = plans?.find((p) => p.id === selected?.plan_id);

  // The plan price is the subscription amount; monthly_fee covers clients on no
  // plan (or on one since archived). `??` would not fall through on a 0 price,
  // which is why this tests the value rather than nullishness.
  const due = plan && plan.price > 0 ? plan.price : (selected?.monthly_fee ?? 0);

  // Plans arrive from Dexie a tick after clients do. Prefilling from
  // monthly_fee in that gap would flash the wrong number and could overwrite an
  // amount the operator had already started typing.
  const awaitingPlan = plans === undefined && selected?.plan_id != null;

  const paidAt = fromDateInputStart(paidOn);
  const parsed = Number(amount);

  const previewExpiry =
    selected && paidAt && Number.isFinite(parsed) && parsed > 0
      ? nextExpiry({
          expiresAt: selected.expires_at,
          pausedAt: selected.paused_at,
          paidAt,
          durationDays: plan?.duration_days ?? DEFAULT_DURATION_DAYS,
        })
      : null;

  const subtitle = selected
    ? plan
      ? `${selected.full_name} · ${plan.name} (${formatMoney(plan.price)} / ${plan.duration_days}d)`
      : selected.full_name
    : 'Pick the customer and the date the money came in.';

  // Choosing a customer fills in what they owe; the operator can still edit it.
  useEffect(() => {
    if (awaitingPlan) return;
    store.setState({ amount: due > 0 ? due.toFixed(2) : '' });
  }, [store, selected?.id, due, awaitingPlan]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (store.getState().busy) return;
    if (!selected) {
      store.setState({ error: 'Select a customer.' });
      return;
    }
    if (!paidAt) {
      store.setState({ error: 'Pick the date the payment was received.' });
      return;
    }
    if (!Number.isFinite(parsed) || parsed === 0) {
      store.setState({ error: 'Enter a valid amount (negative for a correction).' });
      return;
    }

    store.setState({ error: null, busy: true });
    void recordPayment({
      clientId: selected.id,
      amount: parsed,
      paidAt,
      method,
      note: store.getState().note.trim() || null,
      recordedBy: appUser?.id ?? null,
    }).then(onDone);
  }

  return {
    clientId,
    amount,
    paidOn,
    method,
    note,
    error,
    busy,
    clientOptions,
    selected,
    due,
    planName: plan?.name ?? null,
    previewExpiry,
    subtitle,
    maxPaidOn: todayInputValue(),
    setClientId: (value) => store.setState({ clientId: value }),
    setAmount: (raw) => store.setState({ amount: sanitiseAmountInput(raw) }),
    blurAmount: (raw) => store.setState({ amount: formatAmountOnBlur(raw) }),
    setPaidOn: (value) => store.setState({ paidOn: value }),
    setMethod: (value) => store.setState({ method: value }),
    setNote: (value) => store.setState({ note: value }),
    submit,
  };
}
