// Sends a draft to Telegram with Approve / Publish now / Reject buttons.
// Usage: node scripts/notify.mjs <post_id>
import { readFile } from 'node:fs/promises'

const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SITE_URL } = process.env
const id = process.argv[2]
const post = JSON.parse(await readFile(`drafts/${id}.json`, 'utf8'))

const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    photo: encodeURI(`${SITE_URL}/${post.image}`),
    caption: `${post.caption}\n\n— Programado: ${post.scheduled_for || 'sin fecha'}`.slice(0, 1024),
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Aprobar', callback_data: `apv:${id}` },
          { text: '🚀 Publicar ya', callback_data: `now:${id}` },
        ],
        [{ text: '❌ Rechazar', callback_data: `rej:${id}` }],
      ],
    },
  }),
})
if (!r.ok) {
  console.error(await r.text())
  process.exit(1)
}
