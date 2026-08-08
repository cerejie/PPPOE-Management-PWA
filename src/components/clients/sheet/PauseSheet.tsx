import { Sheet } from '@/common/components/overlays/Sheet';
import { OfflineNotice } from '@/common/components/notices/OfflineNotice';
import * as form from '@/common/styles/Form.css';
import { usePauseForm } from '@/hooks/clients/usePauseForm';
import type { Client } from '@/types/clients/Clients.types';

interface Props {
  client: Client;
  onClose: () => void;
}

/** Start or end a vacation pause, stating its effect before anything is written. */
export function PauseSheet({ client, onClose }: Props) {
  const vm = usePauseForm(client, onClose);

  return (
    <Sheet title={vm.title} subtitle={client.full_name} onClose={onClose}>
      <form onSubmit={vm.submit} className={form.stack}>
        <div className={form.infoPanel}>
          {vm.isPaused ? (
            <>
              <p>
                Paused since <span className={form.emphasis}>{vm.pausedSinceLabel}</span> (
                {vm.pausedDurationLabel}).
              </p>
              <p className={form.paragraphGap}>
                Resuming credits that time back — the new expiry becomes{' '}
                <span className={form.emphasis}>{vm.resumedExpiryLabel}</span>, and the line is
                reconnected.
              </p>
            </>
          ) : (
            <>
              <p>
                {vm.hasExpiry ? (
                  <>
                    The remaining <span className={form.emphasis}>{vm.remainingLabel}</span>{' '}
                    (through {vm.expiresOnLabel}) is frozen and given back in full when they
                    return.
                  </>
                ) : (
                  'This client has no expiry date, so there is no subscription time to freeze.'
                )}
              </p>
              <p className={form.paragraphGap}>
                The line is disconnected while paused. Payments taken during the pause still
                count and extend the frozen expiry.
              </p>
            </>
          )}
        </div>

        <div>
          <label htmlFor="pause-note" className={form.label}>
            Reason <span className={form.optional}>(optional)</span>
          </label>
          <input
            id="pause-note"
            type="text"
            value={vm.note}
            onChange={(e) => vm.setNote(e.target.value)}
            placeholder={vm.notePlaceholder}
            className={form.field}
          />
        </div>

        <OfflineNotice />

        <button type="submit" disabled={vm.busy} className={form.button.primary}>
          {vm.submitLabel}
        </button>
      </form>
    </Sheet>
  );
}
