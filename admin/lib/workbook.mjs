// Parser for the "El Buen Sazon new2" workbook text export (all sheets in one file, CSV per sheet).
// Pure: text in, structured rows + warnings out. No I/O, so every number can be re-checked.
//
// Sheet types handled
//   "NN <Mes> 2026"          monthly: fixed costs list + daily grid (purchases per supplier, Gasto, Venta)
//   "NN Tarjetas <Mes> [YY]" daily cash-up: credit, debit, expected cash, actual cash, over/short, float
//   anything else (Hoja1..3) is ignored
//
// Dates: the grids are Monday..Sunday weeks, one block per week, but day labels contain typos and
// weeks straddle sheets. So dates come from POSITION (weeks chain from a Sunday), and labels are
// only used to anchor the first block and to raise warnings when a label disagrees.

const MONTHS = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };

const strip = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const monthIdx = (w) => MONTHS[strip(w).toLowerCase().slice(0, 3)];
const ymd = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

export const cents = (n) => Math.round(Number(n) * 100);

function num(s) {
  const t = String(s ?? '').replace(/[$,\s]/g, '');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

// What each purchase column and fixed-cost line means. Edit here; unknown names fall back to "other".
export const SUPPLIER_CATEGORY = {
  'COCA COLA': 'beverages', SAMS: 'food_grocery', NENA: 'food_grocery', SMART: 'food_grocery',
  SORIANA: 'food_grocery', DISMART: 'food_grocery', OTROS: 'other', SUKARNE: 'food_meat',
  FRUTERIA: 'food_produce', FLANES: 'food_grocery', CREMERIA: 'food_dairy', DESECHABLES: 'disposables',
  ACEITE: 'food_grocery', QUESO: 'food_dairy', TORTILLAS: 'food_tortilla',
};
const SUPPLIER_RENAME = { DESECHS: 'DESECHABLES', OTROS: 'OTROS (EFECTIVO)' };

export const FIXED_CATEGORY = {
  agua: 'utilities', luz: 'utilities', telefono: 'utilities', gas: 'gas_lp', 'mtto plaza': 'mall_fee',
  renta: 'rent', contadora: 'accounting', impuestos: 'taxes_fees', sat: 'taxes_fees', sueldos: 'payroll',
  'seguro meny': 'payroll', 'te meny': 'payroll', te: 'payroll', 'finiquito meny': 'payroll',
  aseguranza: 'insurance', limpieza: 'cleaning', cimaco: 'other', 'aire y copas': 'other',
};

function classify(title, defaultYear) {
  const t = title.trim();
  let m = t.match(/^\d+\s+Tarjetas\s+(\S+)(?:\s+(\d{2,4}))?$/i);
  if (m && monthIdx(m[1]) !== undefined) {
    const y = m[2] ? (m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2])) : defaultYear;
    return { kind: 'tarjetas', month: monthIdx(m[1]), year: y };
  }
  m = t.match(/^\d+\s+(\S+)\s+(\d{4})$/);
  if (m && monthIdx(m[1]) !== undefined) return { kind: 'monthly', month: monthIdx(m[1]), year: Number(m[2]) };
  return { kind: 'other' };
}

export function splitSheets(text) {
  const sheets = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    const h = line.match(/^\\?\s*={3,}\s*SHEET:\s*(.*?)\s*={3,}$/);
    if (h) {
      const name = h[1].includes(' - ') ? h[1].slice(h[1].lastIndexOf(' - ') + 3) : h[1];
      cur = { name: name.trim(), rows: [] };
      sheets.push(cur);
    } else if (cur) cur.rows.push(parseCsvLine(line));
  }
  return sheets;
}

/** Places a week block on the calendar. Returns the Sunday that ends the block. */
function placeBlock(chain, lastLabel, firstInSheet, month, year) {
  let sunday;
  if (!chain.lastSunday) {
    if (lastLabel == null) throw new Error('cannot anchor the first week: its last row has no day number');
    sunday = [0, -1, 1]
      .map((o) => new Date(Date.UTC(year, month + o, lastLabel)))
      .find((d) => d.getUTCDay() === 0 && d.getUTCDate() === lastLabel);
    if (!sunday) throw new Error(`cannot anchor the first week on day ${lastLabel} (no matching Sunday)`);
  } else if (firstInSheet && lastLabel != null && lastLabel === chain.lastSunday.getUTCDate()) {
    sunday = chain.lastSunday; // sheet re-opens the week the previous sheet ended with
  } else sunday = addDays(chain.lastSunday, 7);
  chain.lastSunday = sunday;
  return sunday;
}

