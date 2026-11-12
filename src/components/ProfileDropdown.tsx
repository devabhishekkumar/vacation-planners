'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import {
  ChevronDown,
  UserRound,
  Luggage,
  LogOut,
  LogIn,
  UserPlus,
  ArrowUpRight,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { customerLogout } from '@/lib/auth/customer-actions';
type Account = { name: string; email: string };
export default function ProfileDropdown({ onOpen }: { onOpen?: () => void }) {
  const [open, setOpen] = useState(false),
    [user, setUser] = useState<Account | null>(null),
    [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null),
    button = useRef<HTMLButtonElement>(null),
    id = useId(),
    pathname = usePathname();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setFailed(false);
    fetch('/api/customer/session', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw Error('Could not check account.');
        return r.json();
      })
      .then((data) => {
        if (active) {
          setUser(data.user);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [pathname, open]);
  useEffect(() => {
    if (!open) return;
    function outside(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div
      ref={ref}
      className="profile-dropdown"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        className="profile-dropdown-trigger"
        aria-label="Customer account"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (!open) onOpen?.();
          setOpen((v) => !v);
        }}
      >
        <UserRound size={17} />
        <span>My Profile</span>
        <ChevronDown size={13} className={open ? 'profile-chevron-open' : ''} />
      </button>
      {open && (
        <div className="profile-dropdown-panel" id={id}>
          <div className="profile-dropdown-account">
            <span className="profile-dropdown-avatar" aria-hidden="true">
              {user ? (
                user.name
                  .split(/\s+/)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              ) : (
                <UserRound size={21} />
              )}
            </span>
            <div>
              <strong>{user?.name || 'Your travel account'}</strong>
              <small>{user?.email || 'Your details. Your journeys.'}</small>
            </div>
          </div>
          <nav aria-label="Profile navigation">
            <Link href="/customer/profile" onClick={() => setOpen(false)}>
              <span className="profile-menu-icon">
                <UserRound size={17} />
              </span>
              <span>
                <strong>My Profile</strong>
                <small>Personal details & preferences</small>
              </span>
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/customer" onClick={() => setOpen(false)}>
              <span className="profile-menu-icon">
                <Luggage size={17} />
              </span>
              <span>
                <strong>My Bookings</strong>
                <small>Trips, requests & payment history</small>
              </span>
              <ArrowUpRight size={14} />
            </Link>
          </nav>
          <div className="profile-dropdown-footer">
            {loading ? (
              <p role="status">Checking your account...</p>
            ) : failed ? (
              <Link href="/customer">
                Open my account <ArrowUpRight size={14} />
              </Link>
            ) : user ? (
              <form action={customerLogout}>
                <button type="submit">
                  <LogOut size={16} /> Sign out
                </button>
              </form>
            ) : (
              <>
                <Link href="/login/customer">
                  <LogIn size={16} /> Sign in
                </Link>
                <Link href="/signup">
                  <UserPlus size={16} /> Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
