'use client';
import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Destination, TourPackage } from '@/data/site';
import PackageCard from './PackageCard';
import { matchesText } from '@/lib/utils';
export default function PackageExplorer({
  destinations,
  packages,
  initialDestination = '',
  initialType = '',
  initialDuration = '',
}: {
  destinations: Destination[];
  packages: TourPackage[];
  initialDestination?: string;
  initialType?: string;
  initialDuration?: string;
}) {
  const [destination, setDestination] = useState(initialDestination);
  const [type, setType] = useState(initialType);
  const [duration, setDuration] = useState(initialDuration);
  const [term, setTerm] = useState('');
  const filtered = useMemo(
    () =>
      packages.filter((t) => {
        const matchesDestination = !destination || t.destinationSlug === destination;
        const matchesType = !type || t.type === type;
        const matchesDuration =
          !duration ||
          (duration === 'short' && t.nights <= 5) ||
          (duration === 'medium' && t.nights >= 6 && t.nights <= 7) ||
          (duration === 'long' && t.nights >= 8);
        const matchesQuery =
          !term || matchesText(`${t.title} ${t.country} ${t.summary} ${t.type}`, term);
        return matchesDestination && matchesType && matchesDuration && matchesQuery;
      }),
    [destination, type, duration, term, packages],
  );
  function reset() {
    setDestination('');
    setType('');
    setDuration('');
    setTerm('');
  }
  return (
    <div className="container explorer-layout">
      <aside className="explorer-sidebar">
        <div className="filter-header">
          <h2>
            <SlidersHorizontal size={19} /> Refine your journey
          </h2>
          <button type="button" onClick={reset}>
            Clear all
          </button>
        </div>
        <label className="filter-label">
          Search trips
          <div className="filter-search">
            <Search size={17} />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search experiences..."
            />
          </div>
        </label>
        <label className="filter-label">
          Destination
          <select value={destination} onChange={(e) => setDestination(e.target.value)}>
            <option value="">All destinations</option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-label">
          Travel style
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All travel styles</option>
            {Array.from(new Set(packages.map((t) => t.type))).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="filter-label">
          Duration
          <select value={duration} onChange={(e) => setDuration(e.target.value)}>
            <option value="">Any duration</option>
            <option value="short">Up to 5 nights</option>
            <option value="medium">6–7 nights</option>
            <option value="long">8+ nights</option>
          </select>
        </label>
        <div className="filter-note">
          Can&apos;t find the perfect match?
          <br />
          <a href="/contact">We can customise a trip for you →</a>
        </div>
      </aside>
      <div className="explorer-results">
        <div className="results-heading">
          <div>
            <span className="eyebrow">TRAVEL IDEAS</span>
            <h2>
              {filtered.length} {filtered.length === 1 ? 'journey' : 'journeys'} to discover
            </h2>
          </div>
          <span className="results-note">All package details are illustrative</span>
        </div>
        <div className="packages-grid explorer-grid">
          {filtered.map((t) => (
            <PackageCard key={t.slug} tour={t} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="empty-results">
            <Search size={34} />
            <h3>No exact matches found</h3>
            <p>Try different filters, or tell us what you&apos;re looking for.</p>
            <button type="button" className="btn btn-outline" onClick={reset}>
              <X size={16} /> Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