const labelOf = (row) => (/^\d{1,2}$/.test((row[0] ?? '').trim()) ? Number(row[0].trim()) : null);

function datedRows(blocks, chain, sheet, meta, warnings) {
  const out = [];
  blocks.forEach((block, bi) => {
    if (block.length > 7) warnings.push({ sheet: sheet.name, code: 'long_week', rows: block.length });
    // A week the sheet ends in the middle of (no closing "Total" row) starts the day after the last
    // full week; it does not advance the chain, because the next sheet re-opens that same week.
    const start = block.incomplete && chain.lastSunday ? addDays(chain.lastSunday, 1) : null;
    const sunday = start ? null : placeBlock(chain, labelOf(block.at(-1)), bi === 0, meta.month, meta.year);
    block.forEach((row, i) => {
      const date = start ? addDays(start, i) : addDays(sunday, -(block.length - 1 - i));
      const label = labelOf(row);
      if (label != null && label !== date.getUTCDate()) {
        warnings.push({ sheet: sheet.name, code: 'label_mismatch', label, date: ymd(date) });
      }
      out.push({ date: ymd(date), row });
    });
  });
  return out;
}

function parseMonthly(sheet, meta, chain, warnings) {
  const rows = sheet.rows;
  const hi = rows.findIndex((r) => /\d{4}\s*$/.test(r[0] ?? '') && strip(r[1]).trim().toLowerCase() === 'coca cola');
  if (hi < 0) throw new Error(`sheet "${sheet.name}": header row not found`);
  const header = rows[hi].map((c) => strip(c).trim().toUpperCase());
  const gastoCol = header.indexOf('GASTO');
  const ventaCol = header.indexOf('VENTA');
  const supplierCols = [];
  for (let c = 1; c < gastoCol; c++) {
    const name = SUPPLIER_RENAME[header[c]] ?? header[c];
    if (name) supplierCols.push({ c, name });
  }

  // Fixed costs: label,value rows from the "GASTOS" line until the unlabeled total.
  const fixed = [];
  let fixedTotal = null;
  const gi = rows.findIndex((r) => /^gastos/i.test((r[0] ?? '').trim()));
  for (let i = gi + 1; i < hi; i++) {
    const label = (rows[i][0] ?? '').trim();
    const v = num(rows[i][1]);
    if (!label) {
      if (v != null) { fixedTotal = v; break; } // the unlabeled number is the sheet's total
      continue; // spacer / weekly-payroll header rows
    }
    if (v) fixed.push({ label, cents: cents(v) });
  }

  // Weekly payroll by role: "Cocinero/Ayudante/Mesero/Otros sueldos" in column E, one value per pay week.
  const ROLES = { cocinero: 'Cocinero', ayudante: 'Ayudante', mesero: 'Mesero', 'otros sueldos': 'Otros sueldos' };
  const payroll = [];
  const weekHeader = rows.slice(0, hi).find((r) => /^1er/i.test((r[6] ?? '').trim()));
  const monthStartStr = ymd(new Date(Date.UTC(meta.year, meta.month, 1)));
  let payrollTotal = null;
  for (let i = gi + 1; i < hi; i++) {
    const role = ROLES[strip(rows[i][4]).trim().toLowerCase()];
    if (role) {
      for (let c = 6; c < 11; c++) {
        const hdr = (weekHeader?.[c] ?? '').trim();
        const v = num(rows[i][c]);
        if (hdr && v) payroll.push({ month: monthStartStr, week_no: c - 5, role, cents: cents(v) });
      }
    } else if (!(rows[i][4] ?? '').trim() && num(rows[i][6]) != null && payroll.length) {
      // totals row: the weekly sums, then the month total as the last number
      const weekCount = (weekHeader ?? []).slice(6, 11).filter((c) => (c ?? '').trim()).length;
      payrollTotal = num(rows[i][6 + weekCount]);
      break;
    }
  }
  const payrollSum = payroll.reduce((a, p) => a + p.cents, 0);
  if (payrollTotal != null && Math.abs(cents(payrollTotal) - payrollSum) > 100) {
    warnings.push({ sheet: sheet.name, code: 'payroll_total_mismatch', reported: cents(payrollTotal), summed: payrollSum });
  }
  const sueldos = fixed.find((f) => strip(f.label).trim().toLowerCase() === 'sueldos');
  if (sueldos && payroll.length && Math.abs(sueldos.cents - payrollSum) > 100) {
    warnings.push({ sheet: sheet.name, code: 'payroll_vs_sueldos', sueldos: sueldos.cents, summed: payrollSum });
  }

  // Daily grid: weeks end at a row with no day label (the weekly totals row).
  const blocks = [];
  let cur = [];
  let reported = null;
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    const hit = r.findIndex((c) => /^total mes/i.test((c ?? '').trim()));
    if (hit >= 0) { reported = { gasto: num(r[gastoCol]), venta: num(r[ventaCol]) }; break; }
    if (labelOf(r) != null) cur.push(r);
    else if (cur.length) { blocks.push(cur); cur = []; }
  }
  if (cur.length) blocks.push(cur);

  const expenses = [];
  const sales = [];
  let purchases = 0;
  let venta = 0;
  for (const { date, row } of datedRows(blocks, chain, sheet, meta, warnings)) {
    let rowSum = 0;
    for (const s of supplierCols) {
      const v = num(row[s.c]);
      if (v) { expenses.push({ date, supplier: s.name, cents: cents(v) }); rowSum += cents(v); }
    }
    const gasto = num(row[gastoCol]);
    if (gasto != null && Math.abs(cents(gasto) - rowSum) > 100) {
      warnings.push({ sheet: sheet.name, code: 'row_sum_mismatch', date, listed: cents(gasto), summed: rowSum });
    }
    purchases += rowSum;
    const v = num(row[ventaCol]);
    if (v) { sales.push({ date, gross_cents: cents(v) }); venta += cents(v); }
  }

  const monthStart = ymd(new Date(Date.UTC(meta.year, meta.month, 1)));
  const fixedRows = fixed.map((f) => ({ month: monthStart, ...f }));
  const fixedSum = fixed.reduce((a, f) => a + f.cents, 0);
  if (fixedTotal != null && Math.abs(cents(fixedTotal) - fixedSum) > 100) {
    warnings.push({ sheet: sheet.name, code: 'fixed_total_mismatch', listed: cents(fixedTotal), summed: fixedSum });
  }
  if (reported?.gasto != null && Math.abs(cents(reported.gasto) - purchases) > 100) {
    warnings.push({ sheet: sheet.name, code: 'purchases_total_mismatch', reported: cents(reported.gasto), summed: purchases });
  }
  if (reported?.venta != null && Math.abs(cents(reported.venta) - venta) > 100) {
    warnings.push({ sheet: sheet.name, code: 'sales_total_mismatch', reported: cents(reported.venta), summed: venta });
  }
  return { expenses, sales, fixed: fixedRows, payroll, summary: { sheet: sheet.name, purchases, venta, fixed: fixedSum } };
}

