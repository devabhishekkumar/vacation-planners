'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  MessageSquareQuote,
  Quote,
  Star,
  MapPin,
  Pause,
  Play,
} from 'lucide-react';
import { sampleReviews } from '@/data/sample-reviews';
import type { Review } from '@/lib/reviews';
export default function ReviewsCarousel() {
  const [items, setItems] = useState<Review[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [active, setActive] = useState(0),
    [visible, setVisible] = useState(1),
    [paused, setPaused] = useState(false),
    [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false);
  const track = useRef<HTMLDivElement>(null),
    activeRef = useRef(0),
    visibleRef = useRef(1),
    stride = useRef(0),
    reduced = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/reviews', { cache: 'no-store', signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw Error('Could not load reviews');
        return r.json();
      })
      .then((data) => {
        setItems(data.reviews.length ? data.reviews : sampleReviews);
        activeRef.current = 0;
        setActive(0);
        track.current?.scrollTo({ left: 0, behavior: 'instant' });
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setError(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      reduced.current = media.matches;
      if (media.matches) setPaused(true);
    }
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  function move(index: number, instant = false) {
    const element = track.current;
    if (!element) return;
    const next = Math.max(0, Math.min(items.length - visibleRef.current, index));
    activeRef.current = next;
    element.scrollTo({
      left: next * stride.current,
      behavior: instant || reduced.current ? 'instant' : 'smooth',
    });
  }
  useEffect(() => {
    const element = track.current;
    if (!element || !items.length) return;
    function measure() {
      if (!element || !element.firstElementChild) return;
      const style = getComputedStyle(element),
        columns = Number.parseInt(style.getPropertyValue('--review-columns')) || 1;
      visibleRef.current = Math.min(columns, items.length);
      setVisible(visibleRef.current);
      stride.current =
        element.firstElementChild.getBoundingClientRect().width +
        (Number.parseFloat(style.columnGap) || 0);
      const index = Math.max(0, Math.min(activeRef.current, items.length - visibleRef.current));
      activeRef.current = index;
      setActive(index);
      element.scrollTo({ left: index * stride.current, behavior: 'instant' });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [items.length]);
  useEffect(() => {
    if (paused || hovered || focused || items.length <= visible) return;
    const timer = window.setInterval(() => {
      if (document.hidden || !track.current) return;
      const max = items.length - visibleRef.current;
      const next = activeRef.current >= max ? 0 : activeRef.current + 1;
      activeRef.current = next;
      track.current.scrollTo({
        left: next * stride.current,
        behavior: reduced.current ? 'instant' : 'smooth',
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, items.length, visible]);
  if (loading)
    return (
      <div className="reviews-carousel-loading" role="status">
        <MessageSquareQuote size={30} />
        <span>Loading traveller stories...</span>
      </div>
    );
  if (error)
    return (
      <div className="reviews-carousel-empty">
        <MessageSquareQuote size={34} />
        <h3>Stories will be back shortly.</h3>
        <p>We could not load customer reviews. Please refresh the page to try again.</p>
      </div>
    );
  const sample = items.every((item) => item.id.startsWith('sample-')),
    max = Math.max(0, items.length - visible),
    positions = max + 1;
  return (
    <section
      className="reviews-carousel"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      {sample && (
        <p className="reviews-demo-note">
          Sample reviews for preview only. These are fictional examples, not customer feedback.
        </p>
      )}
      <div
        ref={track}
        className="reviews-carousel-track"
        tabIndex={0}
        onScroll={(e) => {
          if (!stride.current) return;
          const index = Math.min(
            max,
            Math.max(0, Math.round(e.currentTarget.scrollLeft / stride.current)),
          );
          activeRef.current = index;
          setActive(index);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            move(active + 1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            move(active - 1);
          }
        }}
      >
        {items.map((review, index) => (
          <article
            key={review.id}
            className="reviews-carousel-slide"
            aria-roledescription="slide"
            aria-label={index + 1 + ' of ' + items.length}
            aria-hidden={index < active || index >= active + visible}
          >
            <div className="reviews-carousel-card">
              <Quote
                className="reviews-carousel-quote"
                size={34}
                strokeWidth={1}
                aria-hidden="true"
              />
              <div
                className="reviews-carousel-rating"
                aria-label={review.rating + ' out of 5 stars'}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={15}
                    fill={star <= review.rating ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <blockquote>{review.body}</blockquote>
              <div className="reviews-carousel-author">
                <span className="reviews-carousel-avatar" aria-hidden="true">
                  {review.name
                    .split(/\s+/)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <div>
                  <strong>{review.name}</strong>
                  {review.destination && (
                    <small>
                      <MapPin size={12} />
                      {review.destination}
                    </small>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
      {max > 0 && (
        <div className="reviews-carousel-controls">
          <button
            type="button"
            onClick={() => move(active === 0 ? max : active - 1)}
            aria-label="Previous reviews"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="reviews-carousel-dots">
            {positions <= 8 ? (
              Array.from({ length: positions }, (_, index) => (
                <button
                  type="button"
                  key={index}
                  aria-label={'Go to review position ' + (index + 1)}
                  aria-current={index === active ? 'true' : undefined}
                  onClick={() => move(index)}
                />
              ))
            ) : (
              <span>
                {active + 1} / {positions}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => move(active >= max ? 0 : active + 1)}
            aria-label="Next reviews"
          >
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setPaused((value) => !value);
              setFocused(false);
            }}
            aria-label={paused ? 'Start review autoplay' : 'Pause review autoplay'}
            aria-pressed={paused}
          >
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
      )}
      <div className="reviews-write-action">
        <Link href="/reviews/write" className="btn btn-primary">
          <MessageSquareQuote size={17} /> Write a review
        </Link>
      </div>
      <span className="reviews-carousel-sr" aria-live={paused || focused ? 'polite' : 'off'}>
        Showing reviews {active + 1} to {Math.min(items.length, active + visible)} of {items.length}
      </span>
    </section>
  );
}
