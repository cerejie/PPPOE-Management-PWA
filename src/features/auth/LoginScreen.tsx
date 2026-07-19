import { useState, type FormEvent } from 'react';
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
    <div className="flex min-h-dvh flex-col justify-center bg-slate-50 px-6 pb-safe-bottom pt-safe-top">
      <div className="mx-auto w-full max-w-app">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl text-white">
            📶
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PPPoE Manager</h1>
          <p className="mt-1 text-sm text-muted">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-slate-700">
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
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              placeholder="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="min-h-[48px] w-full rounded-xl bg-accent px-4 py-3 text-base font-semibold text-white active:opacity-80 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Staff sign in with their username. Admin signs in with email.
        </p>
      </div>
    </div>
  );
}
