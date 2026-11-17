import { isAuthed, json } from '../lib/auth.mjs';
import { buildReport } from '../lib/report.mjs';

export async function GET(request) {
  if (!isAuthed(request)) return json({ error: 'unauthorized' }, 401);
  try {
    return json(await buildReport());
  } catch (err) {
    console.error('report failed', err);
    return json({ error: 'No se pudo cargar el reporte' }, 500);
  }
}
