import type { TravelSnapshot } from '../../features/travel/types';
export function itineraryPdf(trip: TravelSnapshot) {
  const lines = [
    'VACATION PLANNERS',
    'YOUR PUBLISHED ITINERARY',
    trip.booking.tour,
    `Booking: ${trip.booking.id} | Traveller: ${trip.booking.customer}`,
    `Travel dates: ${trip.booking.travelDate} - ${trip.booking.returnDate || 'To be arranged'}`,
    `Published: ${trip.publishedAt?.slice(0, 10) || '-'}`,
    '',
    ...[...trip.itinerary]
      .sort((a, b) => a.day - b.day)
      .flatMap((a) => [`Day ${a.day} | ${a.time} | ${a.status}`, a.title, a.location, a.notes, '']),
    `Travel coordinator: ${trip.coordinator.name || 'To be assigned'}`,
    trip.coordinator.phone,
    trip.coordinator.email,
  ];
  const wrapped = lines.flatMap(
    (line) =>
      line
        .normalize('NFKD')
        .replace(/[^\x20-\x7E]/g, ' ')
        .match(/.{1,85}(?:\s|$)|.{1,85}/g) || [''],
  );
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += 46) pages.push(wrapped.slice(i, i + 46));
  const objects = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const escape = (s: string) => s.replace(/[\\()]/g, '\\$&');
  pages.forEach((page, index) => {
    const content = `BT /F1 10 Tf 14 TL 48 790 Td\n${page.map((line) => `(${escape(line)}) Tj T*`).join('\n')}\nET\nBT /F1 9 Tf 48 32 Td (Page ${index + 1} of ${pages.length}) Tj ET`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + index * 2} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((value, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${value}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((value) => `${String(value).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
