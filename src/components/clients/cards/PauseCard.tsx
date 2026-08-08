import * as styles from '@/styles/pages/clients/cards/PauseCard.css';
import { formatDuration } from '@/common/utils/Format.utils';

interface Props {
  isPaused: boolean;
  /** How long the clock has been frozen; ignored while running. */
  pausedSeconds: number;
  onOpenPauseSheet: () => void;
}

/** Vacation pause: freezes the expiry clock while the room is empty. */
export function PauseCard({ isPaused, pausedSeconds, onOpenPauseSheet }: Props) {
  const tone = isPaused ? 'paused' : 'running';

  return (
    <section className={styles.card[tone]}>
      <div className={styles.row}>
        <div className={styles.text}>
          <p className={styles.title[tone]}>
            {isPaused ? 'Subscription paused' : 'Subscription running'}
          </p>
          <p className={styles.description}>
            {isPaused
              ? `Frozen ${formatDuration(pausedSeconds)} ago — resuming adds that back to the expiry.`
              : 'Pause to freeze the remaining days while the room is empty.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPauseSheet}
          className={styles.action[isPaused ? 'resume' : 'pause']}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </section>
  );
}
