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

const GRAPH = 'https://graph.facebook.com/v26.0'

async function graph(path, params, method = 'POST') {
  const qs = new URLSearchParams({ ...params, access_token: process.env.FB_PAGE_TOKEN })
  const r = await fetch(`${GRAPH}/${path}${method === 'GET' ? `?${qs}` : ''}`, {
    method,
    ...(method === 'POST' && { body: qs }),
  })
  const j = await r.json()
  if (!r.ok) throw new Error(`${path}: ${j.error?.message || r.status}`)
  return j
}

// Instagram (container -> wait until ready -> publish), then Facebook Page photo.
async function publish(post) {
  const { IG_USER_ID, FB_PAGE_ID, FB_PAGE_TOKEN } = process.env
  if (!IG_USER_ID || !FB_PAGE_ID || !FB_PAGE_TOKEN) throw new Error('Meta no está configurado todavía')
  const imageUrl = encodeURI(`${SITE_URL}/${post.image}`)

  // Skip platforms already done, so a retry after a partial failure never double-posts.
  post.published_on ??= {}

  if (!post.published_on.instagram) {
    const { id: creation } = await graph(`${IG_USER_ID}/media`, { image_url: imageUrl, caption: post.caption })
    for (let i = 0; i < 20; i++) {
      const { status_code } = await graph(creation, { fields: 'status_code' }, 'GET')
      if (status_code === 'FINISHED') break
      if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Instagram: contenedor ${status_code}`)
      await new Promise((r) => setTimeout(r, 3000))
    }
    const { id } = await graph(`${IG_USER_ID}/media_publish`, { creation_id: creation })
    post.published_on.instagram = id
    await writeFile(file, JSON.stringify(post, null, 2) + '\n')
  }

  if (!post.published_on.facebook) {
    const { post_id, id } = await graph(`${FB_PAGE_ID}/photos`, { url: imageUrl, caption: post.caption })
    post.published_on.facebook = post_id || id
    await writeFile(file, JSON.stringify(post, null, 2) + '\n')
  }
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
