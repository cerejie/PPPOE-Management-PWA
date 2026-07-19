import { useState, type FormEvent } from 'react';
import { fieldClass, labelClass, primaryButtonClass } from '@/components/formStyles';
import { useAuth } from './AuthContext';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const err = await signIn(identifier, password);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-canvas px-6 pb-safe-bottom pt-safe-top">
      <div className="mx-auto w-full max-w-app">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-gradient text-3xl shadow-float">
            📶
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">PPPoE Manager</h1>
          <p className="mt-1.5 text-sm text-muted">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className={labelClass}>
              Username or email
            </label>
            <input
              id="identifier"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={fieldClass}
              placeholder="username"
            />
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted">
          Staff sign in with their username. Admin signs in with email.
        </p>
      </div>
    </div>
  );
}
