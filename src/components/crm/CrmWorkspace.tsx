'use client';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Download,
  FileText,
  IndianRupee,
  PackageCheck,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  UserRoundSearch,
  Wallet,
  X,
} from 'lucide-react';
import BookingDetails from './BookingDetails';
import QuotationForm from './QuotationForm';
import { quotationPdf } from '@/features/crm/quotation';
import { AdminOverview, LeadManagement } from './LeadManagement';
import { useDemo, priorityOptions } from '@/features/crm/demo-store';
import {
  bookingStatuses,
  leadStatuses,
  money,
  prettyDate,
  quoteStatuses,
  todayISO,
  type Booking,
  type Customer,
  type Lead,
  type Priority,
  type Quotation,
} from '@/features/crm/demo-data';

type ModalType = 'lead' | 'quotation' | 'booking' | 'payment' | 'task' | 'supplier' | null;
const titles: Record<
  string,
  { title: string; subtitle: string; button?: string; modal?: ModalType }
> = {
  admin: {
    title: 'Team & activity',
    subtitle: 'Review assignments, follow-ups and workspace activity.',
  },
  overview: {
    title: 'Welcome back, team 👋',
    subtitle: 'Here’s what’s happening with your travel business today.',
  },
  leads: {
    title: 'Enquiries & leads',
    subtitle: 'Track every travel request from first enquiry to confirmation.',
    button: 'New enquiry',
    modal: 'lead',
  },
  customers: {
    title: 'Customers',
    subtitle:
      'Confirmed enquiries and leads, with their contact details and booking relationships.',
  },
  quotations: {
    title: 'Quotations',
    subtitle: 'Prepare, track and review trip proposals.',
    button: 'New quotation',
    modal: 'quotation',
  },
  bookings: {
    title: 'Bookings',
    subtitle: 'Every confirmed journey, milestone and outstanding balance.',
    button: 'New booking',
    modal: 'booking',
  },
  payments: {
    title: 'Payment tracking',
    subtitle: 'Record advances, received payments and pending balances.',
    button: 'Record payment',
    modal: 'payment',
  },
  tasks: {
    title: 'Follow-up tasks',
    subtitle: 'Keep important conversations and next steps on schedule.',
    button: 'New task',
    modal: 'task',
  },
  suppliers: {
    title: 'Suppliers',
    subtitle: 'A single place to organize accommodation and activity partners.',
    button: 'Add supplier',
    modal: 'supplier',
  },
  reports: {
    title: 'Reports & insights',
    subtitle: 'An easy-to-read snapshot of your Admin activity.',
  },
  content: {
    title: 'Website content',
    subtitle: 'See which public-facing sections will connect to CMS management.',
  },
};
function Badge({ value }: { value: string }) {
  const style = value.toLowerCase().replace(/\s+/g, '-');
  return (
    <span className={`crm-badge crm-badge-${style}`}>
      <span className="crm-badge-point" />
      {value}
    </span>
  );
}
function Avatar({ name, size = 'normal' }: { name: string; size?: 'small' | 'normal' }) {
  return (
    <span className={`crm-avatar ${size === 'small' ? 'crm-avatar-small' : ''}`}>
      {name
        .split(' ')
        .map((x) => x[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()}
    </span>
  );
}
function Tile({
  label,
  value,
  icon: Icon,
  foot,
  tone = 'teal',
}: {
  label: string;
  value: string;
  icon: typeof Users;
  foot: string;
  tone?: string;
}) {
  return (
    <div className="crm-metric">
      <div className="crm-metric-head">
        <span>{label}</span>
        <span className={`crm-metric-icon crm-tone-${tone}`}>
          <Icon size={20} />
        </span>
      </div>
      <div className="crm-metric-value">{value}</div>
      <div className="crm-metric-foot">
        <span className="crm-positive">
          <TrendingUp size={13} />
        </span>{' '}
        {foot}
      </div>
    </div>
  );
}
function Panel({
  heading,
  subheading,
  children,
  action,
}: {
  heading: string;
  subheading?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="crm-panel">
      <div className="crm-panel-header">
        <div>
          <h2>{heading}</h2>
          {subheading && <p>{subheading}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function SimpleTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="crm-table-scroll">
      <table className="crm-table">
        <thead>
          <tr>
            {head.map((item) => (
              <th key={item}>{item}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Empty({ message = 'No matching records.' }: { message?: string }) {
  return (
    <tr>
      <td colSpan={12} className="crm-empty">
        <Search size={23} />
        <p>{message}</p>
      </td>
    </tr>
  );
}
function Bars({ items }: { items: { name: string; value: number; color?: string }[] }) {
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <div className="crm-bars">
      {items.map((item, i) => (
        <div className="crm-bar-row" key={item.name}>
          <span className="crm-bar-name">{item.name}</span>
          <div className="crm-bar-track">
            <span
              style={{
                width: `${(item.value / max) * 100}%`,
                background:
                  item.color || ['#3e8b85', '#ee9169', '#5d7993', '#e6b960', '#98a9c3'][i % 5],
              }}
            />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
const csvValue = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const heads = Object.keys(rows[0]);
  const lines = [
    heads.map(csvValue).join(','),
    ...rows.map((row) => heads.map((h) => csvValue(row[h])).join(',')),
  ].join('\r\n');
  const blob = new Blob([`\uFEFF${lines}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CrmWorkspace({ section }: { section: string }) {
  const store = useDemo();
  const { data } = store;
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  useEffect(() => {
    // Read the browser URL after hydration when the workspace section changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(new URLSearchParams(window.location.search).get('q') || '');
    setFilter('All');
  }, [section]);
  const clean = query.toLowerCase().trim();
  const matches = (...values: (string | number)[]) =>
    !clean || values.some((v) => String(v).toLowerCase().includes(clean));
  const activeLeads = data.leads.filter((x) => x.status !== 'Confirmed' && x.status !== 'Lost');
  const confirmed = data.bookings.filter(
    (x) => x.status === 'Confirmed' || x.status === 'Completed',
  );
  const received = data.payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = data.bookings
    .filter((x) => x.status !== 'Cancelled')
    .reduce((sum, b) => sum + Math.max(0, b.amount - b.paid), 0);
  const tasksDue = data.tasks
    .filter((x) => !x.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const leadPipeline = leadStatuses.map((status) => ({
    name: status,
    value: data.leads.filter((x) => x.status === status).length,
  }));
  const page = titles[section] || titles.overview;
  const exportRows = () => {
    const dataset =
      section === 'leads'
        ? data.leads
        : section === 'customers'
          ? data.customers
          : section === 'quotations'
            ? data.quotations
            : section === 'bookings'
              ? data.bookings
              : section === 'payments'
                ? data.payments
                : section === 'tasks'
                  ? data.tasks
                  : section === 'suppliers'
                    ? data.suppliers
                    : null;
    if (dataset)
      downloadCsv(
        `vacation-planners-${section}.csv`,
        dataset as unknown as Record<string, unknown>[],
      );
  };
  const filteredLeads = data.leads
    .filter((x) => matches(x.id, x.name, x.destination, x.email, x.source, x.owner))
    .filter((x) => filter === 'All' || x.status === filter);
  const filteredCustomers = data.customers
    .filter((x) => matches(x.id, x.name, x.city, x.email))
    .filter((x) => filter === 'All' || x.segment === filter);
  const filteredQuotes = data.quotations
    .filter((x) => matches(x.id, x.customer, x.title))
    .filter((x) => filter === 'All' || x.status === filter);
  const filteredBookings = data.bookings
    .filter((x) => matches(x.id, x.customer, x.tour))
    .filter((x) => filter === 'All' || x.status === filter);
  const filteredPayments = data.payments.filter((x) =>
    matches(x.id, x.customer, x.reference, x.bookingId),
  );
  const filteredTasks = data.tasks
    .filter((x) => matches(x.title, x.owner, x.leadId))
    .filter(
      (x) =>
        filter === 'All' ||
        (filter === 'Pending'
          ? !x.completed
          : filter === 'Due today'
            ? !x.completed && x.dueDate === todayISO()
            : filter === 'Overdue'
              ? !x.completed && x.dueDate < todayISO()
              : x.completed),
    );
  const filteredSuppliers = data.suppliers
    .filter((x) => matches(x.name, x.service, x.destination))
    .filter((x) => filter === 'All' || x.status === filter);
  return (
    <div className="crm-workspace">
      <div className="crm-page-heading">
        <div>
          <span className="crm-overline">
            <span className="crm-overline-spark">✳</span> VACATION PLANNERS /{' '}
            {section.toUpperCase()}
          </span>
          <h1>{page.title}</h1>
          <p>{page.subtitle}</p>
        </div>
        <div className="crm-heading-actions">
          {section === 'overview' && (
            <Link className="crm-btn crm-btn-light" href="/admin/reports">
              <TrendingUp size={16} /> View reports
            </Link>
          )}
          {page.button && (
            <button
              className="crm-btn crm-btn-primary"
              onClick={() => setModal(page.modal || null)}
            >
              <Plus size={17} />
              {page.button}
            </button>
          )}
          {section === 'overview' && (
            <button className="crm-btn crm-btn-primary" onClick={() => setModal('lead')}>
              <Plus size={17} /> New enquiry
            </button>
          )}
        </div>
      </div>
      {['bookings', 'payments'].includes(section) &&
        !store.bookingsReady &&
        !store.bookingError && <p role="status">Loading booking and payment records...</p>}
      {store.leadError && (
        <p role="alert" className="crm-form-error">
          {store.leadError}
        </p>
      )}
      {store.bookingError && (
        <p role="alert" className="crm-form-error">
          {store.bookingError}
        </p>
      )}
      {selectedBooking && (
        <BookingDetails id={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
      {section === 'admin' && <AdminOverview />}
      {section === 'overview' && (
        <>
          <div className="crm-metric-grid">
            <Tile
              label="Total enquiries"
              value={String(data.leads.length).padStart(2, '0')}
              foot="Across all lead stages"
              icon={UserRoundSearch}
            />
            <Tile
              label="Active leads"
              value={String(activeLeads.length).padStart(2, '0')}
              foot="Need nurturing and follow-up"
              icon={Users}
              tone="peach"
            />
            <Tile
              label="Confirmed bookings"
              value={String(confirmed.length).padStart(2, '0')}
              foot="Confirmed and completed"
              icon={PackageCheck}
              tone="purple"
            />
            <Tile
              label="Outstanding balance"
              value={money(outstanding)}
              foot="Sample booking receivables"
              icon={Wallet}
              tone="gold"
            />
          </div>
          <div className="crm-metric-grid">
            <Tile
              label="Total customers"
              value={String(data.customers.length)}
              foot="Customer profiles"
              icon={Users}
            />
            <Tile
              label="New enquiries"
              value={String(data.leads.filter((l) => l.status === 'New').length)}
              foot="Awaiting first contact"
              icon={UserRoundSearch}
            />
            <Tile
              label="Follow-ups due today"
              value={String(
                data.tasks.filter((t) => !t.completed && t.dueDate === todayISO()).length,
              )}
              foot="Pending tasks scheduled today"
              icon={CalendarDays}
            />
            <Tile
              label="Quotations generated"
              value={String(data.quotations.length)}
              foot="All quotation records"
              icon={FileText}
            />
            <Tile
              label="Lost leads"
              value={String(data.leads.filter((l) => l.status === 'Lost').length)}
              foot="Closed without confirmation"
              icon={CircleAlert}
            />
          </div>
          <div className="crm-overview-grid">
            <Panel
              heading="Lead pipeline"
              subheading="Where enquiries stand right now"
              action={
                <Link className="crm-inline-link" href="/admin/leads">
                  View all <ArrowUpRight size={15} />
                </Link>
              }
            >
              <Bars items={leadPipeline} />
              <div className="crm-panel-footer">
                <span>
                  <i className="crm-legend-dot" /> {activeLeads.length} active leads in pipeline
                </span>
                <span className="crm-soft-label">SAMPLE DATA</span>
              </div>
            </Panel>
            <Panel
              heading="Payment overview"
              subheading="Track collection and pending balances"
              action={
                <Link href="/admin/payments" className="crm-inline-link">
                  View payments <ArrowUpRight size={15} />
                </Link>
              }
            >
              <div className="crm-payment-big">
                {money(received)}
                <span>total recorded payments</span>
              </div>
              <div className="crm-stacked-bar">
                <span style={{ width: `${(received / (received + outstanding || 1)) * 100}%` }} />
              </div>
              <div className="crm-payment-legend">
                <div>
                  <span className="crm-dot teal" /> Received <strong>{money(received)}</strong>
                </div>
                <div>
                  <span className="crm-dot coral" /> Pending <strong>{money(outstanding)}</strong>
                </div>
              </div>
              <p className="crm-chart-note">
                Booking and payment totals reflect records saved on the server.
              </p>
            </Panel>
          </div>
          <div className="crm-overview-bottom">
            <Panel
              heading="Recent enquiries"
              subheading="Your latest travel requests"
              action={
                <Link href="/admin/leads" className="crm-inline-link">
                  All enquiries <ArrowUpRight size={15} />
                </Link>
              }
            >
              <SimpleTable head={['TRAVELLER', 'DESTINATION', 'STATUS', 'PRIORITY']}>
                {data.leads.slice(0, 5).map((x) => (
                  <tr key={x.id}>
                    <td>
                      <div className="crm-person">
                        <Avatar name={x.name} />
                        <div>
                          <strong>{x.name}</strong>
                          <small>{x.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{x.destination}</td>
                    <td>
                      <Badge value={x.status} />
                    </td>
                    <td>
                      <span className={`crm-priority crm-priority-${x.priority.toLowerCase()}`}>
                        {x.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </SimpleTable>
            </Panel>
            <Panel
              heading="Upcoming follow-ups"
              subheading="Stay ahead of every conversation"
              action={
                <Link href="/admin/tasks" className="crm-inline-link">
                  View tasks <ArrowUpRight size={15} />
                </Link>
              }
            >
              <div className="crm-task-short-list">
                {tasksDue.length ? (
                  tasksDue.slice(0, 4).map((t) => (
                    <label key={t.id} className="crm-mini-task">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => store.toggleTask(t.id)}
                        aria-label={`Complete ${t.title}`}
                      />
                      <span>
                        <strong>{t.title}</strong>
                        <small>
                          <CalendarDays size={12} /> {prettyDate(t.dueDate)} · {t.owner}
                        </small>
                      </span>
                      <ChevronRight size={16} />
                    </label>
                  ))
                ) : (
                  <p className="crm-no-items">No pending follow-ups.</p>
                )}
              </div>
            </Panel>
          </div>
          <div className="crm-tip-banner">
            <span>
              <Sparkles size={22} />
            </span>
            <div>
              <strong>One workspace. Every journey.</strong>
              <p>
                Capture a new enquiry, create a quotation, confirm a booking, then record the
                payment — all from the sidebar.
              </p>
            </div>
            <Link href="/admin/leads">
              Explore the workflow <ArrowRight size={16} />
            </Link>
          </div>
        </>
      )}
      {['leads', 'customers', 'quotations', 'bookings', 'payments', 'tasks', 'suppliers'].includes(
        section,
      ) && (
        <>
          <div className="crm-list-topbar">
            <div className="crm-list-summary">
              <strong>
                {section === 'leads'
                  ? data.leads.length
                  : section === 'customers'
                    ? data.customers.length
                    : section === 'quotations'
                      ? data.quotations.length
                      : section === 'bookings'
                        ? data.bookings.length
                        : section === 'payments'
                          ? data.payments.length
                          : section === 'tasks'
                            ? data.tasks.length
                            : data.suppliers.length}
              </strong>{' '}
              total records <span>·</span>{' '}
              <span className="crm-soft-label">
                {['bookings', 'payments', 'leads'].includes(section)
                  ? 'SERVER STORAGE'
                  : 'BROWSER STORAGE'}
              </span>
            </div>
            <button className="crm-btn crm-btn-light crm-export" onClick={exportRows}>
              <Download size={15} /> Export CSV
            </button>
          </div>
          <div className="crm-panel crm-list-panel">
            <div className="crm-filters">
              <label className="crm-searchbox">
                <Search size={18} />
                <input
                  placeholder={`Search ${section}...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              {section !== 'payments' && (
                <label className="crm-select-wrap">
                  <SlidersHorizontal size={15} />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    aria-label="Filter by status"
                  >
                    <option>All</option>
                    {(section === 'leads'
                      ? leadStatuses
                      : section === 'customers'
                        ? ['New', 'Repeat', 'VIP']
                        : section === 'quotations'
                          ? quoteStatuses
                          : section === 'bookings'
                            ? bookingStatuses
                            : section === 'tasks'
                              ? ['Pending', 'Due today', 'Overdue', 'Completed']
                              : ['Active', 'On hold']
                    ).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {section === 'leads' && (
              <SimpleTable
                head={[
                  'TRAVELLER',
                  'DESTINATION',
                  'TRIP DATE',
                  'SOURCE',
                  'STATUS',
                  'PRIORITY',
                  'ASSIGNED',
                  '',
                ]}
              >
                {filteredLeads.length ? (
                  filteredLeads.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <div className="crm-person">
                          <Avatar name={x.name} />
                          <div>
                            <strong>{x.name}</strong>
                            <small>{x.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="crm-td-strong">{x.destination}</strong>
                        <small className="crm-subcell">
                          {x.travelers} traveller{x.travelers > 1 ? 's' : ''}
                        </small>
                      </td>
                      <td>{prettyDate(x.travelDate)}</td>
                      <td>{x.source}</td>
                      <td>
                        <select
                          className={`crm-inline-select crm-select-${x.status.toLowerCase().replaceAll(' ', '-')}`}
                          aria-label={`Status for ${x.name}`}
                          value={x.status}
                          disabled={!store.leadsReady}
                          onChange={(e) => {
                            void store
                              .updateLead(x.id, e.target.value as Lead['status'])
                              .catch(() => {});
                          }}
                        >
                          {leadStatuses.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`crm-priority crm-priority-${x.priority.toLowerCase()}`}>
                          {x.priority}
                        </span>
                      </td>
                      <td>{x.owner}</td>
                      <td>
                        <button
                          className="crm-table-action"
                          onClick={() => setSelectedLead(x)}
                          aria-label={`View ${x.name}`}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <Empty />
                )}
              </SimpleTable>
            )}
            {section === 'customers' && (
              <SimpleTable head={['CUSTOMER', 'CITY', 'TRIPS', 'SEGMENT', 'LAST ACTIVITY', '']}>
                {filteredCustomers.length ? (
                  filteredCustomers.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <div className="crm-person">
                          <Avatar name={x.name} />
                          <div>
                            <strong>{x.name}</strong>
                            <small>{x.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>{x.city}</td>
                      <td>
                        {x.trips} trip{x.trips > 1 ? 's' : ''}
                      </td>
                      <td>
                        <Badge value={x.segment} />
                      </td>
                      <td>{prettyDate(x.lastActivity)}</td>
                      <td>
                        <button
                          className="crm-table-action"
                          onClick={() => setSelectedCustomer(x)}
                          aria-label={`View ${x.name}`}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <Empty />
                )}
              </SimpleTable>
            )}
            {section === 'quotations' && (
              <SimpleTable
                head={[
                  'QUOTE ID',
                  'CUSTOMER',
                  'TRIP PROPOSAL',
                  'ESTIMATE',
                  'CREATED',
                  'VALID UNTIL',
                  'STATUS',
                  'PDF',
                ]}
              >
                {filteredQuotes.length ? (
                  filteredQuotes.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <strong className="crm-id">{x.id}</strong>
                      </td>
                      <td>{x.customer}</td>
                      <td>
                        <strong className="crm-td-strong">{x.title}</strong>
                      </td>
                      <td>
                        <strong className="crm-td-strong">{money(x.amount)}</strong>
                      </td>
                      <td>{prettyDate(x.createdAt)}</td>
                      <td>{prettyDate(x.validUntil)}</td>
                      <td>
                        <select
                          aria-label={`Status for ${x.id}`}
                          className={`crm-inline-select crm-select-${x.status.toLowerCase()}`}
                          value={x.status}
                          onChange={(e) =>
                            store.updateQuotation(x.id, e.target.value as Quotation['status'])
                          }
                        >
                          {quoteStatuses.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {x.details ? (
                          <button
                            type="button"
                            className="crm-table-action"
                            aria-label={`Download PDF for ${x.id}`}
                            onClick={() => {
                              const bytes = quotationPdf(x.details!);
                              const url = URL.createObjectURL(
                                new Blob([bytes.buffer as ArrayBuffer], {
                                  type: 'application/pdf',
                                }),
                              );
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${x.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              window.setTimeout(() => URL.revokeObjectURL(url), 60000);
                            }}
                          >
                            <Download size={16} />
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <Empty />
                )}
              </SimpleTable>
            )}
            {section === 'bookings' && (
              <SimpleTable
                head={[
                  'BOOKING',
                  'JOURNEY',
                  'TRAVEL DATE',
                  'VALUE',
                  'PAYMENT PROGRESS',
                  'STATUS',
                  'DETAILS',
                ]}
              >
                {filteredBookings.length ? (
                  filteredBookings.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <strong className="crm-id">{x.id}</strong>
                        <small className="crm-subcell">
                          {x.customer} {x.source === 'Website' ? ' ? Website' : ''}
                        </small>
                      </td>
                      <td>
                        <strong className="crm-td-strong">{x.tour}</strong>
                        <small className="crm-subcell">
                          {x.travelers} traveller{x.travelers > 1 ? 's' : ''}
                        </small>
                      </td>
                      <td>{prettyDate(x.travelDate)}</td>
                      <td>
                        <strong>{x.pricingPending ? 'Awaiting price' : money(x.amount)}</strong>
                      </td>
                      <td>
                        {x.pricingPending ? (
                          <span className="crm-subcell">Set price in Details</span>
                        ) : (
                          <div className="crm-pay-progress">
                            <div>
                              <span>{money(x.paid)} received</span>
                              <strong>{Math.round((x.paid / (x.amount || 1)) * 100)}%</strong>
                            </div>
                            <div className="crm-pay-track">
                              <span
                                style={{
                                  width: `${Math.min(100, (x.paid / (x.amount || 1)) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          aria-label={`Status for ${x.id}`}
                          className={`crm-inline-select crm-select-${x.status.toLowerCase()}`}
                          value={x.status}
                          disabled={!store.bookingsReady || x.status === 'Cancelled'}
                          onChange={(e) => {
                            const status = e.target.value as Booking['status'];
                            if (
                              status === 'Cancelled' &&
                              !window.confirm(
                                'Cancel this booking? Payment history will be kept. Cancelled bookings cannot be reopened.',
                              )
                            )
                              return;
                            void store.updateBooking(x.id, status).catch(() => {});
                          }}
                        >
                          {bookingStatuses.map((s) => (
                            <option
                              key={s}
                              disabled={x.pricingPending && ['Confirmed', 'Completed'].includes(s)}
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="crm-table-action"
                          onClick={() => setSelectedBooking(x.id)}
                          aria-label={`View booking ${x.id}`}
                        >
                          <ArrowUpRight size={17} />
                        </button>
                        <Link
                          className="crm-table-action"
                          href={`/admin/travel/${encodeURIComponent(x.id)}`}
                        >
                          Manage Travel
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <Empty />
                )}
              </SimpleTable>
            )}
            {section === 'payments' && (
              <>
                <div className="crm-payment-summary">
                  <div>
                    <span>Recorded payments</span>
                    <strong>{money(received)}</strong>
                  </div>
                  <div>
                    <span>Outstanding balances</span>
                    <strong>{money(outstanding)}</strong>
                  </div>
                  <div>
                    <span>Payment entries</span>
                    <strong>{data.payments.length}</strong>
                  </div>
                </div>
                <SimpleTable
                  head={[
                    'PAYMENT ID',
                    'CUSTOMER',
                    'BOOKING',
                    'AMOUNT',
                    'METHOD',
                    'DATE',
                    'REFERENCE',
                  ]}
                >
                  {filteredPayments.length ? (
                    filteredPayments.map((x) => (
                      <tr key={x.id}>
                        <td>
                          <strong className="crm-id">{x.id}</strong>
                        </td>
                        <td>
                          <div className="crm-person">
                            <Avatar name={x.customer} size="small" />
                            <strong>{x.customer}</strong>
                          </div>
                        </td>
                        <td>{x.bookingId}</td>
                        <td>
                          <strong className="crm-td-strong">{money(x.amount)}</strong>
                        </td>
                        <td>{x.method}</td>
                        <td>{prettyDate(x.date)}</td>
                        <td>
                          <span className="crm-reference">{x.reference}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <Empty />
                  )}
                </SimpleTable>
              </>
            )}
            {section === 'tasks' && (
              <div className="crm-task-list">
                {filteredTasks.length ? (
                  filteredTasks.map((t) => (
                    <div
                      className={`crm-task-item ${t.completed ? 'crm-task-complete' : ''}`}
                      key={t.id}
                    >
                      <label className="crm-task-check">
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => store.toggleTask(t.id)}
                          aria-label={`Mark ${t.title} ${t.completed ? 'incomplete' : 'complete'}`}
                        />
                      </label>
                      <div className="crm-task-info">
                        <strong>{t.title}</strong>
                        <span>
                          <span>{t.leadId || 'General task'}</span>
                          <span>·</span>
                          <span>{t.owner}</span>
                        </span>
                      </div>
                      <div className="crm-task-meta">
                        <span>
                          <CalendarDays size={14} /> {prettyDate(t.dueDate)}{' '}
                          {!t.completed &&
                            (t.dueDate < todayISO()
                              ? ' ? Overdue'
                              : t.dueDate === todayISO()
                                ? ' ? Due today'
                                : '')}
                        </span>
                        <span className={`crm-priority crm-priority-${t.priority.toLowerCase()}`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="crm-no-items">No matching tasks.</div>
                )}
              </div>
            )}
            {section === 'suppliers' && (
              <SimpleTable
                head={['SUPPLIER', 'SERVICE', 'DESTINATION', 'CONTACT', 'STATUS', 'NOTES']}
              >
                {filteredSuppliers.length ? (
                  filteredSuppliers.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong className="crm-td-strong">{s.name}</strong>
                        <small className="crm-subcell">{s.id}</small>
                      </td>
                      <td>{s.service}</td>
                      <td>{s.destination}</td>
                      <td>
                        <span className="crm-reference">{s.contact}</span>
                      </td>
                      <td>
                        <Badge value={s.status} />
                      </td>
                      <td>{s.notes}</td>
                    </tr>
                  ))
                ) : (
                  <Empty />
                )}
              </SimpleTable>
            )}
          </div>
        </>
      )}
      {section === 'reports' && (
        <>
          <div className="crm-metric-grid">
            <Tile
              label="Total enquiries"
              value={String(data.leads.length)}
              foot="Pipeline records"
              icon={UserRoundSearch}
            />
            <Tile
              label="Quotes issued"
              value={String(data.quotations.filter((q) => q.status !== 'Draft').length)}
              foot="Sent or otherwise updated"
              icon={FileText}
              tone="peach"
            />
            <Tile
              label="Booked journeys"
              value={String(data.bookings.length)}
              foot="Across all booking statuses"
              icon={PackageCheck}
              tone="purple"
            />
            <Tile
              label="Total collected"
              value={money(received)}
              foot="Recorded payment entries"
              icon={IndianRupee}
              tone="gold"
            />
          </div>
          <div className="crm-overview-grid">
            <Panel heading="Leads by status" subheading="Current sample pipeline distribution">
              <Bars items={leadPipeline} />
            </Panel>
            <Panel heading="Lead sources" subheading="Where sample travellers found you">
              <Bars
                items={[...new Set(data.leads.map((l) => l.source))].map((name) => ({
                  name,
                  value: data.leads.filter((l) => l.source === name).length,
                }))}
              />
            </Panel>
          </div>
          <div className="crm-overview-grid">
            <Panel heading="Bookings by stage" subheading="Current status of booked journeys">
              <Bars
                items={bookingStatuses.map((name) => ({
                  name,
                  value: data.bookings.filter((b) => b.status === name).length,
                }))}
              />
            </Panel>
            <Panel heading="Financial snapshot" subheading="Demo only · not a financial statement">
              <div className="crm-report-stat">
                <span>Booking value (excluding cancelled)</span>
                <strong>
                  {money(
                    data.bookings
                      .filter((b) => b.status !== 'Cancelled')
                      .reduce((a, b) => a + b.amount, 0),
                  )}
                </strong>
              </div>
              <div className="crm-report-stat">
                <span>Payments received</span>
                <strong>{money(received)}</strong>
              </div>
              <div className="crm-report-stat">
                <span>Remaining balance</span>
                <strong>{money(outstanding)}</strong>
              </div>
            </Panel>
          </div>
        </>
      )}
      {modal === 'quotation' ? (
        <QuotationForm onClose={() => setModal(null)} />
      ) : modal ? (
        <CrmModal type={modal} onClose={() => setModal(null)} />
      ) : null}
      {selectedLead && (
        <div
          className="crm-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setSelectedLead(null);
          }}
        >
          <aside
            className="crm-detail-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedLead.name} enquiry details`}
          >
            <button
              className="crm-modal-x"
              onClick={() => setSelectedLead(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <span className="crm-overline">ENQUIRY DETAILS</span>
            <div className="crm-drawer-person">
              <Avatar name={selectedLead.name} />
              <div>
                <h2>{selectedLead.name}</h2>
                <p>{selectedLead.id}</p>
              </div>
            </div>
            <Badge
              value={
                data.leads.find((l) => l.id === selectedLead.id)?.status || selectedLead.status
              }
            />
            <div className="crm-drawer-fields">
              {[
                ['Destination', selectedLead.destination],
                ['Travel date', prettyDate(selectedLead.travelDate)],
                ['Travellers', String(selectedLead.travelers)],
                ['Email', selectedLead.email],
                ['Phone', selectedLead.phone],
                ['Lead source', selectedLead.source],
                [
                  'Assigned to',
                  data.leads.find((l) => l.id === selectedLead.id)?.owner || selectedLead.owner,
                ],
                [
                  'Follow-up',
                  prettyDate(data.leads.find((l) => l.id === selectedLead.id)?.nextFollowUp || ''),
                ],
              ].map(([label, val]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
            <LeadManagement key={selectedLead.id} lead={selectedLead} />
            <h3>Original enquiry notes</h3>
            <p className="crm-drawer-notes">{selectedLead.notes || 'No notes added.'}</p>
            <p className="crm-drawer-disclaimer">
              Enquiry changes are saved on the server and shared with Admin.
            </p>
          </aside>
        </div>
      )}
      {selectedCustomer && (
        <div
          className="crm-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setSelectedCustomer(null);
          }}
        >
          <aside
            className="crm-detail-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedCustomer.name} customer details`}
          >
            <button
              className="crm-modal-x"
              onClick={() => setSelectedCustomer(null)}
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <span className="crm-overline">CUSTOMER PROFILE</span>
            <div className="crm-drawer-person">
              <Avatar name={selectedCustomer.name} />
              <div>
                <h2>{selectedCustomer.name}</h2>
                <p>{selectedCustomer.id}</p>
              </div>
            </div>
            <Badge value={selectedCustomer.segment} />
            <div className="crm-drawer-fields">
              {[
                ['Email', selectedCustomer.email],
                ['Phone', selectedCustomer.phone],
                ['City', selectedCustomer.city],
                ['Total trips', String(selectedCustomer.trips)],
                ['Last activity', prettyDate(selectedCustomer.lastActivity)],
              ].map(([label, val]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>
            <p className="crm-drawer-disclaimer">
              This customer comes from a confirmed enquiry or lead. Trip totals include confirmed
              and completed bookings linked by contact details or quotation.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  required = true,
}: {
  label: string;
  name: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="crm-form-field">
      <span>
        {label}
        {required && <i> *</i>}
      </span>
      {children}
    </label>
  );
}
function CrmModal({ type, onClose }: { type: Exclude<ModalType, null>; onClose: () => void }) {
  const store = useDemo();
  const { data } = store;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [recordSearch, setRecordSearch] = useState('');
  const searchText = recordSearch.trim().toLowerCase();
  const searchableRecords = [
    ...data.leads.map((item) => ({
      id: item.id,
      title: item.name,
      kind: 'Enquiry',
      section: 'leads',
      detail: [item.email, item.phone, item.destination].filter(Boolean).join(' · '),
    })),
    ...data.customers.map((item) => ({
      id: item.id,
      title: item.name,
      kind: 'Customer',
      section: 'customers',
      detail: [item.email, item.phone].filter(Boolean).join(' · '),
    })),
    ...data.bookings.map((item) => ({
      id: item.id,
      title: item.customer,
      kind: 'Booking',
      section: 'bookings',
      detail: [item.email, item.phone, item.tour].filter(Boolean).join(' · '),
    })),
    ...data.quotations.map((item) => ({
      id: item.id,
      title: item.customer,
      kind: 'Quotation',
      section: 'quotations',
      detail: item.title,
    })),
  ];
  const matchingRecords = searchText
    ? searchableRecords.filter((item) =>
        `${item.id} ${item.title} ${item.detail}`.toLowerCase().includes(searchText),
      )
    : [];
  const [bookingChoice, setBookingChoice] = useState(
    data.bookings.find((b) => b.status !== 'Cancelled' && b.paid < b.amount)?.id || '',
  );
  const [quoteLead, setQuoteLead] = useState(data.leads.find((l) => l.status !== 'Lost')?.id || '');
  const [quotePick, setQuotePick] = useState('');
  const chosenBooking = data.bookings.find((b) => b.id === bookingChoice);
  const selectedQuote = data.quotations.find((q) => q.id === quotePick);
  const title = {
    lead: 'Add a new enquiry',
    quotation: 'Create quotation draft',
    booking: 'Create a booking',
    payment: 'Record a payment',
    task: 'Add follow-up task',
    supplier: 'Add supplier',
  }[type];
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    const get = (key: string) => String(f.get(key) || '').trim();
    setSaving(true);
    try {
      if (type === 'lead') {
        await store.addLead({
          name: get('name'),
          email: get('email'),
          phone: get('phone'),
          destination: get('destination'),
          travelDate: get('travelDate'),
          travelers: Number(get('travelers')),
          priority: get('priority') as Priority,
          source: get('source'),
          notes: get('notes'),
        });
      }
      if (type === 'quotation') {
        if (!get('leadId')) return setError('Select an enquiry first.');
        await store.addQuotation({
          leadId: get('leadId'),
          title: get('title'),
          amount: Number(get('amount')),
          validUntil: get('validUntil'),
        });
      }
      if (type === 'booking') {
        await store.addBooking({
          customer: get('customer'),
          quoteId: selectedQuote?.id || '',
          tour: get('tour'),
          travelDate: get('travelDate'),
          returnDate: get('returnDate'),
          travelers: Number(get('travelers')),
          amount: Number(get('amount')),
          email: get('email'),
          phone: get('phone'),
          passengers: get('passengers'),
          notes: get('notes'),
        });
      }
      if (type === 'payment') {
        if (!chosenBooking) return setError('Select a booking with an outstanding balance.');
        const amount = Number(get('amount'));
        const remaining = chosenBooking.amount - chosenBooking.paid;
        if (amount <= 0 || amount > remaining)
          return setError(`Enter a positive amount no greater than ${money(remaining)}.`);
        await store.addPayment({
          bookingId: chosenBooking.id,
          amount,
          method: get('method'),
          reference: get('reference'),
        });
      }
      if (type === 'task') {
        await store.addTask({
          title: get('title'),
          leadId: get('leadId'),
          owner: get('owner'),
          dueDate: get('dueDate'),
          priority: get('priority') as Priority,
        });
      }
      if (type === 'supplier') {
        store.addSupplier({
          name: get('name'),
          service: get('service'),
          destination: get('destination'),
          contact: get('contact'),
          notes: get('notes'),
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the record.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div
      className="crm-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="crm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="crm-modal-head">
          <div>
            <span className="crm-overline">Admin WORKSPACE / NEW RECORD</span>
            <h2>{title}</h2>
            <p>
              Enquiries, bookings and payments are stored on the server. Quotations and tasks are
              saved in this browser.
            </p>
          </div>
          <button className="crm-modal-x" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={21} />
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="crm-modal-body">
            <div className="crm-record-search">
              <label className="crm-searchbox">
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search existing CRM records"
                  placeholder="Search name, phone, email, destination or record ID..."
                  value={recordSearch}
                  onChange={(event) => setRecordSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.preventDefault();
                  }}
                />
              </label>
              {searchText && (
                <div className="crm-record-search-results">
                  <p role="status">{matchingRecords.length} matching records</p>
                  {matchingRecords.slice(0, 10).map((item) => (
                    <a
                      key={`${item.section}-${item.id}`}
                      href={`/admin/${item.section}?q=${encodeURIComponent(item.id)}`}
                      onClick={onClose}
                    >
                      <strong>{item.title}</strong>
                      <span>
                        {item.kind} · {item.id}
                      </span>
                      <small>{item.detail}</small>
                    </a>
                  ))}
                  {!matchingRecords.length && <p>No records found. Try another name or contact.</p>}
                  {matchingRecords.length > 10 && (
                    <p>Showing the first 10. Refine your search to find more.</p>
                  )}
                </div>
              )}
            </div>
            {type === 'lead' && (
              <div className="crm-form-grid">
                <Field label="Traveller name" name="name">
                  <input name="name" placeholder="Traveller name" required maxLength={90} />
                </Field>
                <Field label="Destination" name="destination">
                  <input name="destination" placeholder="e.g. Bali" required maxLength={90} />
                </Field>
                <Field label="Email" name="email">
                  <input
                    name="email"
                    type="email"
                    placeholder="demo@example.test"
                    required
                    maxLength={120}
                  />
                </Field>
                <Field label="Phone" name="phone">
                  <input name="phone" placeholder="Contact number" required maxLength={28} />
                </Field>
                <Field label="Travel date" name="travelDate">
                  <input name="travelDate" type="date" required defaultValue={todayISO()} />
                </Field>
                <Field label="Travellers" name="travelers">
                  <input
                    name="travelers"
                    type="number"
                    min="1"
                    max="50"
                    defaultValue="2"
                    required
                  />
                </Field>
                <Field label="Lead source" name="source">
                  <select name="source" defaultValue="Website">
                    <option>Website</option>
                    <option>WhatsApp</option>
                    <option>Referral</option>
                    <option>Instagram</option>
                    <option>Phone</option>
                    <option>Walk-in</option>
                  </select>
                </Field>
                <Field label="Priority" name="priority">
                  <select name="priority" defaultValue="Medium">
                    {priorityOptions.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <div className="crm-form-full">
                  <Field label="Requirements / notes" name="notes" required={false}>
                    <textarea
                      name="notes"
                      rows={3}
                      placeholder="Hotel preferences, trip goals, special requests..."
                      maxLength={500}
                    />
                  </Field>
                </div>
              </div>
            )}
            {type === 'quotation' && (
              <div className="crm-form-grid">
                <div className="crm-form-full">
                  <Field label="Enquiry" name="leadId">
                    <select
                      name="leadId"
                      value={quoteLead}
                      onChange={(e) => setQuoteLead(e.target.value)}
                      required
                    >
                      {data.leads
                        .filter((l) => l.status !== 'Lost')
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} · {l.destination} · {l.id}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>
                <div className="crm-form-full">
                  <Field label="Quotation title" name="title">
                    <input
                      name="title"
                      placeholder="e.g. Bali Tropical Escape"
                      required
                      maxLength={120}
                    />
                  </Field>
                </div>
                <Field label="Indicative total (INR)" name="amount">
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Total value"
                    required
                  />
                </Field>
                <Field label="Valid until" name="validUntil">
                  <input name="validUntil" type="date" required defaultValue={todayISO()} />
                </Field>
                <p className="crm-form-helper crm-form-full">
                  This creates an editable demo record only. PDF export and client email delivery
                  require backend integration.
                </p>
              </div>
            )}
            {type === 'booking' && (
              <div className="crm-form-grid">
                <div className="crm-form-full">
                  <Field label="Booking source" name="quoteId" required={false}>
                    <select
                      name="quoteId"
                      value={quotePick}
                      onChange={(e) => setQuotePick(e.target.value)}
                    >
                      <option value="">Direct booking (no quotation)</option>
                      {data.quotations
                        .filter((q) => !data.bookings.some((b) => b.quoteId === q.id))
                        .map((q) => (
                          <option key={q.id} value={q.id}>
                            {q.id} ? {q.customer} ? {q.title}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>
                <div className="crm-form-full">
                  <Field label="Customer name" name="customer">
                    <input
                      name="customer"
                      defaultValue={selectedQuote?.customer || ''}
                      key={'customer-' + quotePick}
                      required
                      maxLength={90}
                    />
                  </Field>
                </div>
                <Field label="Email" name="email" required={false}>
                  <input name="email" type="email" maxLength={254} />
                </Field>
                <Field label="Phone" name="phone" required={false}>
                  <input name="phone" type="tel" maxLength={28} />
                </Field>
                <div className="crm-form-full">
                  <Field label="Journey / package name" name="tour">
                    <input
                      name="tour"
                      defaultValue={selectedQuote?.title || ''}
                      key={'tour-' + quotePick}
                      required
                      maxLength={120}
                    />
                  </Field>
                </div>
                <Field label="Departure date" name="travelDate">
                  <input name="travelDate" type="date" required defaultValue={todayISO()} />
                </Field>
                <Field label="Return date" name="returnDate" required={false}>
                  <input name="returnDate" type="date" />
                </Field>
                <Field label="Travellers" name="travelers">
                  <input
                    name="travelers"
                    type="number"
                    min="1"
                    max="50"
                    defaultValue="2"
                    required
                  />
                </Field>
                <Field label="Booking total (INR)" name="amount">
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    max="100000000"
                    step="1"
                    required
                    key={'amount-' + quotePick}
                    defaultValue={selectedQuote?.amount || ''}
                  />
                </Field>
                <div className="crm-form-full">
                  <Field label="Passenger names" name="passengers" required={false}>
                    <textarea
                      name="passengers"
                      rows={3}
                      maxLength={3000}
                      placeholder="One passenger name per line"
                    />
                  </Field>
                </div>
                <div className="crm-form-full">
                  <Field label="Booking notes" name="notes" required={false}>
                    <textarea name="notes" rows={3} maxLength={3000} />
                  </Field>
                </div>
                <p className="crm-form-helper crm-form-full">
                  Bookings start as Pending and are stored on the server. Record advances and
                  subsequent payments under Payments. This does not reserve inventory with a travel
                  supplier.
                </p>
              </div>
            )}
            {type === 'payment' && (
              <div className="crm-form-grid">
                <div className="crm-form-full">
                  <Field label="Booking" name="bookingId">
                    <select
                      name="bookingId"
                      value={bookingChoice}
                      onChange={(e) => setBookingChoice(e.target.value)}
                      required
                    >
                      {data.bookings
                        .filter((b) => b.status !== 'Cancelled' && b.paid < b.amount)
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.id} · {b.customer} · Due {money(b.amount - b.paid)}
                          </option>
                        ))}
                    </select>
                  </Field>
                </div>
                <p className="crm-form-helper crm-form-full">
                  Balance remaining:{' '}
                  <strong>
                    {money(chosenBooking ? chosenBooking.amount - chosenBooking.paid : 0)}
                  </strong>
                </p>
                <Field label="Amount received (INR)" name="amount">
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    max={chosenBooking ? chosenBooking.amount - chosenBooking.paid : 0}
                    step="1"
                    required
                  />
                </Field>
                <Field label="Payment method" name="method">
                  <select name="method">
                    <option>UPI</option>
                    <option>Bank transfer</option>
                    <option>Cash</option>
                    <option>Card</option>
                    <option>Other</option>
                  </select>
                </Field>
                <div className="crm-form-full">
                  <Field label="Reference / receipt note" name="reference">
                    <input
                      name="reference"
                      required
                      maxLength={90}
                      placeholder="e.g. DEMO-UPI-1234"
                    />
                  </Field>
                </div>
                <p className="crm-form-helper crm-form-full">
                  Records a received payment against the booking balance. It does not process or
                  collect money.
                </p>
              </div>
            )}
            {type === 'task' && (
              <div className="crm-form-grid">
                <div className="crm-form-full">
                  <Field label="Task description" name="title">
                    <input
                      name="title"
                      required
                      maxLength={150}
                      placeholder="e.g. Call traveller to confirm dates"
                    />
                  </Field>
                </div>
                <Field label="Related enquiry" name="leadId" required={false}>
                  <select name="leadId">
                    <option value="">No linked enquiry</option>
                    {data.leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.id} · {l.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Assigned to" name="owner">
                  <input name="owner" placeholder="Employee name" required maxLength={60} />
                </Field>
                <Field label="Due date" name="dueDate">
                  <input name="dueDate" type="date" defaultValue={todayISO()} required />
                </Field>
                <Field label="Priority" name="priority">
                  <select name="priority" defaultValue="Medium">
                    {priorityOptions.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
            {type === 'supplier' && (
              <div className="crm-form-grid">
                <div className="crm-form-full">
                  <Field label="Supplier name" name="name">
                    <input
                      name="name"
                      required
                      maxLength={100}
                      placeholder="e.g. Local hotel partner"
                    />
                  </Field>
                </div>
                <Field label="Service" name="service">
                  <select name="service">
                    <option>Hotels</option>
                    <option>Transport</option>
                    <option>Activities</option>
                    <option>Guide</option>
                    <option>Other</option>
                  </select>
                </Field>
                <Field label="Destination" name="destination">
                  <input name="destination" required maxLength={90} />
                </Field>
                <div className="crm-form-full">
                  <Field label="Contact email" name="contact">
                    <input
                      name="contact"
                      type="email"
                      required
                      maxLength={120}
                      placeholder="supplier@example.test"
                    />
                  </Field>
                </div>
                <div className="crm-form-full">
                  <Field label="Notes" name="notes" required={false}>
                    <textarea name="notes" rows={3} maxLength={500} />
                  </Field>
                </div>
              </div>
            )}
            {error && (
              <p role="alert" className="crm-form-error">
                <CircleAlert size={15} />
                {error}
              </p>
            )}
          </div>
          <div className="crm-modal-footer">
            <button type="button" onClick={onClose} className="crm-btn crm-btn-light">
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn crm-btn-primary"
              disabled={
                saving ||
                (['lead', 'task', 'quotation'].includes(type) && !store.leadsReady) ||
                ((type === 'payment' || type === 'booking') && !store.bookingsReady) ||
                (type === 'payment' && !chosenBooking) ||
                (type === 'quotation' && !quoteLead)
              }
            >
              <Check size={16} /> {saving ? 'Saving...' : 'Save record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
