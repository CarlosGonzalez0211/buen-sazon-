// Sweep: publishes approved drafts whose scheduled time has arrived, then tells the admin.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { publish } from './lib/meta.mjs'

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env

async function say(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text }),
  })
}

let failed = false
for (const f of (await readdir('drafts')).filter((n) => n.endsWith('.json'))) {
  const path = `drafts/${f}`
  const post = JSON.parse(await readFile(path, 'utf8'))
  if (post.status !== 'approved' || !post.scheduled_for || Date.parse(post.scheduled_for) > Date.now()) continue

  const save = (p) => writeFile(path, JSON.stringify(p, null, 2) + '\n')
  try {
    await publish(post, save)
    post.status = 'published'
    await save(post)
    await say(`🚀 Publicado: ${post.id}`)
  } catch (e) {
    failed = true
    await say(`⚠️ No se pudo publicar ${post.id}: ${e.message}`)
  }
}
if (failed) process.exitCode = 1
