import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReceipt, normalizeAlias, toCents } from './validate.mjs';

const base = { merchant_name: 'COSTCO', date: '2026-11-08', total: 150.5, tax: 0,
  items: [{ raw_text: 'TOMATE KG', quantity: 2, unit_price: 25.25, line_total: 50.5 }, { raw_text: 'POLLO', quantity: 1, line_total: 100 }] };

test('toCents avoids float drift', () => { assert.equal(toCents(19.99), 1999); assert.equal(toCents(0.1 + 0.2), 30); });
test('alias normalization strips accents and case', () => { assert.equal(normalizeAlias(' Jalapeño  Kg '), 'JALAPENO KG'); });
test('clean receipt has no issues', () => { assert.deepEqual(normalizeReceipt(base, '2026-11-09').issues, []); });
test('flags sum mismatch', () => {
  const r = normalizeReceipt({ ...base, total: 200 }, '2026-11-09');
  assert.ok(r.issues.some((i) => i.code === 'sum_mismatch'));
});
test('flags line mismatch', () => {
  const r = normalizeReceipt({ ...base, items: [{ raw_text: 'X', quantity: 2, unit_price: 10, line_total: 50 }], total: 50 }, '2026-11-09');
  assert.ok(r.issues.some((i) => i.code === 'line_mismatch'));
});
test('flags future and missing dates', () => {
  assert.ok(normalizeReceipt({ ...base, date: '2027-01-01' }, '2026-11-09').issues.some((i) => i.code === 'future_date'));
  assert.ok(normalizeReceipt({ ...base, date: undefined }, '2026-11-09').issues.some((i) => i.code === 'no_date'));
});
test('accepts line prices that include tax', () => {
  const r = normalizeReceipt({ ...base, total: 174.58, tax: 24.08 }, '2026-11-09');
  assert.ok(!r.issues.some((i) => i.code === 'sum_mismatch'));
});
