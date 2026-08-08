import * as styles from '@/styles/pages/clients/buttons/ClientSortButton.css';
import { CLIENT_SORT_LABELS, type ClientSort } from '@/constants/clients/ClientFilters.constants';

interface Props {
  sort: ClientSort;
  onToggle: () => void;
}

/**
 * Icon-only toggle for the client list order. The glyph flips vertically so the
 * direction is visible at a glance; the label states it for screen readers.
 */
export function ClientSortButton({ sort, onToggle }: Props) {
  const label = CLIENT_SORT_LABELS[sort];

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`${label}. Tap to change order.`}
      title={label}
      className={sort === 'oldest' ? styles.button.active : styles.button.idle}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className={sort === 'oldest' ? styles.glyph.flipped : styles.glyph.upright}
      >
        <path
          d="M4 7h16M7 12h10M10 17h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
