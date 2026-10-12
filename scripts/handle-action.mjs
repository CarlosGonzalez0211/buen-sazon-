// Applies an approver's decision to drafts/<id>.json, publishes if asked, and
// updates the Telegram message so the result is visible in the chat.
import { readFile, writeFile } from 'node:fs/promises'

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

// Publishing is wired up once the Meta app + tokens exist (next onboarding step).
async function publish(post) {
  if (!process.env.IG_ACCESS_TOKEN) throw new Error('Meta no está configurado todavía')
  const imageUrl = encodeURI(`${SITE_URL}/${post.image}`)
  throw new Error(`publish() pendiente de implementar (imagen: ${imageUrl})`)
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
    await publish(post)
    post.status = 'published'
    await writeFile(file, JSON.stringify(post, null, 2) + '\n')
    await setStatusLine('🚀 Publicado.')
  } catch (e) {
    await setStatusLine(`⚠️ Aprobado, pero no se pudo publicar ahora: ${e.message}`)
  }
} else {
  throw new Error(`Acción desconocida: ${ACTION}`)
}
