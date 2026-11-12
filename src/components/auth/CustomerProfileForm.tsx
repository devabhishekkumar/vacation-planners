'use client';
import Link from 'next/link';
import { Check, ArrowRight, LoaderCircle, LockKeyhole, MapPin, Heart } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { CustomerProfile } from '@/lib/auth/customer-profile';
export default function CustomerProfileForm({ profile }: { profile: CustomerProfile }) {
  const [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false),
    [signedOut, setSignedOut] = useState(false);
  const router = useRouter();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const response = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(f.entries())),
      });
      const result = await response.json();
      if (response.status === 401) setSignedOut(true);
      if (!response.ok) throw Error(result.error || 'Could not save your profile.');
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      onChange={() => setSaved(false)}
      className="portal-form customer-profile-form"
      onReset={() => {
        setSaved(false);
        setError('');
      }}
    >
      <div className="customer-form-section-label">
        <span>01</span>
        <h3>Contact information</h3>
      </div>
      <div className="customer-profile-fields">
        <label>
          Full name
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={90}
            required
            defaultValue={profile.name}
          />
        </label>
        <label>
          Login email
          <div className="customer-readonly-input">
            <input
              type="email"
              value={profile.email}
              readOnly
              aria-describedby="profile-email-help"
            />
            <LockKeyhole size={15} aria-hidden="true" />
          </div>
          <small id="profile-email-help">
            Your sign-in email. <Link href="/contact">Contact us</Link> to change it.
          </small>
        </label>
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={28}
            defaultValue={profile.phone}
            placeholder="Include your country code"
          />
        </label>
        <label>
          City
          <input
            name="city"
            autoComplete="address-level2"
            maxLength={90}
            defaultValue={profile.city}
          />
        </label>
      </div>
      <div className="customer-form-section-label customer-form-section-divider">
        <span>02</span>
        <h3>Your travel preferences</h3>
      </div>
      <label>
        <span className="customer-field-title">
          <MapPin size={14} /> Address <small>Optional</small>
        </span>
        <textarea
          name="address"
          autoComplete="street-address"
          rows={3}
          maxLength={400}
          defaultValue={profile.address}
        />
      </label>
      <label>
        <span className="customer-field-title">
          <Heart size={14} /> What makes a great trip for you? <small>Optional</small>
        </span>
        <textarea
          name="preferences"
          rows={4}
          maxLength={1000}
          defaultValue={profile.preferences}
          placeholder="Favourite destinations, hotel preferences or the kind of trips you enjoy"
        />
      </label>
      {error && (
        <p className="portal-error" role="alert">
          {error}{' '}
          {signedOut && (
            <Link href="/login/customer?next=%2Fcustomer%2Fprofile">Sign in again</Link>
          )}
        </p>
      )}
      {saved && (
        <p role="status" className="portal-notice">
          <Check size={17} /> Your profile has been updated.
        </p>
      )}
      <div className="customer-profile-actions">
        <span>Make yourself at home. Update these anytime.</span>
        <div>
          <button type="reset" className="customer-reset-button" disabled={saving}>
            Reset changes
          </button>
          <button disabled={saving} className="customer-save-button">
            {saving ? <LoaderCircle className="customer-spin" size={16} /> : <Check size={16} />}{' '}
            {saving ? 'Saving...' : 'Save profile'} {!saving && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </form>
  );
}
