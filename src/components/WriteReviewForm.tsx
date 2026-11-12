'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { CheckCircle2, Send, Star } from 'lucide-react';
export default function WriteReviewForm({ name }: { name: string }) {
  const [rating, setRating] = useState(5),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [done, setDone] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: f.get('destination'),
          rating,
          body: f.get('body'),
          permission: f.get('permission') === 'on',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Could not submit your review.');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your review.');
    } finally {
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="write-review-success" role="status">
        <CheckCircle2 size={44} />
        <h2>Thank you for sharing your story.</h2>
        <p>
          Your review has been submitted for approval. It will appear on the website once published
          by our team.
        </p>
        <Link href="/reviews" className="btn btn-primary">
          Back to reviews
        </Link>
      </div>
    );
  return (
    <form className="enquiry-form write-review-form" onSubmit={submit}>
      <label>
        Your name
        <input value={name} readOnly />
      </label>
      <fieldset className="write-review-rating">
        <legend>How was your experience?</legend>
        <div>
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                aria-label={value + ' out of 5 stars'}
              />
              <Star size={29} fill={value <= rating ? 'currentColor' : 'none'} aria-hidden="true" />
            </label>
          ))}
        </div>
        <span>{rating} out of 5</span>
      </fieldset>
      <label>
        Trip or destination (optional)
        <input name="destination" maxLength={120} placeholder="Where did you travel?" />
      </label>
      <label>
        Your review
        <textarea
          name="body"
          rows={5}
          minLength={20}
          maxLength={1500}
          required
          placeholder="Tell us about your journey, favourite moments and travel experience..."
        />
      </label>
      <label className="write-review-permission">
        <input type="checkbox" name="permission" required /> I agree to have my name and review
        published on this website.
      </label>
      {error && (
        <p className="website-booking-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Submitting...' : 'Submit review'}
        <Send size={16} />
      </button>
      <p className="form-disclaimer">
        Reviews are checked before publication. Please share your own travel experience.
      </p>
    </form>
  );
}
