import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkbook } from './workbook.mjs';

const H = (name) => `\\===== SHEET: Libro - ${name} =====\n`;

const MONTHLY =
  H('01 Abril 2026') + `GASTOS,,,,Gastos sueldos
,,,,,,1er,2a
Agua,1000
Renta,2000
,3000
Abril 2026,Coca Cola,Sams,Otros,Gasto,Venta,Total
6,100,50,,150,1000,850
7,,,,,,
8,,,,,,
9,,,,,,
10,,,,,,
11,,,,,,
12,,,,,500,
,,,,150,1500,1350
13,20,,,20,300,280
14,,,,,,
15,,,,,,
16,,,,,,
17,,,,,,
18,,,,,,
19,,,,,,
,,,,20,300,280
,,,Total mes Abril,170,1800,1630
`;

// Week Mon Apr 6 .. Sun Apr 12, lining up with MONTHLY.
const TARJ_APRIL = H('02 Tarjetas Abril 26') + `Dia,Credito,Debito,Total,Debe de haber,Hay,Falta/ sobra,Caja,Meny
6,200,300,500,500,505,5,2000
7,,,0
8,,,0
9,,,0
10,,,0
11,,,0
12
Total,200,300,500
`;

// April's last week (Apr 27..May 3) is re-opened by May's sheet, which only lists May 1..3.
const TARJ_PARTIAL = H('02 Tarjetas Abril 26') + `Dia,Credito,Debito,Total,Debe de haber,Hay,Falta/ sobra,Caja,Meny
27,,,0
28,,,0
29,,,0
30,,,0
1,,,0
2,,,0
3,,,0
Total,0,0,0
` + H('03 Tarjetas Mayo 26') + `Dia,Credito,Debito,Total,Debe de haber,Hay,Falta/ sobra,Caja,Meny
1,200,300,500,500,505,5,2000
2,,,0
3,,,0
Total,200,300,500
4,10,20,30,40,40,0,2000
5,,,0
6,,,0
7,,,0
8,,,0
9,,,0
10,,,0
Total,10,20,30
`;

test('weeks are placed by position; sales, expenses and fixed costs come out in cents', () => {
  const r = parseWorkbook(MONTHLY);
  assert.deepEqual(r.expenses.map((e) => [e.date, e.supplier, e.cents]),
    [['2026-04-06', 'COCA COLA', 10000], ['2026-04-06', 'SAMS', 5000], ['2026-04-13', 'COCA COLA', 2000]]);
  assert.deepEqual(r.sales.map((s) => [s.date, s.gross_cents]),
    [['2026-04-06', 100000], ['2026-04-12', 50000], ['2026-04-13', 30000]]);
  assert.deepEqual(r.fixed.map((f) => [f.month, f.label, f.cents, f.category]),
    [['2026-04-01', 'Agua', 100000, 'utilities'], ['2026-04-01', 'Renta', 200000, 'rent']]);
  assert.deepEqual(r.warnings, []);
});

test('cash-up detail merges onto the matching sales day and cross-checks the gross', () => {
  const r = parseWorkbook(MONTHLY + TARJ_APRIL);
  const d = r.sales.find((s) => s.date === '2026-04-06');
  assert.equal(d.gross_cents, 100000);
  assert.equal(d.credit_cents, 20000);
  assert.equal(d.debit_cents, 30000);
  assert.equal(d.cash_cents, 50000);
  assert.equal(d.over_short_cents, 500);
  assert.ok(!r.warnings.some((w) => w.code === 'sales_vs_cashup'));
});

test('a cash-up that disagrees with the monthly sales is flagged; gross keeps the monthly figure', () => {
  const bad = TARJ_APRIL.replace('6,200,300,500,500,505', '6,200,300,500,900,905');
  const r = parseWorkbook(MONTHLY + bad);
  assert.ok(r.warnings.some((w) => w.code === 'sales_vs_cashup' && w.date === '2026-04-06'));
  assert.equal(r.sales.find((s) => s.date === '2026-04-06').gross_cents, 100000);
});

test('a mistyped day label is warned about but the date still comes from position', () => {
  const r = parseWorkbook(MONTHLY.replace('\n14,,,,,,\n', '\n44,,,,,,\n'));
  assert.ok(r.warnings.some((w) => w.code === 'label_mismatch' && w.label === 44 && w.date === '2026-04-14'));
});

test("a sheet that re-opens the previous sheet's last week keeps dates aligned", () => {
  const r = parseWorkbook(TARJ_PARTIAL);
  const d = r.sales.find((x) => x.date === '2026-05-01');
  assert.equal(d.credit_cents, 20000);
  assert.equal(d.over_short_cents, 500);
  assert.ok(r.sales.some((x) => x.date === '2026-05-04'));
  assert.deepEqual(r.warnings, []);
});

test('sheet totals that do not match are reported', () => {
  const r = parseWorkbook(MONTHLY.replace('Total mes Abril,170,1800', 'Total mes Abril,170,9999'));
  assert.ok(r.warnings.some((w) => w.code === 'sales_total_mismatch'));
});

test('a week the sheet ends in the middle of starts the day after the last full week', () => {
  const text = TARJ_APRIL + H('03 Tarjetas Mayo 26') + `Dia,Credito,Debito,Total,Debe de haber,Hay,Falta/ sobra,Caja,Meny
13,10,20,30,40,40,0,2000
14,,,0
`;
  // April sheet's only week ends Sun Apr 12; the next sheet's open week therefore starts Mon Apr 13.
  const r = parseWorkbook(text);
  assert.ok(r.sales.some((x) => x.date === '2026-04-13' && x.credit_cents === 1000));
});

test('weekly payroll by role is parsed and tied to the Sueldos line', () => {
  const sheet = H('01 Abril 2026') + `GASTOS,,,,Gastos sueldos,,,,Total mes
,,,,,,1er,2a
Agua,1000,,,Cocinero,,3000,3100
Renta,2000,,,Mesero,,2000,2200
Sueldos,10300,,,Otros sueldos,,0,0
,,,,,,5000,5300,10300,999
,3000
Abril 2026,Coca Cola,Gasto,Venta,Total
6,100,100,1000,900
7,,,,
8,,,,
9,,,,
10,,,,
11,,,,
12,,,,
,,100,1000,900
,,Total mes Abril,100,1000,900
`;
  const r = parseWorkbook(sheet);
  assert.deepEqual(r.payroll.map((p) => [p.week_no, p.role, p.cents]), [
    [1, 'Cocinero', 300000], [2, 'Cocinero', 310000], [1, 'Mesero', 200000], [2, 'Mesero', 220000],
  ]);
  assert.equal(r.warnings.some((w) => w.code.startsWith('payroll_')), false);
});

test('monthly card fee line becomes a fixed cost', () => {
  const r = parseWorkbook(H('02 Tarjetas Abril 26') + `Dia,Credito,Debito,Total,Debe de haber,Hay,Falta/ sobra,Caja,Meny
6,200,300,500,500,505,5,2000
7,,,0
8,,,0
9,,,0
10,,,0
11,,,0
12,,,0
Total,200,300,500,500,505,5
0,,% tarjetas,2679.225
`);
  assert.deepEqual(r.fixed.map((f) => [f.month, f.label, f.cents, f.category]), [['2026-04-01', 'Comisión tarjetas', 267923, 'taxes_fees']]);
});
