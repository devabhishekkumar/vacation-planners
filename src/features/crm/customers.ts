import type { Customer, DemoStore, Lead } from './demo-data';

const emailKey = (value: string) => value.trim().toLowerCase();
const phoneKey = (value: string) => value.replace(/\D/g, '');
const sameContact = (
  a: { email?: string; phone?: string },
  b: { email?: string; phone?: string },
) =>
  Boolean(
    (a.email && b.email && emailKey(a.email) === emailKey(b.email)) ||
    (a.phone && b.phone && phoneKey(a.phone) && phoneKey(a.phone) === phoneKey(b.phone)),
  );

/** Customer membership follows the persisted lead status, including after a reload. */
export function customersFromConfirmedLeads(data: DemoStore): Customer[] {
  const groups: Lead[][] = [];
  for (const lead of data.leads.filter((item) => item.status === 'Confirmed')) {
    const matching = groups.filter((group) => group.some((item) => sameContact(item, lead)));
    const merged = [lead, ...matching.flat()];
    for (const group of matching) groups.splice(groups.indexOf(group), 1);
    groups.push(merged);
  }
  return groups.map((group) => {
    const ordered = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const latest = [...group].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const leadIds = new Set(group.map((lead) => lead.id));
    const quoteIds = new Set(data.quotations.filter((q) => leadIds.has(q.leadId)).map((q) => q.id));
    const bookings = data.bookings.filter(
      (booking) =>
        ['Confirmed', 'Completed'].includes(booking.status) &&
        (quoteIds.has(booking.quoteId) || group.some((lead) => sameContact(lead, booking))),
    );
    return {
      id: `CU-${ordered[0].id}`,
      name: latest.name,
      email: latest.email,
      phone: latest.phone,
      city: 'Not provided',
      trips: bookings.length,
      segment: bookings.length > 1 ? 'Repeat' : 'New',
      lastActivity: latest.createdAt.slice(0, 10),
    };
  });
}