function parseTarjetas(sheet, meta, chain, warnings) {
  const rows = sheet.rows;
  const hi = rows.findIndex((r) => strip(r[0]).trim().toLowerCase() === 'dia');
  if (hi < 0) throw new Error(`sheet "${sheet.name}": header row not found`);
  const blocks = [];
  let cur = [];
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    const c0 = (r[0] ?? '').trim();
    if (c0 === 'Total') { if (cur.length) blocks.push(cur); cur = []; }
    else if (c0 === '0') break; // monthly summary rows start here (an open week may still be in `cur`)
    else if (r.every((c) => !(c ?? '').trim())) continue;
    else if (!cur.length && c0 === '') continue; // spacer rows between weeks
    else cur.push(r);
  }
  if (cur.length) { cur.incomplete = true; blocks.push(cur); }

  const days = [];
  for (const { date, row } of datedRows(blocks, chain, sheet, meta, warnings)) {
    const credit = num(row[1]);
    const debit = num(row[2]);
    const expected = num(row[4]);
    if (!(credit || debit || expected)) continue;
    days.push({
      date,
      credit_cents: cents(credit ?? 0),
      debit_cents: cents(debit ?? 0),
      expected_cash_cents: expected != null ? cents(expected) : null,
      actual_cash_cents: num(row[5]) != null ? cents(num(row[5])) : null,
      over_short_cents: num(row[6]) != null ? cents(num(row[6])) : null,
      drawer_float_cents: num(row[7]) != null ? cents(num(row[7])) : null,
    });
  }
  // Monthly card fee: the sheet's own "% tarjetas" line (a formula result), when present.
  const feeRow = rows.find((r) => strip(r[2]).trim().toLowerCase() === '% tarjetas');
  const fee = feeRow ? num(feeRow[3]) : null;
  return { days, fee: fee ? { month: ymd(new Date(Date.UTC(meta.year, meta.month, 1))), label: 'Comisión tarjetas', cents: cents(fee), category: 'taxes_fees' } : null };
}

