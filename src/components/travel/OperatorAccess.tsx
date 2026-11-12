'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
export default function OperatorAccess({
  configured,
  title = 'Trip management',
}: {
  configured: boolean;
  title?: string;
}) {
  const [error, setError] = useState(''),
    [saving, setSaving] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/travel/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: form.get('key') }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="tm-card tm-access">
      <span className="tm-eyebrow">PRIVATE OPERATIONS</span>
      <h1>{title}</h1>
      <p>
        Sign in as a travel operator to manage website content, bookings and private travel
        documents.
      </p>
      {!configured ? (
        <p role="alert">
          Travel operator access is not configured. Set TRAVEL_ADMIN_KEY in the server environment
          to a random secret of at least 24 characters, then restart the server. See
          TRAVEL_MANAGEMENT.md.
        </p>
      ) : (
        <form onSubmit={submit}>
          <label>
            Operator access key
            <input
              name="key"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1000}
            />
          </label>
          {error && (
            <p role="alert" className="tm-error">
              {error}
            </p>
          )}
          <button className="tm-button" disabled={saving}>
            {saving ? 'Signing in…' : 'Unlock trip management'}
          </button>
        </form>
      )}
    </section>
  );
}
