'use client';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import type { galleryItems as defaultGallery } from '@/data/site';
const categories = ['All moments', 'Nature', 'Beaches', 'Culture', 'Cities'];
export default function GalleryExplorer({ galleryItems }: { galleryItems: typeof defaultGallery }) {
  const [category, setCategory] = useState('All moments');
  const [active, setActive] = useState<number | null>(null);
  const items = useMemo(
    () =>
      category === 'All moments'
        ? galleryItems
        : galleryItems.filter((item) => item.category === category),
    [category, galleryItems],
  );
  useEffect(() => {
    if (active === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setActive(null);
      if (e.key === 'ArrowRight')
        setActive((index) => (index === null ? null : (index + 1) % items.length));
      if (e.key === 'ArrowLeft')
        setActive((index) => (index === null ? null : (index + items.length - 1) % items.length));
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, items.length]);
  return (
    <>
      <div className="gallery-filters" role="group" aria-label="Filter gallery by category">
        {categories.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              if (category !== t) setActive(null);
              setCategory(t);
            }}
            className={category === t ? 'selected' : ''}
            aria-pressed={category === t}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="gallery-grid">
        {items.map((item, i) => (
          <button
            className={`gallery-tile gallery-tile-${i % 7}`}
            type="button"
            key={item.id}
            onClick={() => setActive(i)}
            aria-label={`View larger image: ${item.title}`}
          >
            <Image
              src={item.src}
              alt={item.title}
              fill
              sizes="(max-width:700px) 90vw, 35vw"
              className="image-cover"
            />
            <span className="gallery-tile-label">
              {item.title}
              <Expand size={17} />
            </span>
          </button>
        ))}
      </div>
      {active !== null && items[active] && (
        <div
          className="gallery-modal"
          role="dialog"
          aria-modal="true"
          aria-label={items[active].title}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActive(null);
          }}
        >
          <button
            className="gallery-close"
            onClick={() => setActive(null)}
            aria-label="Close image"
          >
            <X size={24} />
          </button>
          <button
            className="gallery-prev"
            onClick={() => setActive((active + items.length - 1) % items.length)}
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="gallery-modal-image">
            <Image
              src={items[active].src}
              alt={items[active].title}
              fill
              sizes="90vw"
              className="image-contain"
            />
          </div>
          <button
            className="gallery-next"
            onClick={() => setActive((active + 1) % items.length)}
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
          <p>
            {items[active].title}{' '}
            <span>
              {active + 1} / {items.length}
            </span>
          </p>
        </div>
      )}
    </>
  );
}
