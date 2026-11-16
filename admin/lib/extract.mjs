// Photo -> structured JSON via Gemini vision with a response schema (JSON-only output).
// Env: GEMINI_API_KEY, optional GEMINI_MODEL (default below; use any vision-capable Gemini model).
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const SCHEMA = {
  type: 'object',
  required: ['is_receipt', 'items'],
  properties: {
    is_receipt: { type: 'boolean', description: 'false if the image is not a purchase ticket' },
    merchant_name: { type: 'string' },
    merchant_rfc: { type: 'string', description: 'RFC of the merchant if printed' },
    ticket_folio: { type: 'string', description: 'Ticket / folio / transaction number' },
    date: { type: 'string', description: 'YYYY-MM-DD, as printed (Mexican dd/mm/yyyy order)' },
    payment_method: { type: 'string', enum: ['cash', 'card', 'transfer', 'other'] },
    tax: { type: 'number', description: 'Total IVA in pesos if printed' },
    total: { type: 'number', description: 'Final total paid, in pesos' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['raw_text', 'line_total'],
        properties: {
          raw_text: { type: 'string', description: 'Item text exactly as printed' },
          quantity: { type: 'number' },
          unit: { type: 'string', description: 'kg, pza, l, etc. only if printed' },
          unit_price: { type: 'number' },
          line_total: { type: 'number' },
        },
      },
    },
  },
};

const PROMPT =
  'This is a photo of a Mexican purchase ticket. Record exactly what is printed. ' +
  'Copy values as printed, amounts in pesos, dates as YYYY-MM-DD (the ticket uses dd/mm/yyyy). ' +
  'Omit any field you cannot read instead of guessing. If the image is not a purchase ticket, set is_receipt to false.';

export async function extractReceipt(bytes, mime = 'image/jpeg') {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: mime, data: Buffer.from(bytes).toString('base64') } }, { text: PROMPT }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA },
    }),
  });
  if (!res.ok) throw new Error(`extract failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const text = (await res.json()).candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) throw new Error('extract returned no content');
  return JSON.parse(text);
}
