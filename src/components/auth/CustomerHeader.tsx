import { LogOut } from 'lucide-react';
import CustomerAccountNav from './CustomerAccountNav';
import { customerLogout } from '@/lib/auth/customer-actions';
import type { CustomerAccount } from '@/lib/auth/customer-account';
import '../../app/customer/account.css';
export default function CustomerHeader({ user }: { user: CustomerAccount }) {
  const initials = user.name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <header className="customer-account-header">
      <CustomerAccountNav />
      <div className="customer-account-user">
        <span className="customer-account-mini-avatar" aria-hidden="true">
          {initials}
        </span>
        <div>
          <strong>{user.name}</strong>
          <small>YOUR TRAVEL ACCOUNT</small>
        </div>
        <form action={customerLogout}>
          <button className="customer-signout" title="Sign out" aria-label="Sign out">
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
