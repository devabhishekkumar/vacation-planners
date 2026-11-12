import { db } from '../auth/database';
import { destinations, packages, galleryItems, articleCards, photos } from '../../data/site';
import {
  contentDefinitions,
  type ContentCollection,
  type SiteContent,
} from '../../features/content/types';
import { TravelError } from '../travel/errors';
export const defaultContent = (): SiteContent =>
  structuredClone({ destinations, packages, galleryItems, articleCards, photos });
function database() {
  const d = db();
  d.exec(
    'CREATE TABLE IF NOT EXISTS website_content(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,payload TEXT NOT NULL,updated_at TEXT NOT NULL)',
  );
  return d;
}
export function contentSnapshot() {
  const row = database().prepare('SELECT * FROM website_content WHERE id=1').get();
  return row
    ? {
        revision: Number(row.revision),
        content: JSON.parse(String(row.payload)) as SiteContent,
        updatedAt: String(row.updated_at),
      }
    : { revision: 0, content: defaultContent(), updatedAt: null };
}
export const getSiteContent = () => contentSnapshot().content;
export const getPublishedPackage = (slug: string) =>
  getSiteContent().packages.find((p) => p.slug === slug);
function image(value: string) {
  if (/^\/(?:images|uploads)\/[a-zA-Z0-9/_.-]+$/.test(value)) return;
  try {
    const url = new URL(value);
    if (
      url.protocol === 'https:' &&
      url.hostname === 'images.unsplash.com' &&
      !url.username &&
      !url.password
    )
      return;
  } catch {}
  throw new TravelError(
    'Use an HTTPS images.unsplash.com image URL or a local /images/ or /uploads/ path.',
  );
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new TravelError('Invalid website content.');
  return value as Record<string, unknown>;
}
function str(value: unknown, max = 6000) {
  if (typeof value !== 'string' || value.length > max)
    throw new TravelError(`Use text up to ${max} characters.`);
  return value.trim();
}
export function validateContent(input: unknown): SiteContent {
  const source = record(input),
    output: Record<string, unknown> = {};
  for (const collection of Object.keys(contentDefinitions) as ContentCollection[]) {
    const rows = source[collection];
    if (!Array.isArray(rows) || rows.length > 200)
      throw new TravelError('Use at most 200 entries per section.');
    const ids = new Set<string>();
    output[collection] = rows.map((value) => {
      const row = record(value),
        clean: Record<string, unknown> = {};
      for (const field of contentDefinitions[collection].fields) {
        const raw = row[field.key];
        if (field.type === 'boolean') {
          if (raw !== undefined && typeof raw !== 'boolean')
            throw new TravelError('Invalid featured option.');
          clean[field.key] = Boolean(raw);
        } else if (field.type === 'number') {
          if (
            typeof raw !== 'number' ||
            !Number.isInteger(raw) ||
            raw < (field.key === 'id' ? 1 : 0) ||
            raw > 10000
          )
            throw new TravelError(`Enter a valid ${field.label.toLowerCase()}.`);
          clean[field.key] = raw;
        } else if (field.type === 'list') {
          if (!Array.isArray(raw) || raw.length > 100)
            throw new TravelError(`Invalid ${field.label}.`);
          clean[field.key] = raw.map((v) => str(v)).filter(Boolean);
          if (field.key === 'images')
            for (const value of clean[field.key] as string[]) image(value);
        } else if (field.type === 'itinerary') {
          if (!Array.isArray(raw) || raw.length > 100)
            throw new TravelError('Use at most 100 itinerary days.');
          clean[field.key] = raw.map((v, index) => {
            const day = record(v);
            return { day: index + 1, title: str(day.title, 200), detail: str(day.detail) };
          });
        } else {
          const value = raw === undefined && !field.required ? '' : str(raw);
          if (field.required && !value) throw new TravelError(`${field.label} is required.`);
          if (field.options && !field.options.includes(value))
            throw new TravelError(`Choose a valid ${field.label}.`);
          if (field.type === 'image' && value) image(value);
          clean[field.key] = value;
        }
      }
      if (clean.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(clean.slug)))
        throw new TravelError('Page URL names must use lowercase letters, numbers and hyphens.');
      const id = String(clean.slug || clean.id);
      if (ids.has(id))
        throw new TravelError('Each entry needs a unique page URL name or photo number.');
      ids.add(id);
      return clean;
    });
  }
  const photoInput = record(source.photos),
    photoOutput: Record<string, string> = {};
  for (const key of Object.keys(photos)) {
    const value = str(photoInput[key], 2000);
    image(value);
    photoOutput[key] = value;
  }
  output.photos = photoOutput;
  const result = output as SiteContent;
  const slugs = new Set(result.destinations.map((d) => d.slug));
  if (result.packages.some((p) => !slugs.has(p.destinationSlug)))
    throw new TravelError(
      'Every package must reference an existing destination URL name. Update packages before deleting a destination.',
    );
  return result;
}
export function publishContent(revision: unknown, input: unknown) {
  if (!Number.isInteger(revision)) throw new TravelError('Invalid content version.');
  const content = validateContent(input),
    d = database();
  d.exec('BEGIN IMMEDIATE');
  try {
    const current = contentSnapshot();
    if (current.revision !== revision)
      throw new TravelError('Website content changed elsewhere. Reload before publishing.', 409);
    d.prepare(
      'INSERT INTO website_content VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at',
    ).run(Number(revision) + 1, JSON.stringify(content), new Date().toISOString());
    d.exec('COMMIT');
    return contentSnapshot();
  } catch (error) {
    d.exec('ROLLBACK');
    throw error;
  }
}
