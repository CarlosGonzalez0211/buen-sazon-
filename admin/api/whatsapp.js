// WhatsApp intake webhook. Each person chats 1:1 with the business number; identity = their phone.
// Env: WHATSAPP_TOKEN, PHONE_NUMBER_ID, APP_SECRET, VERIFY_TOKEN, DATABASE_URL, GEMINI_API_KEY
import { waitUntil } from '@vercel/functions';
import { neon } from '@neondatabase/serverless';
import { findUser, ingestReceipt, confirmExpense, voidExpense, getExpenseSummary } from '../lib/intake.mjs';
import { formatSummary } from '../lib/format.mjs';
import { verifySignature, parseInbound, sendText, sendButtons, markRead, downloadMedia } from '../lib/whatsapp.mjs';

// Meta retries unacknowledged deliveries, so each message id is processed at most once.
async function firstTime(messageId) {
  const rows = await neon(process.env.DATABASE_URL).query(
    `INSERT INTO processed_messages (message_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING message_id`, [messageId]);
  return rows.length > 0;
}

async function handle(m) {
  if (!(await firstTime(m.id))) return;
  const user = await findUser('whatsapp', m.from);
  if (!user) return sendText(m.from, 'No estás autorizado para usar este número.');
  await markRead(m.id);

  if (m.buttonId) {
    const [action, id] = m.buttonId.split(':');
    const expenseId = Number(id);
    if (action === 'ok') {
      return sendText(m.from, (await confirmExpense(expenseId, user)) ? '✅ Guardado' : 'Ese ticket ya estaba procesado.');
    }
    if (action === 'no') {
      return sendText(m.from, (await voidExpense(expenseId, user)) ? '🗑 Cancelado' : 'Ese ticket ya estaba cancelado.');
    }
    return;
  }

  if (!m.imageId) return sendText(m.from, 'Mándame una foto del ticket 📸');

  await sendText(m.from, 'Leyendo el ticket…');
  const file = await downloadMedia(m.imageId);
  const out = await ingestReceipt({ ...file, user, channel: 'whatsapp' });
  if (out.duplicate) return sendText(m.from, `Ese ticket ya está registrado (#${out.duplicate}).`);
  if (out.notReceipt) return sendText(m.from, 'No parece un ticket de compra. Intenta con otra foto.');

  const summary = await getExpenseSummary(out.expenseId);
  await sendText(m.from, formatSummary(summary) + (out.unmapped ? `\n\n${out.unmapped} producto(s) sin catalogar (no bloquea el guardado).` : ''));
  await sendButtons(m.from, `¿Guardar este ticket (#${out.expenseId})?`, [
    { id: `ok:${out.expenseId}`, title: '✅ Guardar' },
    { id: `no:${out.expenseId}`, title: '🗑 Cancelar' },
  ]);
}

export async function GET(request) {
  const q = new URL(request.url).searchParams;
  if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === process.env.VERIFY_TOKEN && q.get('hub.challenge')) {
    return new Response(q.get('hub.challenge'));
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get('x-hub-signature-256'))) return new Response('Invalid signature', { status: 401 });
  let payload;
  try { payload = JSON.parse(raw); } catch { return new Response('Bad JSON', { status: 400 }); }

  // Ack now (Meta retries slow responses); the photo reading continues after the response.
  for (const m of parseInbound(payload)) {
    waitUntil(handle(m).catch(async (err) => {
      console.error('whatsapp intake error', m.id, err);
      await sendText(m.from, 'Algo falló leyendo ese ticket. Intenta de nuevo.').catch(() => {});
    }));
  }
  return new Response('OK');
}
