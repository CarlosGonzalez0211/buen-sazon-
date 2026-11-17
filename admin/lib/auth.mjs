// Interim owner login: one shared passphrase -> signed, HttpOnly session cookie.
// Fails closed when ADMIN_PASSWORD or SESSION_SECRET is missing. Replaced by per-user login later.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = '__Host-bs_session';
const DAYS = 14;

const sign = (payload) => createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('hex');
const sha = (s) => createHash('sha256').update(String(s)).digest();

export function passwordOk(input) {
  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) return false;
  return timingSafeEqual(sha(input ?? ''), sha(process.env.ADMIN_PASSWORD));
}

export function sessionCookie() {
  const exp = Date.now() + DAYS * 86400000;
  return `${COOKIE}=${exp}.${sign(String(exp))}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${DAYS * 86400}`;
}

export const clearCookie = () => `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;

export function isAuthed(request) {
  if (!process.env.SESSION_SECRET) return false;
  const raw = (request.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const want = sign(exp);
  return sig.length === want.length && timingSafeEqual(Buffer.from(sig), Buffer.from(want));
}

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers },
  });
