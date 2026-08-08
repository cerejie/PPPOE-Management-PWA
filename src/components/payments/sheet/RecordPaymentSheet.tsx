import { Sheet } from '@/common/components/overlays/Sheet';
import { DateField } from '@/common/components/inputs/DateField';
import { SearchSelect } from '@/common/components/inputs/SearchSelect';
import { OfflineNotice } from '@/common/components/notices/OfflineNotice';
import * as form from '@/styles/global/Form.css';
import * as styles from '@/styles/features/payments/sheet/RecordPaymentSheet.css';
import { PAYMENT_METHODS } from '@/constants/payments/RecordPayment.constants';
import { useRecordPaymentForm } from '@/hooks/payments/useRecordPaymentForm';
import { formatDate, formatMoney } from '@/common/utils/Format.utils';
import type { Client } from '@/types/clients/Clients.types';

interface Props {
  /** Preselected client. Omitted on the dashboard, where the operator picks one. */
  client?: Client;
  onClose: () => void;
}

/** Bottom sheet for recording a payment. Works fully offline. */
export function RecordPaymentSheet({ client, onClose }: Props) {
  const vm = useRecordPaymentForm(client, onClose);

  return (
    <Sheet title="Record payment" subtitle={vm.subtitle} onClose={onClose}>
      <form onSubmit={vm.submit} className={form.stack}>
        {!client && (
          <div>
            <label htmlFor="pay-client" className={form.label}>
              Customer
            </label>
            {/* Deliberately not autofocused: opening the sheet should show the
                whole form, not a dropdown over it with the keyboard up. */}
            <SearchSelect
              id="pay-client"
              value={vm.clientId}
              onChange={vm.setClientId}
              options={vm.clientOptions}
              placeholder="Search name or PPPoE username…"
              emptyMessage="No customer matches that search."
            />
          </div>
        )}

        <div>
          <label htmlFor="paid-on" className={form.label}>
            Date paid
          </label>
          <DateField id="paid-on" max={vm.maxPaidOn} value={vm.paidOn} onChange={vm.setPaidOn} />
          <p className={form.hint}>
            Defaults to today. Set it back if the payment is being recorded late — the new expiry
            counts from this date.
          </p>
        </div>

        <div>
          <label htmlFor="amount" className={form.label}>
            Amount
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            autoFocus={client !== undefined}
            value={vm.amount}
            onChange={(e) => vm.setAmount(e.target.value)}
            onBlur={(e) => vm.blurAmount(e.target.value)}
            className={styles.amountInput}
          />
          {vm.selected && (
            <p className={form.hint}>
              {vm.due > 0
                ? `Prefilled from ${vm.planName ?? 'their monthly fee'} (${formatMoney(vm.due)}). Edit it if they paid a different amount.`
                : 'This customer has no plan price or monthly fee set — enter the amount manually.'}
            </p>
          )}
        </div>

        {vm.selected && (
          <div className={styles.preview}>
            <div className={styles.previewRow}>
              <span className={styles.previewLabel}>Expires now</span>
              <span className={styles.previewValue}>{formatDate(vm.selected.expires_at)}</span>
            </div>
            <div className={styles.previewRowSpaced}>
              <span className={styles.previewLabel}>After this payment</span>
              <span className={styles.previewValueNext}>
                {vm.previewExpiry ? formatDate(vm.previewExpiry) : '—'}
              </span>
            </div>
            {vm.selected.paused_at !== null && (
              <p className={styles.pausedNote}>
                Paused — the clock stays frozen at the pause date, so the extension starts there.
              </p>
            )}
          </div>
        )}

        <div>
          <p className={form.label}>Method</p>
          <div className={styles.methodGrid}>
            {PAYMENT_METHODS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => vm.setMethod(option.value)}
                aria-pressed={vm.method === option.value}
                className={
                  vm.method === option.value
                    ? styles.methodButton.active
                    : styles.methodButton.idle
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="pay-note" className={form.label}>
            Note <span className={form.optional}>(optional)</span>
          </label>
          <input
            id="pay-note"
            type="text"
            value={vm.note}
            onChange={(e) => vm.setNote(e.target.value)}
            className={form.field}
          />
        </div>

        {vm.error && (
          <p role="alert" className={form.errorAlert}>
            {vm.error}
          </p>
        )}

        <OfflineNotice message="the payment is queued and synced automatically later." />

        <button type="submit" disabled={vm.busy} className={form.button.primary}>
          {vm.busy ? 'Saving…' : 'Save payment'}
        </button>
      </form>
    </Sheet>
  );
}
