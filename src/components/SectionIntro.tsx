import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export default function SectionIntro({
  eyebrow,
  title,
  description,
  linkLabel,
  href,
  light = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  linkLabel?: string;
  href?: string;
  light?: boolean;
}) {
  return (
    <div className={`section-head ${light ? 'section-head-light' : ''}`}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="section-title">{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </div>
      {linkLabel && href && (
        <Link className="text-link" href={href}>
          {linkLabel} <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
