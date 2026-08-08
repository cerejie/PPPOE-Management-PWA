import { SectionCard } from '@/common/components/layout/SectionCard';
import { StaffRow } from '@/components/settings/lists/StaffRow';
import * as form from '@/common/styles/Form.css';
import * as styles from '@/components/settings/sections/StaffSection.css';
import { useStaffSection } from '@/hooks/auth/useStaffSection';

/** Settings → Staff accounts: who can sign in, and adding someone new. */
export function StaffSection() {
  const vm = useStaffSection();
  const staff = vm.staff ?? [];

  return (
    <SectionCard title="Staff accounts">
      {staff.length > 0 && (
        <ul className={styles.list}>
          {staff.map((user) => (
            <StaffRow
              key={user.id}
              user={user}
              isRenaming={vm.renamingId === user.id}
              onStartRename={() => vm.startRename(user.id)}
              onStopRename={vm.stopRename}
            />
          ))}
        </ul>
      )}

      <form onSubmit={vm.submit} className={form.stackTight}>
        <div>
          <label htmlFor="staff-username" className={form.label}>
            Username
          </label>
          <input
            id="staff-username"
            type="text"
            placeholder="lowercase, no spaces"
            required
            autoCapitalize="none"
            autoCorrect="off"
            value={vm.username}
            onChange={(e) => vm.setUsername(e.target.value)}
            className={form.field}
          />
        </div>

        <div>
          <label htmlFor="staff-name" className={form.label}>
            Display name
          </label>
          <input
            id="staff-name"
            type="text"
            required
            value={vm.displayName}
            onChange={(e) => vm.setDisplayName(e.target.value)}
            className={form.field}
          />
        </div>

        <div>
          <label htmlFor="staff-password" className={form.label}>
            Password
          </label>
          <input
            id="staff-password"
            type="password"
            placeholder="min 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            value={vm.password}
            onChange={(e) => vm.setPassword(e.target.value)}
            className={form.field}
          />
        </div>

        {!vm.online && (
          <p className={styles.message.offline}>
            You&apos;re offline — creating a staff account is the one change that cannot be
            queued, because the login itself is created on the server.
          </p>
        )}

        {vm.error && (
          <p role="alert" className={styles.message.error}>
            {vm.error}
          </p>
        )}
        {vm.success && <p className={styles.message.success}>{vm.success}</p>}

        <button
          type="submit"
          disabled={vm.busy || !vm.online}
          className={form.button.secondary}
        >
          {vm.busy ? 'Creating…' : 'Create staff account'}
        </button>
      </form>
    </SectionCard>
  );
}
