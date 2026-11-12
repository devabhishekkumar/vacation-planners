'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CalendarCheck,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Compass,
  CreditCard,
  FileText,
  Globe2,
  Handshake,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Search,
  Settings2,
  Star,
  Users,
  UserRoundSearch,
  X,
} from 'lucide-react';
import { useDemo } from '@/features/crm/demo-store';
import { prettyDate } from '@/features/crm/demo-data';

const groups = [
  {
    label: 'WORKSPACE',
    links: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard },
      { href: '/admin/leads', label: 'Enquiries & leads', icon: UserRoundSearch },
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/quotations', label: 'Quotations', icon: FileText },
      { href: '/admin/bookings', label: 'Bookings', icon: PackageCheck },
      { href: '/admin/travel', label: 'Trip management', icon: Compass },
    ],
  },
  {
    label: 'OPERATIONS',
    links: [
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/tasks', label: 'Follow-up tasks', icon: CalendarCheck },
      { href: '/admin/suppliers', label: 'Suppliers', icon: Handshake },
      { href: '/admin/reports', label: 'Reports', icon: ChartNoAxesColumnIncreasing },
      { href: '/admin/admin', label: 'Team & activity', icon: Users },
      { href: '/admin/reviews', label: 'Customer reviews', icon: Star },
      { href: '/admin/content', label: 'Website content', icon: Settings2 },
    ],
  },
];
const sectionNames: Record<string, string> = {
  crm: 'Overview',
  leads: 'Enquiries & leads',
  customers: 'Customers',
  quotations: 'Quotations',
  bookings: 'Bookings',
  travel: 'Trip management',
  payments: 'Payments',
  tasks: 'Follow-up tasks',
  suppliers: 'Suppliers',
  reports: 'Reports',
  admin: 'Team & activity',
  reviews: 'Customer reviews',
  content: 'Website content',
};

export default function CrmShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [search, setSearch] = useState('');
  const { data } = useDemo();
  const pathname = usePathname();
  const section = pathname.split('/')[2] || 'crm';
  const pending = data.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  useEffect(() => {
    setMenuOpen(false);
    setNotifications(false);
  }, [pathname]);
  return (
    <div className="crm-app">
      {menuOpen && (
        <button
          className="crm-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`crm-sidebar ${menuOpen ? 'crm-sidebar-open' : ''}`}>
        <div className="crm-sidebar-top">
          <Link href="/admin" className="crm-brand" aria-label="Vacation Planners Admin home">
            <span className="crm-brand-mark">
              <Compass size={23} />
            </span>
            <span>
              <strong>
                vacation<span>planners.</span>
              </strong>
              <small>TRAVEL MANAGEMENT</small>
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
            className="crm-close-nav"
          >
            <X size={20} />
          </button>
        </div>
        <div className="crm-sidebar-workspace">
          <div className="crm-workspace-icon">
            <Globe2 size={21} />
          </div>
          <div>
            <strong>Vacation Planners</strong>
            <span>Internal workspace</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <nav className="crm-sidebar-nav" aria-label="Admin sections">
          {groups.map((group) => (
            <div className="crm-nav-group" key={group.label}>
              <div className="crm-nav-heading">{group.label}</div>
              {group.links.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={`crm-side-link ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.label === 'Follow-up tasks' && pending.length > 0 && (
                      <span className="crm-nav-count">{pending.length}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="crm-sidebar-bottom">
          <div className="crm-demo-note">
            <span className="crm-demo-dot" /> LOCAL WORKSPACE
            <p>
              Website enquiries appear automatically. Enquiries, bookings and payments use server
              storage.
            </p>
          </div>
          <Link href="/" className="crm-back-site">
            <ArrowLeft size={16} /> View public website <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="crm-main-shell">
        <header className="crm-topbar">
          <div className="crm-topbar-left">
            <button
              className="crm-menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open Admin navigation"
              aria-expanded={menuOpen}
            >
              <Menu size={22} />
            </button>
            <span className="crm-topbar-location">Workspace</span>
            <span className="crm-crumb-divider">/</span>
            <strong>{sectionNames[section] || 'Dashboard'}</strong>
          </div>
          <div className="crm-topbar-actions">
            <form className="crm-global-search" action="/admin/leads" method="GET">
              <Search size={17} />
              <input
                name="q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                aria-label="Search leads"
              />
              <kbd>↵</kbd>
            </form>
            <div className="crm-notif-wrap">
              <button
                className="crm-icon-btn"
                aria-label="View follow-up reminders"
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                {pending.length > 0 && <span className="crm-notif-dot" />}
              </button>
              {notifications && (
                <div className="crm-notif-popover">
                  <strong>Upcoming follow-ups</strong>
                  <p>From your local workspace</p>
                  {pending.length ? (
                    pending.slice(0, 5).map((t) => (
                      <Link key={t.id} href="/admin/tasks">
                        <span>{t.title}</span>
                        <small>
                          {prettyDate(t.dueDate)} · {t.owner}
                        </small>
                      </Link>
                    ))
                  ) : (
                    <p>You&apos;re all caught up.</p>
                  )}
                </div>
              )}
            </div>
            <div className="crm-user-avatar" aria-label="Administrator">
              VP
            </div>
          </div>
        </header>
        <main className="crm-content" id="main-content">
          <div className="crm-demo-strip">
            <span className="crm-live-dot" />
            <strong>Local workspace</strong>
            <span>
              Enquiries, bookings and payments are saved on the server. Other records stay in this
              browser.
            </span>
            <Link href="/admin/reports">View reports</Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
