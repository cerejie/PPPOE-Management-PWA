// Shared form styling, so every input in the app looks identical and the
// theme tokens are only wired up once.

export const labelClass = 'block text-sm font-medium text-muted';

export const inputClass =
  'block w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-base text-fg placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15';

export const fieldClass = `mt-1.5 ${inputClass}`;

/**
 * Selects need room for the chevron drawn in index.css, and should read as a
 * button rather than a text box.
 */
export const selectClass = `${fieldClass} cursor-pointer truncate pr-11`;

export const primaryButtonClass =
  'flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-accent-gradient px-4 py-3 font-semibold text-white shadow-float transition-opacity active:opacity-80 disabled:opacity-40 disabled:shadow-none';

export const secondaryButtonClass =
  'flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-surface-2 px-4 py-3 font-semibold text-fg transition-opacity active:opacity-70 disabled:opacity-40';

export const dangerButtonClass =
  'flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-danger-soft px-4 py-3 font-semibold text-danger transition-opacity active:opacity-70 disabled:opacity-40';

/** Card surface used for every grouped block of content. */
export const cardClass = 'rounded-3xl bg-surface shadow-card';
