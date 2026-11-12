import { redirect } from 'next/navigation';
import { customerNext } from '@/lib/auth/customer-account';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  redirect('/login/customer?next=' + encodeURIComponent(customerNext((await searchParams).next)));
}
