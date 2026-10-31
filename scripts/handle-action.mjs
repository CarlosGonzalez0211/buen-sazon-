// Applies an approver's decision to drafts/<id>.json, publishes if asked, and
// updates the Telegram message so the result is visible in the chat.
import { readFile, writeFile } from 'node:fs/promises'
import { publish } from './lib/meta.mjs'

const { ACTION, POST_ID, CHAT_ID, MESSAGE_ID, TELEGRAM_BOT_TOKEN, SITE_URL } = process.env
const file = `drafts/${POST_ID}.json`

async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) console.error(method, r.status, await r.text())
}

async function setStatusLine(text) {
  // Drop the buttons and show the outcome (plain text, no parse_mode).
  await tg('editMessageReplyMarkup', { chat_id: CHAT_ID, message_id: Number(MESSAGE_ID), reply_markup: { inline_keyboard: [] } })
  await tg('sendMessage', { chat_id: CHAT_ID, reply_to_message_id: Number(MESSAGE_ID), text })
}

const save = (p) => writeFile(file, JSON.stringify(p, null, 2) + '\n')
if (ACTION === 'approve_week') {
  // POST_ID is the first day of the week: approve every draft still waiting from the day before it to 8 days after.
  const { readdir } = await import('node:fs/promises')
  const from = Date.parse(`${POST_ID}T00:00:00Z`) - 86400000
  let n = 0
  for (const f of (await readdir('drafts')).filter((x) => x.endsWith('.json'))) {
    const p = JSON.parse(await readFile(`drafts/${f}`, 'utf8'))
    const t = Date.parse(p.scheduled_for)
    if (p.status !== 'draft' || !(t >= from && t < from + 9 * 86400000)) continue
    p.status = 'approved'
    await writeFile(`drafts/${f}`, JSON.stringify(p, null, 2) + '\n')
    n++
  }
  await setStatusLine(n ? `✅ Semana aprobada: ${n} publicaciones (posts y stories) quedan programadas.` : 'No había nada pendiente por aprobar en esa semana.')
  process.exit(0)
}

const post = JSON.parse(await readFile(file, 'utf8'))

if (post.status === 'published' || post.status === 'rejected') {
  await setStatusLine(`Este post ya estaba ${post.status === 'published' ? 'publicado' : 'rechazado'}.`)
  process.exit(0)
}

if (ACTION === 'reject') {
  post.status = 'rejected'
  await writeFile(file, JSON.stringify(post, null, 2) + '\n')
  await setStatusLine('❌ Post rechazado.')
} else if (ACTION === 'approve') {
  post.status = 'approved'
  await writeFile(file, JSON.stringify(post, null, 2) + '\n')
  await setStatusLine('✅ Aprobado. Se publicará en su horario.')
} else if (ACTION === 'publish_now') {
  post.status = 'approved' // persisted first, so a failed publish is retried by the scheduled sweep
  await writeFile(file, JSON.stringify(post, null, 2) + '\n')
  try {
    await publish(post, save)
    post.status = 'published'
    await writeFile(file, JSON.stringify(post, null, 2) + '\n')
    await setStatusLine(`🚀 Publicado.${post.facebook_error ? `\n⚠️ En Facebook no se pudo: ${post.facebook_error}` : ''}`)
  } catch (e) {
    await setStatusLine(`⚠️ Aprobado, pero no se pudo publicar ahora: ${e.message}`)
  }
} else {
  throw new Error(`Acción desconocida: ${ACTION}`)
}
