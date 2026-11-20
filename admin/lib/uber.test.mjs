import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePayoutSummary, parsePaymentDetails, parseItems, reconcile } from './uber.mjs';

const PAY = `Store Name,Order Count,Sales (incl. VAT),Total Sales after Adjustments (incl. VAT),Marketplace Fee (excl. VAT),VAT on Marketplace Fee,VAT Withholdings,Income Tax withholding,Other payments,Total payout ,Payout Date,Payout reference ID
Tienda,2,370,370,-111,-17.76,-24.1,-8.04,0,209.1,4/6/26,REF1
`;
const DET = `Description row,x
Store Name,Order ID,Workflow ID,Order Date,Order Completion time ,Order Channel,Order Status,Sales (incl. VAT),Offers on items (incl. VAT),Total Sales after Adjustments (incl. VAT),Marketplace Fee (excl. VAT),VAT on Marketplace Fee,VAT Withholdings,Income Tax withholding,Other payments,Total payout ,Payout Date,Payout reference ID
T,#A,wf-a,4/1/26,2026-04-01 11:58:19,iOS,Completed,200,0,200,-60,-9.6,-13.05,-4.35,0,113,4/6/26,REF1
T,#B,wf-b,4/2/26,2026-04-02 12:00:00,iOS,Completed,170,0,170,-51,-8.16,-11.05,-3.69,0,96.1,4/6/26,REF1
T,#B,wf-b,4/3/26,,iOS,Refund,0,0,0,0,0,0,0,0,-0.1,4/6/26,REF1
T,,,4/3/26,,Unknown,,0,0,0,0,0,0,0,50,50,4/6/26,REF1
`;
const ITEMS = `Store Name,Order ID,Workflow ID,Order Date,Item Name,Final Quantity,Unit price,Order Status
T,#A,wf-a,4/1/26,,,,Completed
T,,wf-a,4/1/26,Tacos,1,200,Completed
T,,wf-b,4/2/26,Tostada,2,85,Completed
`;

test('payout summary is read by column name into centavos', () => {
  const [p] = parsePayoutSummary(PAY);
  assert.equal(p.payout_ref, 'REF1');
  assert.equal(p.payout_date, '2026-04-06');
  assert.equal(p.payout_cents, 20910);
  assert.equal(p.marketplace_fee_cents, -11100);
});

test('payment details: skips the description row, keeps refunds and order-less payments apart', () => {
  const o = parsePaymentDetails(DET);
  assert.equal(o.length, 4);
  assert.equal(new Set(o.map((x) => x.source_key)).size, 4);
  assert.equal(o.find((x) => x.status === 'Refund').source_key, 'wf-b:refund');
  assert.equal(o.find((x) => x.status === 'Ajuste').payout_cents, 5000);
});

test('items skip order summary rows and reconcile with order sales', () => {
  const i = parseItems(ITEMS);
  assert.equal(i.length, 2);
  const notes = reconcile(parsePayoutSummary(PAY), parsePaymentDetails(DET), i);
  assert.equal(notes.some((n) => n.code === 'item_sales_differ_from_order_sales'), false);
  assert.ok(notes.some((n) => n.code === 'payout_ties' || n.code === 'payout_partial_in_orders_file'));
});
