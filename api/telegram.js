// Telegram webhook: validates the tap, then hands off to GitHub Actions.
// All state changes and publishing happen in .github/workflows/handle-action.yml.
// Required env: TELEGRAM_WEBHOOK_SECRET, TELEGRAM_APPROVER_IDS (comma-separated user ids),
// TELEGRAM_BOT_TOKEN, GH_DISPATCH_TOKEN, GH_REPO (owner/name).

const ACTIONS = { apv: 'approve', now: 'publish_now', rej: 'reject', wk: 'approve_week' }

async function telegram(method, body) {
  return fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // 1. Proves the request came from Telegram, not someone who guessed the URL.
  if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).end()
  }

  const cb = req.body?.callback_query
  if (!cb) return res.status(200).end() // ignore plain messages

  // 2. Proves the tapper is an approver, not just another user of the bot.
  const approvers = (process.env.TELEGRAM_APPROVER_IDS || '').split(',').map((s) => s.trim())
  if (!approvers.includes(String(cb.from.id))) {
    await telegram('answerCallbackQuery', { callback_query_id: cb.id, text: 'No autorizado' })
    return res.status(200).end()
  }

  const [prefix, postId] = String(cb.data || '').split(':')
  const action = ACTIONS[prefix]
  if (!action || !/^[\w-]{1,40}$/.test(postId || '')) {
    await telegram('answerCallbackQuery', { callback_query_id: cb.id, text: 'Acción inválida' })
    return res.status(200).end()
  }

  const dispatch = await fetch(
    `https://api.github.com/repos/${process.env.GH_REPO}/actions/workflows/handle-action.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GH_DISPATCH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          action,
          post_id: postId,
          chat_id: String(cb.message.chat.id),
          message_id: String(cb.message.message_id),
        },
      }),
    },
  )

  await telegram('answerCallbackQuery', {
    callback_query_id: cb.id,
    text: dispatch.ok ? 'Recibido ✅' : `No se pudo iniciar (GitHub ${dispatch.status})`,
  })
  if (!dispatch.ok) console.error('dispatch failed', dispatch.status, await dispatch.text())
  return res.status(200).end()
}
