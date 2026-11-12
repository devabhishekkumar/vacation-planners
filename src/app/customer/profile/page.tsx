import SiteHeader from '@/components/SiteHeader';
import Link from 'next/link';
import { ArrowUpRight, Compass, Mail, MapPin, Luggage, Check, UserRound } from 'lucide-react';
import { requireCustomer } from '@/lib/auth/customer-session';
import { customerProfile } from '@/lib/auth/customer-profile';
import { customerBookings } from '@/lib/booking-service';
import '../account.css';
import CustomerProfileForm from '@/components/auth/CustomerProfileForm';
import '../../portal.css';
export const dynamic = 'force-dynamic';
export default async function Profile() {
  const user = await requireCustomer('/customer/profile'),
    profile = await customerProfile(user.id);
  const { bookings } = await customerBookings(user.id);
  const initials = profile.name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const filled = [
    profile.name,
    profile.email,
    profile.phone,
    profile.city,
    profile.address,
    profile.preferences,
  ].filter(Boolean).length;
  return (
    <>
      <SiteHeader />
      <main className="portal-page customer-account-page" id="main-content">
        <section className="customer-profile-hero">
          <div>
            <span className="customer-account-eyebrow">A SPACE THAT&apos;S YOURS</span>
            <h1>
              My profile<span>.</span>
            </h1>
            <p>A few details for journeys that feel a little more you.</p>
          </div>
          <Compass
            className="customer-hero-compass"
            size={160}
            strokeWidth={0.7}
            aria-hidden="true"
          />
          <span className="customer-hero-caption">
            <UserRound size={15} /> YOUR PERSONAL TRAVEL SPACE
          </span>
        </section>
        <div className="customer-profile-layout">
          <aside className="customer-profile-sidebar">
            <section className="portal-card customer-profile-summary">
              <div className="customer-profile-avatar" aria-hidden="true">
                {initials}
              </div>
              <span className="customer-traveller-label">TRAVELLER ACCOUNT</span>
              <h2>{profile.name}</h2>
              <p>
                <Mail size={14} />
                {profile.email}
              </p>
              {profile.city && (
                <p>
                  <MapPin size={14} />
                  {profile.city}
                </p>
              )}
              <div className="customer-profile-progress">
                <div>
                  <strong>Profile details</strong>
                  <span>{filled} of 6 added</span>
                </div>
                <div className="customer-profile-progress-track">
                  <span style={{ width: (filled / 6) * 100 + '%' }} />
                </div>
                <small>
                  {filled === 6
                    ? 'All set for more personal travel planning.'
                    : 'Add a little more so we can plan around you.'}
                </small>
              </div>
              <div className="customer-profile-counts">
                <div>
                  <Luggage size={17} />
                  <strong>{bookings.length}</strong>
                  <span>Bookings</span>
                </div>
                <div>
                  <Check size={17} />
                  <strong>
                    {
                      bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Completed')
                        .length
                    }
                  </strong>
                  <span>Confirmed journeys</span>
                </div>
              </div>
              <Link href="/customer" className="customer-sidebar-link">
                View my bookings <ArrowUpRight size={16} />
              </Link>
            </section>
            <Link href="/packages" className="customer-explore-card">
              <Compass size={26} />
              <div>
                <strong>Where to next?</strong>
                <span>A new favourite place is waiting.</span>
              </div>
              <ArrowUpRight size={20} />
            </Link>
          </aside>
          <section className="portal-card customer-profile-editor">
            <div className="customer-editor-heading">
              <div className="customer-section-icon">
                <UserRound size={21} />
              </div>
              <div>
                <h2>Personal details</h2>
                <p>The essentials for a smoother journey.</p>
              </div>
            </div>
            <CustomerProfileForm profile={profile} />
          </section>
        </div>
        <p className="customer-account-footer">Thoughtfully planned journeys. Made for you.</p>
      </main>
    </>
  );
}
