import { db, type User } from '@/lib/auth/database';
import { enquiries } from '@/lib/auth/queries';
import { Portal, LeadList, EnquiryForm } from '@/components/auth/Portal';
import '../portal.css';
export const dynamic = 'force-dynamic';
export default async function Workspace({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const leads = await enquiries();
  const { message } = await searchParams;
  const customers = db()
    .prepare("SELECT id,name,email,role,active FROM users WHERE role='customer' ORDER BY name")
    .all() as User[];
  return (
    <Portal>
      <h1>Team workspace</h1>
      <p>Manage leads, notes and follow-up dates. Changes are shared with the Admin page.</p>
      {message && (
        <p className="portal-notice" role="status">
          {message}
        </p>
      )}
      <LeadList leads={leads} />
    </Portal>
  );
}
