import { ExpiryBadge } from '@/common/components/badges/ExpiryBadge';
import * as styles from '@/styles/pages/clients/cards/ClientProfileCard.css';
import { CLIENT_PROFILE_FIELDS } from '@/constants/clients/ClientProfile.constants';
import { formatDate } from '@/common/utils/Format.utils';
import type { Client } from '@/types/clients/Clients.types';

interface Props {
  client: Client;
  roomLabel: string;
  planLabel: string;
  isPaused: boolean;
}

/** Read-only profile facts: relations, fee, account state and expiry. */
export function ClientProfileCard({ client, roomLabel, planLabel, isPaused }: Props) {
  const context = { client, roomLabel, planLabel };

  return (
    <section className={styles.card}>
      {CLIENT_PROFILE_FIELDS.map((field) => (
        <div key={field.label} className={styles.row}>
          <span className={styles.label}>{field.label}</span>
          <span className={styles.value}>{field.valueOf(context)}</span>
        </div>
      ))}

      <div className={styles.row}>
        <span className={styles.label}>{isPaused ? 'Expires (frozen)' : 'Expires'}</span>
        <span className={styles.expiryValue}>
          {formatDate(client.expires_at)}
          <ExpiryBadge expiresAt={client.expires_at} pausedAt={client.paused_at} />
        </span>
      </div>

      {client.notes && <p className={styles.notes}>{client.notes}</p>}
    </section>
  );
}
