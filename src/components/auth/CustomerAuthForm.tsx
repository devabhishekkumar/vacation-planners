'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
export default function CustomerAuthForm({
  signup = false,
  next,
}: {
  signup?: boolean;
  next: string;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      const response = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: signup ? 'signup' : 'login',
          name: f.get('name'),
          email: f.get('email'),
          password: f.get('password'),
          confirm: f.get('confirm'),
          next,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Could not sign in.');
      window.location.assign(result.next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.');
      setBusy(false);
    }
  }
  return (
    <>
      <form className="portal-form" onSubmit={submit}>
        {signup && (
          <label>
            Full name
            <input name="name" autoComplete="name" required minLength={2} maxLength={90} />
          </label>
        )}
        <label>
          Email address
          <input name="email" type="email" autoComplete="username" required maxLength={254} />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            required
            minLength={signup ? 12 : undefined}
            maxLength={128}
          />
        </label>
        {signup && (
          <>
            <small>Use 12 to 128 characters.</small>
            <label>
              Confirm password
              <input
                name="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
            </label>
          </>
        )}
        {error && (
          <p className="portal-error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy}>
          {busy ? 'Please wait...' : signup ? 'Create account & continue' : 'Sign in & continue'}
        </button>
      </form>
      <p>
        {signup ? 'Already have an account?' : 'New to Vacation Planners?'}{' '}
        <Link href={(signup ? '/login/customer' : '/signup') + '?next=' + encodeURIComponent(next)}>
          {signup ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
      <p>
        <Link href="/contact">Need help accessing your account?</Link>
      </p>
    </>
  );
}
