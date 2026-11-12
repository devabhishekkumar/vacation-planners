import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentCustomer } from '@/lib/auth/customer-session';
import { customerNext } from '@/lib/auth/customer-account';
import CustomerAuthForm from '@/components/auth/CustomerAuthForm';
export default async function CustomerLogin({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { role } = await params;
  if (role !== 'customer') redirect('/admin');
  const next = customerNext((await searchParams).next);
  if (await currentCustomer()) redirect(next);
  return (
    <section className="portal-card portal-login">
      <span className="portal-eyebrow">VACATION PLANNERS</span>
      <h1>Customer login</h1>
      <p>
        {next.startsWith('/book/')
          ? 'Sign in to continue booking your selected package.'
          : 'Sign in to view your bookings.'}
      </p>
      <CustomerAuthForm next={next} />
      <Link href="/packages">Back to packages</Link>
    </section>
  );
}
