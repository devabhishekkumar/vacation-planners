'use server';
import { redirect } from 'next/navigation';
import { endCustomerSession } from './customer-session';
export async function customerLogout() {
  await endCustomerSession();
  redirect('/login/customer');
}
