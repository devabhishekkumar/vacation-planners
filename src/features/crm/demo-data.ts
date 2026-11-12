/** Types for the local CRM workspace. Initial records are empty. */
export type LeadStatus = 'New' | 'Contacted' | 'Follow-up' | 'Quoted' | 'Confirmed' | 'Lost';
export type Priority = 'High' | 'Medium' | 'Low';
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Expired';
export type BookingStatus = 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  destination: string;
  travelers: number;
  travelDate: string;
  status: LeadStatus;
  priority: Priority;
  source: string;
  owner: string;
  createdAt: string;
  nextFollowUp: string;
  notes: string;
};
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  trips: number;
  segment: 'New' | 'Repeat' | 'VIP';
  lastActivity: string;
};
export type Quotation = {
  details?: import('./quotation').QuotationDetails;
  id: string;
  leadId: string;
  customer: string;
  title: string;
  amount: number;
  status: QuoteStatus;
  createdAt: string;
  validUntil: string;
};
export type Booking = {
  customerId?: string;
  pricingPending?: boolean;
  source?: string;
  packageSlug?: string;
  email?: string;
  phone?: string;
  returnDate?: string;
  passengers?: string;
  notes?: string;
  id: string;
  customer: string;
  tour: string;
  travelDate: string;
  travelers: number;
  amount: number;
  paid: number;
  status: BookingStatus;
  quoteId: string;
};
export type Payment = {
  id: string;
  bookingId: string;
  customer: string;
  amount: number;
  method: string;
  date: string;
  reference: string;
};
export type Task = {
  id: string;
  title: string;
  leadId: string;
  owner: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
};
export type Supplier = {
  id: string;
  name: string;
  service: string;
  destination: string;
  contact: string;
  status: 'Active' | 'On hold';
  notes: string;
};
export type Activity = {
  id: string;
  leadId: string;
  message: string;
  at: string;
};
export type DemoStore = {
  activities: Activity[];
  leads: Lead[];
  customers: Customer[];
  quotations: Quotation[];
  bookings: Booking[];
  payments: Payment[];
  tasks: Task[];
  suppliers: Supplier[];
};
export const leadStatuses: LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'Quoted',
  'Confirmed',
  'Lost',
];
export const quoteStatuses: QuoteStatus[] = ['Draft', 'Sent', 'Accepted', 'Expired'];
export const bookingStatuses: BookingStatus[] = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
export const todayISO = () =>
  new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
export function prettyDate(value: string) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
}
export const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const legacyDemoIds: Record<keyof DemoStore, string[]> = {
  activities: [],
  leads: ['LD-1042', 'LD-1041', 'LD-1040', 'LD-1039', 'LD-1038', 'LD-1037'],
  customers: ['CU-011', 'CU-010', 'CU-009', 'CU-008', 'CU-007'],
  quotations: ['QT-3105', 'QT-3104', 'QT-3103', 'QT-3102'],
  bookings: ['BK-2050', 'BK-2049', 'BK-2048', 'BK-2047'],
  payments: ['PM-9301', 'PM-9300', 'PM-9299', 'PM-9298'],
  tasks: ['TK-401', 'TK-400', 'TK-399', 'TK-398'],
  suppliers: ['SP-118', 'SP-117', 'SP-116'],
};
export function freshDemoStore(): DemoStore {
  return {
    activities: [],
    leads: [],
    customers: [],
    quotations: [],
    bookings: [],
    payments: [],
    tasks: [],
    suppliers: [],
  };
}
/** Remove only shipped sample IDs, preserving records created by the user. */
export function removeDemoRecords(value: DemoStore): DemoStore {
  const result = { ...freshDemoStore(), ...value };
  for (const key of Object.keys(legacyDemoIds) as (keyof DemoStore)[]) {
    const rows = result[key];
    if (Array.isArray(rows))
      Object.assign(result, {
        [key]: rows.filter((row) => !legacyDemoIds[key].includes(row.id)),
      });
  }
  result.activities = result.activities.filter((a) => !legacyDemoIds.leads.includes(a.leadId));
  return result;
}
