import { customerProfile } from '@/lib/auth/customer-profile';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSiteContent } from '@/lib/content/service';
import { requireCustomer } from '@/lib/auth/customer-session';
import WebsiteBookingForm from '@/components/WebsiteBookingForm';
export default async function BookPackage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { packages } = await getSiteContent();
  const getPackage = (slug: string) => packages.find((p) => p.slug === slug);
  const { slug } = await params;
  const tour = getPackage(slug);
  if (!tour) notFound();
  const customer = await requireCustomer('/book/' + tour.slug);
  const profile = await customerProfile(customer.id);
  return (
    <section className="section section-warm">
      <div className="container enquiry-section-layout">
        <div>
          <span className="eyebrow">COMPLETE YOUR BOOKING REQUEST</span>
          <h1>
            Book your <em>escape.</em>
          </h1>
          <p>
            You are signed in as {customer.name}. Choose your dates and traveller details to request{' '}
            {tour.title}.
          </p>
          <p>
            Our team will confirm availability and the final price. No payment is collected at this
            stage.
          </p>
          <Link href={'/packages/' + tour.slug} className="text-link">
            Back to package details
          </Link>
        </div>
        <div className="form-shell">
          <WebsiteBookingForm
            packageSlug={tour.slug}
            packageName={tour.title}
            duration={tour.duration}
            customerName={customer.name}
            customerEmail={customer.email}
            customerPhone={profile.phone}
          />
        </div>
      </div>
    </section>
  );
}
