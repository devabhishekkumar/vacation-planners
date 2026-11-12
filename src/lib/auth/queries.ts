import { db, type Enquiry } from './database';
export async function enquiries() {
  return (await db().all(
    'SELECT e.*,c.name customer_name,t.name employee_name FROM enquiries e JOIN users c ON c.id=e.customer_id LEFT JOIN users t ON t.id=e.assigned_to ORDER BY e.created_at DESC',
  )) as Enquiry[];
}
