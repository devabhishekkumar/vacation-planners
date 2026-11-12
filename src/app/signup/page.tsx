import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentCustomer } from '@/lib/auth/customer-session';
import { customerNext } from '@/lib/auth/customer-account';
import CustomerAuthForm from '@/components/auth/CustomerAuthForm';
import '../portal.css';
export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = customerNext((await searchParams).next);
  if (await currentCustomer()) redirect(next);
  return (
    <main className="portal-page" id="main-content">
      <section className="portal-card portal-login">
        <span className="portal-eyebrow">VACATION PLANNERS</span>
        <h1>Create your account</h1>
        <p>Save your booking requests and follow their progress.</p>
        <CustomerAuthForm signup next={next} />
        <Link href="/packages">Back to packages</Link>
      </section>
    </main>
  );
}
