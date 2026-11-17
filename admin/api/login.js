import { passwordOk, sessionCookie, clearCookie, json } from '../lib/auth.mjs';

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch { /* fall through to rejection */ }
  if (!passwordOk(body.password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return json({ error: 'Contraseña incorrecta' }, 401);
  }
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie() });
}

// Logout.
export async function DELETE() {
  return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
}
