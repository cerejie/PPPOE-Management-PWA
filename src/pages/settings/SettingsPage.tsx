import { Screen } from '@/common/components/layout/Screen';
import { SectionCard } from '@/common/components/layout/SectionCard';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { ProfileCard } from '@/components/settings/cards/ProfileCard';
import { ManageLink } from '@/components/settings/lists/ManageLink';
import { StaffSection } from '@/components/settings/sections/StaffSection';
import { MikrotikSection } from '@/components/rooms/widgets/MikrotikSection';
import * as styles from '@/styles/pages/settings/SettingsPage.css';
import { MANAGE_LINKS } from '@/constants/settings/ManageLinks.constants';
import { useSettingsPage } from '@/hooks/settings/useSettingsPage';

export function SettingsPage() {
  const vm = useSettingsPage();

  return (
    <>
      <Screen title="Settings">
        <ProfileCard
          user={vm.appUser}
          initials={vm.initials}
          isEditingName={vm.isEditingOwnName}
          onStartEditName={vm.startEditOwnName}
          onStopEditName={vm.stopEditOwnName}
        />

        {vm.isSuperAdmin && (
          <>
            <SectionCard title="Manage">
              {MANAGE_LINKS.map((link) => (
                <ManageLink key={link.to} to={link.to} label={link.label} hint={link.hint} />
              ))}
            </SectionCard>

            <MikrotikSection online={vm.online} />

            <StaffSection />
          </>
        )}

        <button
          type="button"
          disabled={!vm.online}
          onClick={vm.requestSignOut}
          className={styles.signOutButton}
        >
          Sign out
        </button>

        {!vm.online && (
          <p className={styles.signOutHint}>
            Sign out needs a connection — it clears this device, and anything still queued would
            go with it.
          </p>
        )}

        {vm.signOutError && (
          <p role="alert" className={styles.signOutError}>
            {vm.signOutError}
          </p>
        )}
      </Screen>

      {vm.confirmingSignOut && (
        <ConfirmDialog
          title="Sign out?"
          message="Queued changes are pushed first, then cached data on this device is cleared. Anything the server rejects will be lost."
          confirmLabel="Sign out"
          onConfirm={vm.confirmSignOut}
          onCancel={vm.cancelSignOut}
        />
      )}
    </>
  );
}
