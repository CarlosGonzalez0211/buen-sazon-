import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifySignature, parseInbound } from './whatsapp.mjs';

const sig = (body, secret) => 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

test('accepts a correct signature, rejects tampering and missing header', () => {
  const body = '{"a":1}';
  assert.equal(verifySignature(body, sig(body, 's3cret'), 's3cret'), true);
  assert.equal(verifySignature(body + ' ', sig(body, 's3cret'), 's3cret'), false);
  assert.equal(verifySignature(body, sig(body, 'other'), 's3cret'), false);
  assert.equal(verifySignature(body, null, 's3cret'), false);
  assert.equal(verifySignature(body, sig(body, 's3cret'), ''), false);
});

test('parses image, text and button replies; ignores statuses', () => {
  const payload = { entry: [{ changes: [{ value: {
    statuses: [{ id: 'x' }],
    messages: [
      { from: '5216561234567', id: 'm1', type: 'image', image: { id: 'media1' } },
      { from: '5216561234567', id: 'm2', type: 'text', text: { body: 'hola' } },
      { from: '5216561234567', id: 'm3', type: 'interactive', interactive: { button_reply: { id: 'ok:12', title: 'Guardar' } } },
    ] } }] }] };
  const [a, b, c] = parseInbound(payload);
  assert.equal(a.imageId, 'media1');
  assert.equal(b.text, 'hola');
  assert.equal(c.buttonId, 'ok:12');
  assert.equal(parseInbound({ entry: [{ changes: [{ value: { statuses: [{}] } }] }] }).length, 0);
});