export function parseWorkbook(text, { year = 2026 } = {}) {
  const warnings = [];
  const monthlyChain = { lastSunday: null };
  const tarjChain = { lastSunday: null };
  const out = { expenses: [], fixed: [], payroll: [], sales: new Map(), tarjetas: new Map(), summaries: [], warnings, unmapped: new Set() };

  const put = (map, key, val, sheet) => {
    if (map.has(key) && JSON.stringify(map.get(key).val) !== JSON.stringify(val)) {
      warnings.push({ sheet, code: 'date_in_two_sheets', date: key, kept: 'later sheet' });
    }
    map.set(key, { val, sheet });
  };
  const expenseKeys = new Map();

  for (const sheet of splitSheets(text)) {
    const meta = classify(sheet.name, year);
    if (meta.kind === 'monthly') {
      const r = parseMonthly(sheet, meta, monthlyChain, warnings);
      for (const e of r.expenses) {
        const key = `${e.date}|${e.supplier}`;
        if (expenseKeys.has(key) && expenseKeys.get(key).cents !== e.cents) {
          warnings.push({ sheet: sheet.name, code: 'date_in_two_sheets', date: e.date, supplier: e.supplier, kept: 'later sheet' });
        }
        expenseKeys.set(key, { ...e, category: SUPPLIER_CATEGORY[e.supplier.replace(/ \(EFECTIVO\)$/, '')] ?? null });
        if (!(e.supplier.replace(/ \(EFECTIVO\)$/, '') in SUPPLIER_CATEGORY)) out.unmapped.add('supplier:' + e.supplier);
      }
      for (const s of r.sales) put(out.sales, s.date, s.gross_cents, sheet.name);
      for (const f of r.fixed) {
        const cat = FIXED_CATEGORY[strip(f.label).toLowerCase().trim().replace(/\s+/g, ' ')];
        if (!cat) out.unmapped.add('fixed:' + f.label);
        out.fixed.push({ ...f, category: cat ?? 'other' });
      }
      out.payroll.push(...r.payroll);
      out.summaries.push(r.summary);
    } else if (meta.kind === 'tarjetas') {
      const t = parseTarjetas(sheet, meta, tarjChain, warnings);
      for (const d of t.days) put(out.tarjetas, d.date, d, sheet.name);
      if (t.fee) out.fixed.push(t.fee);
    }
  }
  out.expenses = [...expenseKeys.values()].map((e) => ({ ...e, category: e.category ?? 'food_grocery' }));

  // One sales row per date: gross from the monthly grid, split from the cash-up when present.
  const dates = new Set([...out.sales.keys(), ...out.tarjetas.keys()]);
  const salesRows = [];
  for (const date of [...dates].sort()) {
    const t = out.tarjetas.get(date)?.val;
    const monthly = out.sales.get(date)?.val;
    const fromCashUp = t ? t.credit_cents + t.debit_cents + (t.expected_cash_cents ?? 0) : null;
    if (monthly != null && fromCashUp != null && Math.abs(monthly - fromCashUp) > 100) {
      warnings.push({ sheet: 'cross-check', code: 'sales_vs_cashup', date, monthly, cashup: fromCashUp });
    }
    salesRows.push({
      date,
      gross_cents: monthly ?? fromCashUp,
      credit_cents: t?.credit_cents ?? null,
      debit_cents: t?.debit_cents ?? null,
      card_cents: t ? t.credit_cents + t.debit_cents : null,
      cash_cents: t?.expected_cash_cents ?? null,
      expected_cash_cents: t?.expected_cash_cents ?? null,
      actual_cash_cents: t?.actual_cash_cents ?? null,
      over_short_cents: t?.over_short_cents ?? null,
      drawer_float_cents: t?.drawer_float_cents ?? null,
    });
  }
  out.sales = salesRows;
  out.tarjetas = undefined;
  out.unmapped = [...out.unmapped];
  return out;
}
