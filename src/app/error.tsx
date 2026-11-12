'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Vacation Planners page error', error);
  }, [error]);
  return (
    <section className="not-found container" role="alert">
      <AlertCircle size={54} />
      <span className="eyebrow">AN UNEXPECTED DETOUR</span>
      <h1>
        We hit a little <em>travel delay.</em>
      </h1>
      <p>Something didn&apos;t load correctly. You can try again or return to the homepage.</p>
      <div className="error-actions">
        <button type="button" className="btn btn-primary" onClick={reset}>
          <RefreshCcw size={17} /> Try again
        </button>
        <Link className="btn btn-outline" href="/">
          <ArrowLeft size={17} /> Back home
        </Link>
      </div>
    </section>
  );
}
