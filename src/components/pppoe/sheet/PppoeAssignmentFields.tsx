import { SearchSelect } from '@/common/components/inputs/SearchSelect';
import * as form from '@/styles/global/Form.css';
import * as styles from '@/styles/pages/pppoe/sheet/PppoeAssignmentFields.css';
import type { PppoeAccountForm } from '@/hooks/pppoe/usePppoeAccountForm';

/**
 * Who is on the line, and — only while nobody is — whether it is up.
 *
 * The toggle disappears once a client holds the account because their payments
 * and disconnects own that state from then on; leaving it would offer a control
 * the next sync would silently overrule.
 */
export function PppoeAssignmentFields({ vm }: { vm: PppoeAccountForm }) {
  return (
    <>
      <div>
        <label htmlFor="pppoe-client" className={form.label}>
          Client <span className={form.optional}>(optional)</span>
        </label>
        <SearchSelect
          id="pppoe-client"
          value={vm.clientId}
          onChange={vm.setClientId}
          options={vm.clientOptions}
          placeholder="Search clients"
          emptyMessage="No clients match."
        />
        <p className={form.hint}>{vm.lineStateHint}</p>
      </div>

      {!vm.assigned && (
        <label htmlFor="pppoe-enabled" className={styles.toggleRow}>
          <span>
            <span className={styles.toggleLabel}>Enabled</span>
            <span className={styles.toggleHint}>
              A disabled line cannot dial in, and any live session is dropped.
            </span>
          </span>
          <input
            id="pppoe-enabled"
            type="checkbox"
            checked={!vm.disabled}
            onChange={(e) => vm.setDisabled(!e.target.checked)}
            className={styles.toggleInput}
          />
        </label>
      )}
    </>
  );
}
