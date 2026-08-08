import { Link } from 'react-router-dom';
import { StatusDot } from '@/common/components/badges/StatusDot';
import { ExpiryBadge } from '@/common/components/badges/ExpiryBadge';
import * as styles from '@/components/dashboard/lists/ExpiringClientRow.css';
import { formatDate } from '@/common/utils/Format.utils';
import type { Client } from '@/types/clients/Clients.types';

interface Props {
  client: Client;
  to: string;
}

/** One entry in the dashboard's "soonest expirations" list. */
export function ExpiringClientRow({ client, to }: Props) {
  return (
    <li>
      <Link to={to} className={styles.link}>
        <div className={styles.identity}>
          <StatusDot status={client.connection_status} />
          <div className={styles.text}>
            <p className={styles.name}>{client.full_name}</p>
            <p className={styles.meta}>{formatDate(client.expires_at)}</p>
          </div>
        </div>
        <ExpiryBadge expiresAt={client.expires_at} pausedAt={client.paused_at} />
      </Link>
    </li>
  );
}
