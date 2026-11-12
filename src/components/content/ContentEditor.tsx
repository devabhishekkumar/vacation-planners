'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  contentDefinitions,
  type ContentCollection,
  type SiteContent,
} from '@/features/content/types';
type Entry = Record<string, unknown>;
export default function ContentEditor() {
  const [content, setContent] = useState<SiteContent | null>(null),
    [revision, setRevision] = useState(0),
    [tab, setTab] = useState<ContentCollection | 'photos'>('packages'),
    [selected, setSelected] = useState(0),
    [query, setQuery] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [saving, setSaving] = useState(false),
    [dirty, setDirty] = useState(false);
  async function load() {
    setError('');
    try {
      const response = await fetch('/api/content', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setContent(result.content);
      setRevision(result.revision);
      setDirty(false);
      setSelected(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load content.');
    }
  }
  useEffect(() => {
    let active = true;
    void fetch('/api/content', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        if (active) {
          setContent(result.content);
          setRevision(result.revision);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Could not load content.');
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const changeContent = (value: SiteContent) => {
    setContent(value);
    setDirty(true);
    setMessage('');
  };
  const rows = content && tab !== 'photos' ? (content[tab] as unknown as Entry[]) : [];
  const entry = rows[selected];
  function change(key: string, value: unknown) {
    if (!content || tab === 'photos') return;
    changeContent({
      ...content,
      [tab]: rows.map((row, index) => (index === selected ? { ...row, [key]: value } : row)),
    });
  }
  async function publish() {
    if (!content || saving) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision, content }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setContent(result.content);
      setRevision(result.revision);
      setDirty(false);
      setMessage('Website updated. Your published changes are now live.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publishing failed. Your changes are still here.');
    } finally {
      setSaving(false);
    }
  }
  if (!content)
    return (
      <div className="tm-page">
        <h1>Website content</h1>
        {error ? (
          <>
            <p role="alert" className="tm-error">
              {error}
            </p>
            <button className="tm-button" onClick={() => void load()}>
              Retry
            </button>
          </>
        ) : (
          <p role="status">Loading website content…</p>
        )}
      </div>
    );
  return (
    <div className="tm-page">
      <header className="tm-hero">
        <div>
          <span className="tm-eyebrow">OPERATIONS / WEBSITE CONTENT</span>
          <h1>Keep your website fresh.</h1>
          <p>Edit your travel collection, then publish to update the live website.</p>
        </div>
        <div>
          <a className="tm-button tm-secondary" href="/" target="_blank" rel="noopener noreferrer">
            View website ↗
          </a>
        </div>
      </header>
      <div className="tm-section-heading">
        <p>{dirty ? 'Unpublished changes' : 'All changes published'}</p>
        <div className="tm-actions">
          <button
            className="tm-button tm-secondary"
            disabled={saving}
            onClick={() => {
              if (!dirty || window.confirm('Discard unpublished changes and reload?')) void load();
            }}
          >
            Reload published
          </button>
          <button className="tm-button" disabled={saving || !dirty} onClick={() => void publish()}>
            {saving ? 'Publishing…' : 'Publish website changes'}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="tm-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="tm-success">
          {message}
        </p>
      )}
      <nav className="tm-tabs" aria-label="Website content sections">
        {[
          ...Object.entries(contentDefinitions).map(([key, definition]) => ({
            key,
            label: definition.label,
          })),
          { key: 'photos', label: 'Website images' },
        ].map((item) => (
          <button
            key={item.key}
            aria-current={tab === item.key ? 'page' : undefined}
            onClick={() => {
              setTab(item.key as typeof tab);
              setSelected(0);
              setQuery('');
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <fieldset disabled={saving} className="cm-fieldset">
        {tab === 'photos' ? (
          <section className="tm-card">
            <h2>Website images</h2>
            <p className="tm-muted">
              These images appear in page heroes and supporting sections. Individual package and
              destination covers are edited in their own sections.
            </p>
            <div className="tm-form-grid">
              {Object.entries(content.photos).map(([key, value]) => (
                <label key={key}>
                  {key}
                  <input
                    value={value}
                    maxLength={2000}
                    onChange={(event) =>
                      changeContent({
                        ...content,
                        photos: { ...content.photos, [key]: event.target.value },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>
        ) : (
          <div className="cm-layout">
            <aside className="tm-card">
              <label>
                Search {contentDefinitions[tab].label.toLowerCase()}
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title or name"
                />
              </label>
              <div className="cm-list">
                {rows
                  .map((row, index) => ({ row, index }))
                  .filter(({ row }) =>
                    String(row.title || row.name || row.slug)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  )
                  .map(({ row, index }) => (
                    <button
                      className={selected === index ? 'cm-selected' : ''}
                      key={index}
                      onClick={() => setSelected(index)}
                    >
                      {String(row.title || row.name || 'Untitled entry')}
                      <small>{String(row.slug || row.category || '')}</small>
                    </button>
                  ))}
              </div>
              <button
                className="tm-button tm-secondary"
                onClick={() => {
                  const blank = structuredClone(contentDefinitions[tab].blank);
                  if (tab === 'galleryItems')
                    blank.id = Math.max(0, ...content.galleryItems.map((i) => i.id)) + 1;
                  changeContent({ ...content, [tab]: [...rows, blank] });
                  setSelected(rows.length);
                  setQuery('');
                }}
              >
                + Add {tab === 'galleryItems' ? 'photo' : 'entry'}
              </button>
            </aside>
            <section className="tm-card">
              {entry ? (
                <>
                  <div className="tm-section-heading">
                    <h2>{String(entry.title || entry.name || 'New entry')}</h2>
                    <button
                      className="tm-button tm-danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            'Remove this entry? The removal goes live when you publish.',
                          )
                        ) {
                          changeContent({
                            ...content,
                            [tab]: rows.filter((_, index) => index !== selected),
                          });
                          setSelected(0);
                        }
                      }}
                    >
                      Remove entry
                    </button>
                  </div>
                  <div className="tm-form-grid">
                    {contentDefinitions[tab].fields.map((field) => {
                      const value = entry[field.key];
                      if (field.type === 'boolean')
                        return (
                          <label key={field.key}>
                            {field.label}
                            <select
                              value={value ? 'yes' : 'no'}
                              onChange={(e) => change(field.key, e.target.value === 'yes')}
                            >
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                          </label>
                        );
                      if (field.type === 'itinerary') {
                        const days = value as { day: number; title: string; detail: string }[];
                        return (
                          <div className="tm-full" key={field.key}>
                            <h3>{field.label}</h3>
                            {days.map((day, index) => (
                              <div className="tm-itinerary-editor" key={index}>
                                <label>
                                  Day {index + 1} title
                                  <input
                                    value={day.title}
                                    onChange={(e) =>
                                      change(
                                        field.key,
                                        days.map((d, i) =>
                                          i === index ? { ...d, title: e.target.value } : d,
                                        ),
                                      )
                                    }
                                  />
                                </label>
                                <label>
                                  Day {index + 1} description
                                  <textarea
                                    value={day.detail}
                                    onChange={(e) =>
                                      change(
                                        field.key,
                                        days.map((d, i) =>
                                          i === index ? { ...d, detail: e.target.value } : d,
                                        ),
                                      )
                                    }
                                  />
                                </label>
                                <button
                                  className="tm-button tm-secondary"
                                  onClick={() =>
                                    change(
                                      field.key,
                                      days
                                        .filter((_, i) => i !== index)
                                        .map((d, i) => ({ ...d, day: i + 1 })),
                                    )
                                  }
                                >
                                  Remove day
                                </button>
                              </div>
                            ))}
                            <button
                              className="tm-button tm-secondary"
                              onClick={() =>
                                change(field.key, [
                                  ...days,
                                  { day: days.length + 1, title: '', detail: '' },
                                ])
                              }
                            >
                              + Add day
                            </button>
                          </div>
                        );
                      }
                      return (
                        <label
                          key={field.key}
                          className={
                            ['list', 'textarea', 'image'].includes(field.type || '')
                              ? 'tm-full'
                              : ''
                          }
                        >
                          {field.label}
                          {field.required ? ' *' : ''}
                          {field.options ? (
                            <select
                              value={String(value || '')}
                              onChange={(e) => change(field.key, e.target.value)}
                            >
                              {field.options.map((option) => (
                                <option key={option}>{option}</option>
                              ))}
                            </select>
                          ) : field.key === 'destinationSlug' ? (
                            <select
                              value={String(value || '')}
                              onChange={(e) => change(field.key, e.target.value)}
                            >
                              <option value="">Select destination</option>
                              {content.destinations.map((d) => (
                                <option key={d.slug} value={d.slug}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'list' ? (
                            <textarea
                              rows={5}
                              value={(value as string[]).join('\n')}
                              onChange={(e) => change(field.key, e.target.value.split('\n'))}
                            />
                          ) : field.type === 'textarea' ? (
                            <textarea
                              rows={4}
                              maxLength={6000}
                              value={String(value || '')}
                              onChange={(e) => change(field.key, e.target.value)}
                            />
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : 'text'}
                              min="0"
                              maxLength={field.type === 'image' ? 2000 : 6000}
                              value={String(value ?? '')}
                              onChange={(e) =>
                                change(
                                  field.key,
                                  field.type === 'number' ? Number(e.target.value) : e.target.value,
                                )
                              }
                            />
                          )}
                          {field.type === 'image' && (
                            <small>Use an images.unsplash.com URL or local /images/ path.</small>
                          )}
                          {field.type === 'image' &&
                            typeof value === 'string' &&
                            /^(https:\/\/images\.unsplash\.com\/|\/images\/|\/uploads\/)/.test(
                              value,
                            ) && (
                              <Image
                                src={value}
                                alt="Content preview"
                                width={440}
                                height={240}
                                unoptimized
                                style={{ objectFit: 'cover', borderRadius: 10, maxWidth: '100%' }}
                              />
                            )}
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="tm-empty">Add your first entry to get started.</div>
              )}
            </section>
          </div>
        )}
      </fieldset>
    </div>
  );
}
