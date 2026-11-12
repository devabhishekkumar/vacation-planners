import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DemoProvider } from '@/features/crm/demo-store';
import CrmShell from '@/components/crm/CrmShell';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin | Vacation Planners',
  description:
    'Interactive frontend demonstration of the internal travel Admin. No real customer data.',
  robots: { index: false, follow: false },
};
export default async function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DemoProvider>
      <CrmShell>{children}</CrmShell>
    </DemoProvider>
  );
}
