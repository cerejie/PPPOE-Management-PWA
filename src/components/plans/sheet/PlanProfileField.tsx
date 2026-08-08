import { SearchSelect } from '@/common/components/inputs/SearchSelect';
import * as form from '@/styles/global/Form.css';
import type { PlanForm } from '@/hooks/plans/usePlanForm';

/**
 * The RouterOS profile that actually limits bandwidth.
 *
 * Separate from "Speed (Mbps)" on purpose: that number is what the plan is sold
 * as, this is what the router enforces on every secret assigned to it. Picked
 * from the router's own list so it cannot be a name that does not exist.
 */
export function PlanProfileField({ vm }: { vm: PlanForm }) {
  return (
    <div>
      <label htmlFor="plan-profile" className={form.label}>
        Bandwidth profile <span className={form.optional}>(optional)</span>
      </label>
      <SearchSelect
        id="plan-profile"
        value={vm.profile}
        onChange={vm.setProfile}
        options={vm.profileOptions}
        placeholder="Search profiles"
        emptyMessage="No profiles match."
      />
      <p className={form.hint}>
        {vm.profileHint ??
          'Applied to every client on this plan the next time their line syncs.'}
      </p>
    </div>
  );
}
