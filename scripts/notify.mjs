// Sends a draft to Telegram with Approve / Publish now / Reject buttons.
// Usage: node scripts/notify.mjs <post_id>
import { readFile } from 'node:fs/promises'

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SITE_URL } = process.env
const weekMode = process.argv[2] === '--week'
const id = weekMode ? process.argv[3] : process.argv[2] // week mode: the first day of the week
const post = weekMode ? null : JSON.parse(await readFile(`drafts/${id}.json`, 'utf8'))
const url = (p) => encodeURI(`${SITE_URL}/${p}`)
const chats = [TELEGRAM_CHAT_ID, ...(process.env.TELEGRAM_EXTRA_CHAT_IDS || '').split(',')].map((s) => s.trim()).filter(Boolean) // everyone who gets the drafts
const tg = (chat_id, method, body) =>
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id, ...body }),
  })

if (weekMode) {
  const { readdir } = await import('node:fs/promises')
  const from = Date.parse(`${id}T00:00:00Z`) - 86400000
  const items = []
  for (const f of (await readdir('drafts')).filter((n) => n.endsWith('.json'))) {
    const d = JSON.parse(await readFile(`drafts/${f}`, 'utf8'))
    const t = Date.parse(d.scheduled_for)
    if (d.status === 'draft' && t >= from && t < from + 9 * 86400000) items.push(d)
  }
  items.sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for) || (a.kind === 'story') - (b.kind === 'story'))
  const day = (d) => new Date(d.scheduled_for).toLocaleDateString('es-MX', { timeZone: 'America/Ciudad_Juarez', weekday: 'long', day: 'numeric', month: 'long' })
  const lines = items.map((d) => `• ${day(d)}: ${d.kind === 'story' ? 'Story' : 'Post'}`)
  const summary = `📅 Semana lista: ${items.filter((d) => d.kind !== 'story').length} posts y ${items.filter((d) => d.kind === 'story').length} stories\n\n${lines.join('\n')}\n\nAbajo te llegan uno por uno. Si todo está bien, aprueba la semana completa aquí; si algo no te gusta, recházalo después.`
  let failed = 0
  for (const chat of chats) {
    const r = await tg(chat, 'sendMessage', { text: summary, reply_markup: { inline_keyboard: [[{ text: '✅ Aprobar toda la semana', callback_data: `wk:${id}` }]] } })
    if (!r.ok) {
      failed++
      console.error(chat, await r.text())
    }
  }
  process.exit(failed === chats.length ? 1 : 0)
}

const when = post.scheduled_for
  ? new Date(post.scheduled_for).toLocaleString('es-MX', { timeZone: 'America/Ciudad_Juarez', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
  : 'sin fecha'
const text = post.kind === 'story'
  ? `📱 Story (Instagram y Facebook)\n\n— Se publica: ${when}`
  : `${post.caption_instagram || post.caption}\n\n— Se publica: ${when}`
const reply_markup = {
  inline_keyboard: [
    [
      { text: '✅ Aprobar', callback_data: `apv:${id}` },
      { text: '🚀 Publicar ya', callback_data: `now:${id}` },
    ],
    [{ text: '❌ Rechazar', callback_data: `rej:${id}` }],
  ],
}

let failed = 0
for (const chat of chats) {
  let r
  if (post.images?.length > 1) {
    // Telegram cannot attach buttons to an album, so the slides go first and the buttons follow in a message.
    r = await tg(chat, 'sendMediaGroup', { media: post.images.map((p) => ({ type: 'photo', media: url(p) })) })
    if (r.ok) r = await tg(chat, 'sendMessage', { text: `🖼️ Carrusel de ${post.images.length} imágenes

${text}`.slice(0, 4096), reply_markup })
  } else {
    r = await tg(chat, 'sendPhoto', { photo: url(post.image), caption: text.slice(0, 1024), reply_markup })
  }
  if (!r.ok) {
    failed++
    console.error(chat, await r.text())
  }
}
if (failed === chats.length) process.exit(1) // someone got it, or the run fails
