'use client';
import { useRouter } from 'next/navigation';
import { CalendarRange, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Destination } from '@/data/site';
export default function SearchPanel({ destinations }: { destinations: Destination[] }) {
  const [destination, setDestination] = useState('');
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const router = useRouter();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (type) params.set('type', type);
    if (duration) params.set('duration', duration);
    router.push(`/packages${params.toString() ? `?${params}` : ''}`);
  }
  return (
    <form onSubmit={submit} className="search-panel">
      <div className="search-field">
        <MapPin size={20} />
        <label>
          Destination
          <select
            aria-label="Select destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Where to?</option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="search-field">
        <SlidersHorizontal size={20} />
        <label>
          Travel style
          <select
            aria-label="Select travel style"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Any experience</option>
            <option>Nature & Mountains</option>
            <option>Honeymoon</option>
            <option>Culture & Heritage</option>
            <option>Beach Escape</option>
            <option>City & Luxury</option>
            <option>Family Holiday</option>
          </select>
        </label>
      </div>
      <div className="search-field">
        <CalendarRange size={20} />
        <label>
          Duration
          <select
            aria-label="Select trip duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="">Any duration</option>
            <option value="short">Up to 5 nights</option>
            <option value="medium">6–7 nights</option>
            <option value="long">8+ nights</option>
          </select>
        </label>
      </div>
      <button className="search-submit" type="submit">
        <Search size={20} /> Explore trips
      </button>
    </form>
  );
}
