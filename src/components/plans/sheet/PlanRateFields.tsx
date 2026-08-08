import * as form from '@/styles/global/Form.css';
import * as styles from '@/styles/pages/plans/sheet/PlanFormSheet.css';
import type { PlanForm } from '@/hooks/plans/usePlanForm';

/** What the plan costs and what it advertises. */
export function PlanRateFields({ vm }: { vm: PlanForm }) {
  return (
    <div className={styles.pairGrid}>
      <div>
        <label htmlFor="plan-price" className={form.label}>
          Price (₱)
        </label>
        <input
          id="plan-price"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          value={vm.price}
          onChange={(e) => vm.setPrice(e.target.value)}
          placeholder="0.00"
          className={form.field}
        />
      </div>

      <div>
        <label htmlFor="plan-mbps" className={form.label}>
          Speed (Mbps)
        </label>
        <input
          id="plan-mbps"
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          required
          value={vm.mbps}
          onChange={(e) => vm.setMbps(e.target.value)}
          placeholder="50"
          className={form.field}
        />
      </div>
    </div>
  );
}
