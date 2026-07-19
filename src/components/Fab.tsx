interface FabProps {
  onClick: () => void;
  /** Accessible name, e.g. "Add client". */
  label: string;
}

/**
 * Floating add button. Pinned inside the same max-w-app column as the content
 * so it lines up with the list edge on wide screens, and lifted clear of the
 * floating tab bar.
 */
export function Fab({ onClick, label }: FabProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="flex w-full max-w-app justify-end px-4 pb-above-tabbar">
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-gradient text-white shadow-float transition-transform active:scale-90"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
