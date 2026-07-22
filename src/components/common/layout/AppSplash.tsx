/**
 * Shown while the session is being restored. Reuses the login screen's brand
 * tile so the splash resolves into that screen rather than cutting to it, and
 * animates as a signal meter — the app's own subject.
 */
export function AppSplash() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh flex-col items-center justify-center bg-canvas"
    >
      <div className="relative">
        <div
          aria-hidden
          className="animate-halo absolute inset-0 rounded-3xl bg-accent-gradient blur-xl"
        />

        <div className="relative flex h-16 w-16 items-end justify-center gap-1.5 rounded-3xl bg-accent-gradient p-4 shadow-float">
          <span className="animate-signal h-2 w-1.5 rounded-full bg-white/95" />
          <span className="animate-signal h-3.5 w-1.5 rounded-full bg-white/95 [animation-delay:130ms]" />
          <span className="animate-signal h-5 w-1.5 rounded-full bg-white/95 [animation-delay:260ms]" />
          <span className="animate-signal h-7 w-1.5 rounded-full bg-white/95 [animation-delay:390ms]" />
        </div>
      </div>

      <p className="mt-6 text-sm font-semibold tracking-tight text-fg">PPPoE Manager</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}
