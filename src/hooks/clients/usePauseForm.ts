import { type FormEvent } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuthStore } from '@/stores/auth/Auth.store';
import { setPaused } from '@/services/payments/Payments.service';
import {
  daysUntil,
  formatDate,
  formatDateTime,
  formatDuration,
  pluralize,
} from '@/common/utils/Format.utils';
import type { Client } from '@/types/clients/Clients.types';

interface PauseFormState {
  note: string;
  busy: boolean;
}

export interface PauseForm {
  readonly note: string;
  readonly busy: boolean;
  readonly isPaused: boolean;
  readonly title: string;
  readonly submitLabel: string;
  readonly notePlaceholder: string;
  /** When the pause started, and how long it has run. Empty while running. */
  readonly pausedSinceLabel: string;
  readonly pausedDurationLabel: string;
  /** Expiry a resume would produce, with the frozen time credited back. */
  readonly resumedExpiryLabel: string;
  readonly hasExpiry: boolean;
  /** Subscription time a pause would freeze, e.g. "12 days". */
  readonly remainingLabel: string;
  readonly expiresOnLabel: string;
  setNote: (value: string) => void;
  submit: (event: FormEvent) => void;
}

function secondsSince(isoTimestamp: string | null): number {
  if (isoTimestamp === null) return 0;
  return Math.max(0, (Date.now() - new Date(isoTimestamp).getTime()) / 1000);
}

/** The expiry a resume restores: what is frozen now, plus the paused time. */
function creditedExpiry(expiresAt: string | null, pausedSeconds: number): string {
  const frozen = new Date(expiresAt ?? Date.now()).getTime();
  return new Date(frozen + pausedSeconds * 1000).toISOString();
}

/**
 * Start or end a vacation pause. Everything the sheet shows is derived here, so
 * the client sees exactly what they keep (pausing) or get back (resuming)
 * before anything is written.
 */
export function usePauseForm(client: Client, onDone: () => void): PauseForm {
  const performedBy = useAuthStore((s) => s.appUser?.id ?? null);

  const store = useInstanceStore<PauseFormState>(() => ({ note: '', busy: false }));
  const { note, busy } = useStore(
    store,
    useShallow((s) => s),
  );

  const isPaused = client.paused_at !== null;
  const pausedSeconds = secondsSince(client.paused_at);
  const remainingDays = daysUntil(client.expires_at);

  async function save(): Promise<void> {
    store.setState({ busy: true });
    await setPaused({
      clientId: client.id,
      paused: !isPaused,
      performedBy,
      note: store.getState().note,
    });
    onDone();
  }

  return {
    note,
    busy,
    isPaused,
    title: isPaused ? 'Resume subscription' : 'Pause subscription',
    submitLabel: busy ? 'Saving…' : isPaused ? 'Resume now' : 'Pause now',
    notePlaceholder: isPaused ? 'Back from vacation' : 'On vacation until the 20th',
    pausedSinceLabel: formatDateTime(client.paused_at),
    pausedDurationLabel: formatDuration(pausedSeconds),
    resumedExpiryLabel: formatDate(creditedExpiry(client.expires_at, pausedSeconds)),
    hasExpiry: client.expires_at !== null,
    remainingLabel:
      remainingDays !== null && remainingDays >= 0 ? pluralize(remainingDays, 'day') : 'time',
    expiresOnLabel: formatDate(client.expires_at),
    setNote: (value) => store.setState({ note: value }),
    submit: (event) => {
      event.preventDefault();
      if (store.getState().busy) return;
      void save();
    },
  };
}
