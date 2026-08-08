import * as form from '@/common/styles/Form.css';
import * as styles from '@/pages/LoginPage.css';
import { useLoginForm } from '@/hooks/auth/useLoginForm';

export function LoginPage() {
  const vm = useLoginForm();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logo}>📶</div>
          <h1 className={styles.title}>PPPoE Manager</h1>
          <p className={styles.tagline}>Sign in to continue</p>
        </div>

        <form onSubmit={vm.submit} className={form.stack}>
          <div>
            <label htmlFor="identifier" className={form.label}>
              Username or email
            </label>
            <input
              id="identifier"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
              value={vm.identifier}
              onChange={(e) => vm.setIdentifier(e.target.value)}
              className={form.field}
              placeholder="username"
            />
          </div>

          <div>
            <label htmlFor="password" className={form.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={vm.password}
              onChange={(e) => vm.setPassword(e.target.value)}
              className={form.field}
              placeholder="••••••••"
            />
          </div>

          {!vm.online && (
            <p className={styles.offlineNotice}>
              You&apos;re offline — signing in is the one thing that needs a connection. Once you
              have signed in on this device, the app keeps working without one.
            </p>
          )}

          {vm.error && (
            <p role="alert" className={form.errorAlert}>
              {vm.error}
            </p>
          )}

          <button type="submit" disabled={!vm.canSubmit} className={form.button.primary}>
            {vm.busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.footnote}>
          Staff sign in with their username. Admin signs in with email.
        </p>
      </div>
    </div>
  );
}
