// WhatsApp Cloud API helpers. Env: WHATSAPP_TOKEN, PHONE_NUMBER_ID, APP_SECRET, VERIFY_TOKEN
import { createHmac, timingSafeEqual } from 'node:crypto';

const API = `https://graph.facebook.com/${process.env.WA_API_VERSION || 'v21.0'}`;
const auth = () => ({ Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` });

/** X-Hub-Signature-256 must be checked against the exact raw body bytes. */
export function verifySignature(rawBody, header, appSecret = process.env.APP_SECRET) {
  if (!header?.startsWith('sha256=') || !appSecret) return false;
  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const got = header.slice(7).toLowerCase();
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/** Flatten Meta's payload into messages: text, image, or a tapped reply button. Statuses are ignored. */
export function parseInbound(payload) {
  const out = [];
  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const m of change?.value?.messages ?? []) {
        out.push({
          from: m.from,
          id: m.id,
          type: m.type,
          text: m.text?.body ?? null,
          imageId: m.type === 'image' ? m.image?.id : m.type === 'document' && m.document?.mime_type?.startsWith('image/') ? m.document.id : null,
          buttonId: m.interactive?.button_reply?.id ?? null,
        });
      }
    }
  }
  return out;
}

const send = async (body) => {
  const res = await fetch(`${API}/${process.env.PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { ...auth(), 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
  });
  if (!res.ok) throw new Error(`WhatsApp send failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
};

export const sendText = (to, text) => send({ to, type: 'text', text: { body: text.slice(0, 4000) } });

/** Up to 3 buttons; titles max 20 chars. */
export const sendButtons = (to, body, buttons) =>
  send({
    to, type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body.slice(0, 1000) },
      action: { buttons: buttons.map((b) => ({ type: 'reply', reply: { id: b.id, title: b.title.slice(0, 20) } })) },
    },
  });

export const markRead = (messageId) =>
  send({ status: 'read', message_id: messageId }).catch(() => {});

export async function downloadMedia(mediaId) {
  const meta = await fetch(`${API}/${mediaId}`, { headers: auth() });
  if (!meta.ok) throw new Error(`media lookup failed ${meta.status}`);
  const { url, mime_type } = await meta.json();
  const file = await fetch(url, { headers: auth() });
  if (!file.ok) throw new Error(`media download failed ${file.status}`);
  return { bytes: new Uint8Array(await file.arrayBuffer()), mime: mime_type || 'image/jpeg' };
}
