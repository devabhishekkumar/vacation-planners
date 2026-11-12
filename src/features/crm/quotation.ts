export type QuotationItem = {
  id: string;
  group: string;
  hsn: string;
  quantity: number;
  unit: string;
  description: string;
  price: number;
  discount: number;
};
export type QuotationDetails = {
  kind?: 'travel';
  destination?: string;
  departure?: string;
  returnDate?: string;
  travelers?: number;
  inclusions?: string;
  exclusions?: string;
  number: string;
  date: string;
  validity: number;
  buyerRef: string;
  paymentTerms: string;
  dispatch: string;
  incoterms: string;
  deliveryTerms: string;
  company: string;
  contact: string;
  address1: string;
  address2: string;
  email: string;
  phone: string;
  cgst: number;
  sgst: number;
  terms: string;
  gstin: string;
  cin: string;
  pan: string;
  sellerAddress: string;
  sellerPhone: string;
  sellerEmail: string;
  bank: string;
  items: QuotationItem[];
};
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const itemPrice = (item: QuotationItem) => round(Math.max(0, item.price - item.discount));
export const itemTotal = (item: QuotationItem) => round(itemPrice(item) * item.quantity);
export function quotationTotals(details: QuotationDetails) {
  const subtotal = round(details.items.reduce((total, item) => total + itemTotal(item), 0));
  const cgst = round((subtotal * details.cgst) / 100);
  const sgst = round((subtotal * details.sgst) / 100);
  return { subtotal, cgst, sgst, total: round(subtotal + cgst + sgst) };
}

/** A small, dependency-free, paginated text PDF. All lengths use ASCII bytes. */
export function quotationPdf(details: QuotationDetails): Uint8Array {
  const totals = quotationTotals(details);
  const currency = (value: number) => `INR ${value.toFixed(2)}`;
  const lines = [
    'VACATION PLANNERS',
    details.kind === 'travel' ? 'HOLIDAY QUOTATION' : 'QUOTATION',
    `${details.number} | Date: ${details.date.split('-').reverse().join('/')}`,
    `Validity: ${details.validity} days${details.kind === 'travel' ? '' : ` | Buyer reference: ${details.buyerRef || '-'}`}`,
    `Payment terms: ${details.paymentTerms}`,
    ...(details.kind === 'travel'
      ? []
      : [
          `Dispatch through: ${details.dispatch}`,
          `Incoterms: ${details.incoterms} | Terms of delivery: ${details.deliveryTerms}`,
        ]),
    '',
    details.kind === 'travel' ? 'TRAVELLER DETAILS' : 'BILL TO',
    details.company,
    details.contact && `Kind attention: ${details.contact}`,
    details.address1,
    details.address2,
    `Email: ${details.email || '-'} | Phone: ${details.phone || '-'}`,
    '',
    ...(details.kind === 'travel'
      ? [
          'YOUR HOLIDAY',
          `Destination: ${details.destination || '-'}`,
          `Departure: ${details.departure || 'Flexible'} | Return: ${details.returnDate || 'Flexible'}`,
          `Travellers: ${details.travelers || 1}`,
          '',
        ]
      : []),
    details.kind === 'travel'
      ? 'TRIP COSTS (discount is per unit)'
      : 'LINE ITEMS (discount is per unit)',
    ...details.items.flatMap((item, index) => [
      '',
      `Item ${index + 1}${item.group ? ` - ${item.group}` : ''}`,
      item.description,
      `${details.kind === 'travel' ? '' : `HSN/SAC: ${item.hsn || '-'} | `}Qty: ${item.quantity} ${item.unit}`,
      `Unit price: ${currency(item.price)} | Discount: ${currency(item.discount)}`,
      `Discounted unit price: ${currency(itemPrice(item))} | Total: ${currency(itemTotal(item))}`,
    ]),
    '',
    `Sub total: ${currency(totals.subtotal)}`,
    `CGST (${details.cgst}%): ${currency(totals.cgst)}`,
    `SGST (${details.sgst}%): ${currency(totals.sgst)}`,
    `GRAND TOTAL: ${currency(totals.total)}`,
    ...(details.kind === 'travel'
      ? [
          '',
          'INCLUSIONS',
          details.inclusions || 'As agreed in the itinerary.',
          '',
          'EXCLUSIONS',
          details.exclusions || 'As agreed in the itinerary.',
        ]
      : []),
    '',
    'TERMS & CONDITIONS',
    ...details.terms
      .split('\n')
      .filter((line) => line.trim())
      .map((line, index) => `${index + 1}. ${line}`),
    '',
    ...(details.kind === 'travel' ? [] : ['OUR COMPANY DETAILS']),
    ...[
      ['GSTIN', details.gstin],
      ['CIN', details.cin],
      ['PAN', details.pan],
      ['Address', details.sellerAddress],
      ['Phone', details.sellerPhone],
      ['Email', details.sellerEmail],
      ['Bank details', details.bank],
    ]
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}: ${value}`),
  ].filter((line): line is string => typeof line === 'string');
  const wrapped = lines.flatMap((line) => {
    const ascii = line.normalize('NFKD').replace(/[^\x20-\x7E]/g, ' ');
    return ascii.match(/.{1,86}(?:\s|$)|.{1,86}/g)?.map((part) => part.trim()) || [''];
  });
  const pages: string[][] = [];
  let current: string[] = [];
  const blocks: string[][] = [];
  let block: string[] = [];
  for (const line of wrapped) {
    if (!line && block.length) {
      blocks.push(block);
      block = [];
    } else if (line) block.push(line);
  }
  if (block.length) blocks.push(block);
  for (const lines of blocks) {
    if (current.length && current.length + lines.length + 1 > 45) {
      pages.push(current);
      current = [];
    }
    if (current.length) current.push('');
    for (const line of lines) {
      if (current.length === 45) {
        pages.push(current);
        current = [];
      }
      current.push(line);
    }
  }
  if (current.length) pages.push(current);
  const objects: string[] = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const escape = (line: string) => line.replace(/[\\()]/g, '\\$&');
  pages.forEach((page, index) => {
    const content = `BT /F1 10 Tf 14 TL 48 790 Td\n${page.map((line) => `(${escape(line)}) Tj T*`).join('\n')}\nET\nBT /F1 9 Tf 48 32 Td (Page ${index + 1} of ${pages.length}) Tj ET`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + index * 2} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, index) => `${4 + index * 2} 0 R`).join(' ')}] >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
