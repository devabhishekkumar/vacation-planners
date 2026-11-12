import Link from 'next/link';
import { Compass } from 'lucide-react';
export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Vacation Planners home"
      className={`brand ${light ? 'brand-light' : ''}`}
    >
      <span className="brand-symbol">
        <Compass size={23} strokeWidth={1.9} />
      </span>
      <span className="brand-words">
        vacation<span>planners</span>
        <small>Go somewhere wonderful.</small>
      </span>
    </Link>
  );
}
