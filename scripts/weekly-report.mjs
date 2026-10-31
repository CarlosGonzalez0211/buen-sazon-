// Weekly summary of the last 7 days on Instagram and the Facebook Page, sent to Telegram.
// Reads only: followers, posts of the week, likes, comments and (when the token allows it) reach, saves and shares.
// Usage: node scripts/weekly-report.mjs [--dry]   (--dry prints instead of sending)
import { graph } from './lib/meta.mjs'

const { IG_USER_ID, FB_PAGE_ID, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env
const chats = [TELEGRAM_CHAT_ID, ...(process.env.TELEGRAM_EXTRA_CHAT_IDS || '').split(',')].map((s) => s.trim()).filter(Boolean) // everyone who gets the drafts
const dry = process.argv.includes('--dry')
const since = Math.floor(Date.now() / 1000) - 7 * 86400
const TZ = 'America/Ciudad_Juarez'
const day = (iso) => new Date(iso).toLocaleDateString('es-MX', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' })
const short = (s = '', n = 50) => (s.length > n ? `${s.slice(0, n).trim()}…` : s).replace(/\s+/g, ' ')
const tryGraph = async (...a) => {
  try {
    return await graph(...a)
  } catch (e) {
    return { error: e.message }
  }
}

const lines = ['📊 Resumen semanal (últimos 7 días)', '']

// ---- Instagram
const igUser = await tryGraph(IG_USER_ID, { fields: 'followers_count,media_count' }, 'GET')
const igMedia = await tryGraph(`${IG_USER_ID}/media`, { fields: 'id,caption,media_type,media_product_type,timestamp,like_count,comments_count,permalink', limit: '30' }, 'GET')
lines.push(`Instagram${igUser.followers_count != null ? ` · ${igUser.followers_count} seguidores` : ''}`)
if (igMedia.error) {
  lines.push(`No pude leer los posts: ${igMedia.error}`)
} else {
  const week = (igMedia.data || []).filter((m) => Date.parse(m.timestamp) / 1000 >= since)
  let noInsights = false
  for (const m of week) {
    const ins = await tryGraph(`${m.id}/insights`, { metric: 'reach,saved,shares' }, 'GET')
    if (ins.error) noInsights = true
    const val = (n) => ins.data?.find((x) => x.name === n)?.values?.[0]?.value
    m.reach = val('reach')
    m.saved = val('saved')
    m.shares = val('shares')
    m.score = (m.like_count || 0) + (m.comments_count || 0) * 2 + (m.saved || 0) * 2 + (m.shares || 0) * 3
  }
  const feed = week.filter((m) => m.media_product_type !== 'STORY')
  lines.push(`${feed.length} posts · ${week.length - feed.length} stories`)
  for (const m of feed.sort((a, b) => b.score - a.score)) {
    const extra = [m.reach != null && `alcance ${m.reach}`, m.saved != null && `${m.saved} guardados`, m.shares != null && `${m.shares} compartidos`].filter(Boolean)
    lines.push(`• ${day(m.timestamp)}: "${short(m.caption)}" — ${m.like_count ?? 0} likes, ${m.comments_count ?? 0} comentarios${extra.length ? `, ${extra.join(', ')}` : ''}`)
  }
  if (feed.length > 1) lines.push(`⭐ Lo que mejor funcionó: "${short(feed[0].caption, 40)}"`)
  if (noInsights) lines.push('(Alcance, guardados y compartidos no disponibles: el acceso de la app no incluye estadísticas.)')
}

// ---- Facebook
lines.push('')
const fbPage = await tryGraph(FB_PAGE_ID, { fields: 'followers_count,fan_count' }, 'GET')
const fbPosts = await tryGraph(`${FB_PAGE_ID}/posts`, { fields: 'message,created_time,reactions.summary(true).limit(0),comments.summary(true).limit(0),shares', since: String(since), limit: '30' }, 'GET')
lines.push(`Facebook${fbPage.followers_count ?? fbPage.fan_count ? ` · ${fbPage.followers_count ?? fbPage.fan_count} seguidores` : ''}`)
if (fbPosts.error) {
  lines.push(`No pude leer los posts: ${fbPosts.error}`)
} else {
  const posts = fbPosts.data || []
  lines.push(`${posts.length} posts`)
  for (const p of posts) {
    lines.push(`• ${day(p.created_time)}: "${short(p.message)}" — ${p.reactions?.summary?.total_count ?? 0} reacciones, ${p.comments?.summary?.total_count ?? 0} comentarios, ${p.shares?.count ?? 0} compartidos`)
  }
}

const text = lines.join('\n').slice(0, 4096)
if (dry) {
  console.log(text)
} else {
  let failed = 0
  for (const chat_id of chats) {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text }),
    })
    if (!r.ok) {
      failed++
      console.error(chat_id, await r.text())
    }
  }
  if (failed === chats.length) process.exit(1)
}
