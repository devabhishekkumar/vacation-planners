import { notFound } from 'next/navigation';
import CrmWorkspace from '@/components/crm/CrmWorkspace';
export const dynamicParams = false;
export function generateStaticParams() {
  return [
    'leads',
    'customers',
    'quotations',
    'bookings',
    'payments',
    'tasks',
    'suppliers',
    'reports',
    'admin',
  ].map((section) => ({ section }));
}
export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (
    ![
      'leads',
      'customers',
      'quotations',
      'bookings',
      'payments',
      'tasks',
      'suppliers',
      'reports',
      'admin',
    ].includes(section)
  )
    notFound();
  return <CrmWorkspace section={section} />;
}
