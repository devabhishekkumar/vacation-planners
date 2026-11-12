const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const compiled = { exports: {} };
new Function(
  'module',
  'exports',
  ts.transpileModule(fs.readFileSync('src/features/crm/quotation.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(compiled, compiled.exports);
const { quotationTotals, quotationPdf, itemPrice } = compiled.exports;
const item = {
  id: '1',
  group: 'Equipment',
  hsn: '85234990',
  quantity: 3,
  unit: 'Nos',
  description: 'Product (test) with \\ specifications',
  price: 100.1,
  discount: 0.1,
};
const details = {
  number: 'LD-QTN-20261109-005',
  date: '2026-11-09',
  validity: 5,
  buyerRef: '',
  paymentTerms: 'Advance',
  dispatch: 'Courier',
  incoterms: 'FOR',
  deliveryTerms: 'FOR',
  company: 'Example Buyer',
  contact: '',
  address1: '',
  address2: '',
  email: '',
  phone: '',
  cgst: 9,
  sgst: 9,
  terms: 'First condition\nSecond condition',
  gstin: '',
  cin: '',
  pan: '',
  sellerAddress: '',
  sellerPhone: '',
  sellerEmail: '',
  bank: '',
  items: [item],
};
assert.deepEqual(quotationTotals(details), { subtotal: 300, cgst: 27, sgst: 27, total: 354 });
assert.equal(itemPrice({ ...item, discount: item.price }), 0);
assert.equal(quotationTotals({ ...details, cgst: 0, sgst: 0 }).total, 300);
const text = Buffer.from(quotationPdf(details)).toString('ascii');
assert.ok(text.startsWith('%PDF-1.4'));
assert.ok(text.includes('1. First condition'));
assert.ok(text.includes('2. Second condition'));
assert.ok(text.includes('GRAND TOTAL: INR 354.00'));
assert.ok(text.includes('Product \\(test\\) with \\\\ specifications'));
const xrefPosition = Number(text.match(/startxref\n(\d+)/)[1]);
assert.equal(text.slice(xrefPosition, xrefPosition + 4), 'xref');
const entries = text
  .slice(xrefPosition)
  .split('\n')
  .slice(3)
  .filter((line) => /^\d{10} 00000 n/.test(line));
entries.forEach((entry, index) =>
  assert.ok(text.slice(Number(entry.slice(0, 10))).startsWith(`${index + 1} 0 obj`)),
);
const large = Buffer.from(
  quotationPdf({
    ...details,
    items: Array.from({ length: 25 }, (_, index) => ({
      ...item,
      id: String(index),
      description: 'Long product description '.repeat(25),
    })),
  }),
).toString('ascii');
assert.ok(Number(large.match(/\/Type \/Pages \/Count (\d+)/)[1]) > 2);
for (const match of large.matchAll(/\/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g))
  assert.equal(match[2].length, Number(match[1]));
console.log(
  'Quotation checks passed: totals, rounding, tax rates, full discount, numbered terms, escaping, PDF offsets, pagination and stream lengths.',
);

const holiday = {
  ...details,
  kind: 'travel',
  destination: 'Goa',
  travelers: 2,
  departure: '2026-12-01',
  returnDate: '2026-12-05',
  inclusions: 'Hotel and transfers',
  exclusions: 'Flights',
  cgst: 0,
  sgst: 0,
};
const holidayPdf = Buffer.from(quotationPdf(holiday)).toString('ascii');
assert.ok(holidayPdf.includes('HOLIDAY QUOTATION'));
assert.ok(holidayPdf.includes('TRAVELLER DETAILS'));
assert.ok(holidayPdf.includes('Destination: Goa'));
assert.ok(holidayPdf.includes('Travellers: 2'));
assert.ok(holidayPdf.includes('Hotel and transfers'));
for (const label of [
  'BILL TO',
  'Buyer reference:',
  'Dispatch through:',
  'Incoterms:',
  'HSN/SAC:',
  'OUR COMPANY DETAILS',
])
  assert.ok(!holidayPdf.includes(label));
console.log('Traveller quotation checks passed.');
