import { queueEntityWrite, settleWrite } from '@/api/sync/syncEngine';

// Profile writes. Like every other write in the app these go through the
// outbox, so renaming yourself offline behaves the same as renaming a room.

/**
 * Rename a user.
 *
 * Only display_name is writable: `username` derives the synthetic login email,
 * so changing it would lock that person out of their own account. The server
 * enforces the same narrowing — RLS grants a user their own row and
 * guard_app_user_self_update() rejects any other column — with SuperAdmin
 * exempt so they can rename staff.
 */
export async function renameUser(id: string, displayName: string): Promise<string | null> {
  const name = displayName.trim();
  if (!name) return 'A display name is required.';

  const uuid = await queueEntityWrite({
    table: 'app_users',
    op: 'update',
    row_id: id,
    values: { display_name: name, updated_at: new Date().toISOString() },
  });
  return settleWrite(uuid);
}
