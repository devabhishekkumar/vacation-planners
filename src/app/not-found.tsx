import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';
export default function NotFound() {
  return (
    <section className="not-found container">
      <Compass size={54} />
      <span className="eyebrow">A LITTLE DETOUR</span>
      <h1>
        This path leads <em>somewhere else.</em>
      </h1>
      <p>We couldn&apos;t find that page. Let&apos;s get you back to somewhere beautiful.</p>
      <Link href="/" className="btn btn-primary">
        <ArrowLeft size={17} /> Back to home
      </Link>
    </section>
  );
}
