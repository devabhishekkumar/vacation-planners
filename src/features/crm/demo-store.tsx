'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { customersFromConfirmedLeads } from './customers';
import {
  createId,
  freshDemoStore,
  removeDemoRecords,
  todayISO,
  type Booking,
  type BookingStatus,
  type DemoStore,
  type Lead,
  type LeadStatus,
  type Payment,
  type Priority,
  type Quotation,
  type QuoteStatus,
  type Supplier,
  type Task,
} from './demo-data';

const KEY = 'vacation-planners-crm-demo-v1';
type NewLead = Pick<
  Lead,
  | 'name'
  | 'email'
  | 'phone'
  | 'destination'
  | 'travelDate'
  | 'travelers'
  | 'priority'
  | 'source'
  | 'notes'
>;
type NewQuotation = Pick<Quotation, 'leadId' | 'title' | 'amount' | 'validUntil' | 'details'>;
type NewBooking = Pick<
  Booking,
  | 'customer'
  | 'tour'
  | 'travelDate'
  | 'travelers'
  | 'amount'
  | 'quoteId'
  | 'email'
  | 'phone'
  | 'returnDate'
  | 'passengers'
  | 'notes'
>;
type NewPayment = Pick<Payment, 'bookingId' | 'amount' | 'method' | 'reference'>;
type NewTask = Pick<Task, 'title' | 'leadId' | 'owner' | 'dueDate' | 'priority'>;
type DemoContextValue = {
  data: DemoStore;
  bookingsReady: boolean;
  bookingError: string;
  leadError: string;
  leadsReady: boolean;
  addLead: (item: NewLead) => Promise<void>;
  updateLead: (id: string, status: LeadStatus) => Promise<void>;
  editLead: (id: string, changes: Pick<Lead, 'owner' | 'nextFollowUp' | 'notes'>) => Promise<void>;
  addQuotation: (item: NewQuotation) => Promise<void>;
  updateQuotation: (id: string, status: QuoteStatus) => void;
  setBookingPrice: (id: string, amount: number) => Promise<void>;
  addBooking: (item: NewBooking) => Promise<void>;
  updateBooking: (id: string, status: BookingStatus) => Promise<void>;
  addPayment: (item: NewPayment) => Promise<void>;
  addTask: (item: NewTask) => Promise<void>;
  toggleTask: (id: string) => void;
  addSupplier: (
    item: Pick<Supplier, 'name' | 'service' | 'destination' | 'contact' | 'notes'>,
  ) => void;
  reset: () => void;
};
const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DemoStore>(freshDemoStore);
  const [hydrated, setHydrated] = useState(false);
  const [bookingsReady, setBookingsReady] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [leadError, setLeadError] = useState('');
  const [leadsReady, setLeadsReady] = useState(false);
  async function leadRequest(body?: Record<string, unknown>) {
    const response = await fetch(
      '/api/admin/leads',
      body
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
          }
        : { cache: 'no-store' },
    );
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Could not load enquiries.');
    return result as Pick<DemoStore, 'leads'>;
  }
  async function saveLeadOperation(body: Record<string, unknown>) {
    try {
      const result = await leadRequest(body);
      setData((s) => ({ ...s, ...result }));
      setLeadError('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save enquiry.';
      setLeadError(message);
      throw Error(message);
    }
  }

  async function bookingRequest(body?: Record<string, unknown>) {
    const response = await fetch(
      '/api/bookings',
      body
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
          }
        : { cache: 'no-store' },
    );
    const result = await response.json();
    if (!response.ok) throw Error(result.error || 'Could not load bookings.');
    return result as Pick<DemoStore, 'bookings' | 'payments'>;
  }
  async function saveBookingOperation(body: Record<string, unknown>) {
    try {
      const result = await bookingRequest(body);
      setData((s) => ({ ...s, ...result }));
      setBookingError('');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save booking.';
      setBookingError(message);
      throw Error(message);
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      let local = freshDemoStore();
      try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) {
          const value = JSON.parse(raw) as DemoStore;
          if (
            value &&
            Array.isArray(value.leads) &&
            Array.isArray(value.bookings) &&
            Array.isArray(value.tasks) &&
            Array.isArray(value.suppliers)
          )
            local = removeDemoRecords({ ...local, ...value });
        }
      } catch {}
      if (active) {
        setData(local);
        setHydrated(true);
      }
      try {
        const result = local.bookings.length
          ? await bookingRequest({
              operation: 'import',
              bookings: local.bookings,
              payments: local.payments,
            })
          : await bookingRequest();
        if (active) {
          setData((s) => ({ ...s, ...result }));
          setBookingsReady(true);
          setBookingError('');
        }
      } catch (e) {
        if (active)
          setBookingError(e instanceof Error ? e.message : 'Could not connect to booking storage.');
      }
    }
    void load();
    const refresh = () => {
      void bookingRequest()
        .then((result) => {
          if (active) {
            setData((s) => ({ ...s, ...result }));
            setBookingsReady(true);
            setBookingError('');
          }
        })
        .catch((e) => {
          if (active)
            setBookingError(e instanceof Error ? e.message : 'Could not refresh bookings.');
        });
    };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let local: Lead[] = [];
        try {
          const raw = window.localStorage.getItem(KEY);
          if (raw) {
            const saved = JSON.parse(raw);
            if (Array.isArray(saved.leads))
              local = removeDemoRecords({ ...freshDemoStore(), leads: saved.leads }).leads;
          }
        } catch {}
        const result = await leadRequest(
          local.length ? { operation: 'import', leads: local } : undefined,
        );
        if (active) {
          setData((s) => ({ ...s, ...result }));
          setLeadsReady(true);
          setLeadError('');
        }
      } catch (e) {
        if (active) setLeadError(e instanceof Error ? e.message : 'Could not load enquiries.');
      }
    }
    void load();
    const refresh = () => {
      void leadRequest()
        .then((result) => {
          if (active) {
            setData((s) => ({ ...s, ...result }));
            setLeadsReady(true);
            setLeadError('');
          }
        })
        .catch((e) => {
          if (active) setLeadError(e instanceof Error ? e.message : 'Could not refresh enquiries.');
        });
    };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* Private browsing can block storage. */
    }
  }, [data, hydrated]);
  const value: DemoContextValue = {
    data: { ...data, customers: customersFromConfirmedLeads(data) },
    bookingsReady,
    bookingError,
    leadError,
    leadsReady,
    addLead: async (item) => {
      await saveLeadOperation({ operation: 'create', item });
    },
    updateLead: async (id, status) => {
      await saveLeadOperation({ operation: 'patch', id, changes: { status } });
      setData((s) => ({
        ...s,
        activities: [
          {
            id: createId('ACT'),
            leadId: id,
            message: 'Status changed to ' + status,
            at: new Date().toISOString(),
          },
          ...s.activities,
        ],
      }));
    },
    editLead: async (id, changes) => {
      await saveLeadOperation({ operation: 'patch', id, changes });
      setData((s) => ({
        ...s,
        tasks: s.tasks.map((t) =>
          t.leadId === id && !t.completed
            ? {
                ...t,
                owner: changes.owner,
                ...(changes.nextFollowUp ? { dueDate: changes.nextFollowUp } : {}),
              }
            : t,
        ),
        activities: [
          {
            id: createId('ACT'),
            leadId: id,
            message: 'Assignment, follow-up and notes saved',
            at: new Date().toISOString(),
          },
          ...s.activities,
        ],
      }));
    },
    addQuotation: async (item) => {
      const lead = data.leads.find((l) => l.id === item.leadId);
      if (!lead && !item.details?.company)
        throw Error('Enter the traveller name or choose an enquiry.');
      if (lead && lead.status !== 'Confirmed')
        await saveLeadOperation({ operation: 'patch', id: lead.id, changes: { status: 'Quoted' } });
      setData((s) => ({
        ...s,
        quotations: [
          {
            ...item,
            id: item.details?.number || createId('QT'),
            customer: item.details?.company || lead!.name,
            status: 'Draft',
            createdAt: item.details?.date || todayISO(),
          },
          ...s.quotations,
        ],
      }));
    },
    updateQuotation: (id, status) =>
      setData((s) => ({
        ...s,
        quotations: s.quotations.map((x) => (x.id === id ? { ...x, status } : x)),
      })),
    setBookingPrice: async (id, amount) => {
      await saveBookingOperation({ operation: 'price', id, amount });
    },
    addBooking: async (item) => {
      await saveBookingOperation({ operation: 'create', item });
    },
    updateBooking: async (id, status) => {
      await saveBookingOperation({ operation: 'status', id, status });
    },
    addPayment: async (item) => {
      await saveBookingOperation({ operation: 'payment', item });
    },
    addTask: async (item) => {
      if (item.leadId)
        await saveLeadOperation({
          operation: 'patch',
          id: item.leadId,
          changes: { owner: item.owner, nextFollowUp: item.dueDate },
        });
      setData((s) => ({
        ...s,
        tasks: [{ ...item, id: createId('TK'), completed: false }, ...s.tasks],
        activities: [
          {
            id: createId('ACT'),
            leadId: item.leadId,
            message: 'Follow-up scheduled: ' + item.title,
            at: new Date().toISOString(),
          },
          ...s.activities,
        ],
      }));
    },
    toggleTask: (id) =>
      setData((s) => {
        const task = s.tasks.find((t) => t.id === id);
        if (!task) return s;
        return {
          ...s,
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)),
          activities: [
            {
              id: createId('ACT'),
              leadId: task.leadId,
              message: 'Follow-up ' + (task.completed ? 'reopened: ' : 'completed: ') + task.title,
              at: new Date().toISOString(),
            },
            ...s.activities,
          ],
        };
      }),
    addSupplier: (item) =>
      setData((s) => ({
        ...s,
        suppliers: [{ ...item, id: createId('SP'), status: 'Active' }, ...s.suppliers],
      })),
    reset: () => setData(freshDemoStore()),
  };
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw Error('useDemo requires DemoProvider');
  return context;
}
export const priorityOptions: Priority[] = ['High', 'Medium', 'Low'];
