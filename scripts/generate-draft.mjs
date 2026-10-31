// Creates the next draft from the approved library: picks a caption (content/captions.json) and its
// flyer (content/flyers.json, images in public/social/), writes drafts/<id>.json, prints the id.
// Env: POST_DATE (YYYY-MM-DD, local) targets a specific day, default tomorrow.
// `node scripts/generate-draft.mjs --plan 8` prints the next 8 Tue/Thu/Sat slots without writing anything.
import { readFile, readdir, writeFile } from 'node:fs/promises'

const TZ = 'America/Ciudad_Juarez'
const POST_DAYS = ['tue', 'thu', 'sat']
const WEEKDAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
// Share of the feed per caption type (plan pillars); the type furthest below its share goes next.
const TARGET = { dish: 0.38, ritual: 0.17, temporada: 0.13, poll: 0.1, tag: 0.1, statement: 0.12, review: 0.08, anatomia: 0.06 }
const COOLDOWN_POSTS = 10 // a caption is not repeated within this many posts
const REJECT_DAYS = 30 // a rejected caption sits out this long
const COLD_MONTHS = [11, 12, 1, 2]

// ---- dates -----------------------------------------------------------------
const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d) // YYYY-MM-DD
const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10)
}
const weekdayOf = (dateStr) => WEEKDAY[new Date(`${dateStr}T12:00:00Z`).getUTCDay()]
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

function noonLocalToUtc(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d, 12)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  }).formatToParts(new Date(guess))
  const get = (t) => Number(parts.find((p) => p.type === t).value)
  const asLocal = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  return new Date(guess - (asLocal - guess))
}

function thirdSunday(year, monthIdx) {
  const first = new Date(Date.UTC(year, monthIdx, 1)).getUTCDay()
  return 1 + ((7 - first) % 7) + 14
}

function holidays(year) {
  const pad = (n) => String(n).padStart(2, '0')
  const f = (m, d) => `${year}-${pad(m)}-${pad(d)}`
  return {
    candelaria: f(2, 2), 'amor-amistad': f(2, 14), 'dia-nino': f(4, 30), 'cinco-mayo': f(5, 5), 'dia-madres': f(5, 10),
    'dia-padre': f(6, thirdSunday(year, 5)), independencia: f(9, 15), 'dia-muertos': f(11, 2), guadalupe: f(12, 12),
    navidad: f(12, 24), 'fin-ano': f(12, 31),
  }
}

// ---- library ---------------------------------------------------------------
const captions = JSON.parse(await readFile('content/captions.json', 'utf8')).captions.filter((c) => c.status === 'ready')
const flyers = JSON.parse(await readFile('content/flyers.json', 'utf8'))
const library = captions.filter((c) => flyers[c.id])

const drafts = []
for (const f of await readdir('drafts')) {
  if (f.endsWith('.json')) drafts.push(JSON.parse(await readFile(`drafts/${f}`, 'utf8')))
}
const byTime = (a, b) => (a.scheduled_for || a.created_at || '').localeCompare(b.scheduled_for || b.created_at || '')
const history = drafts.filter((d) => d.caption_id && d.status !== 'rejected').sort(byTime)
const rejected = drafts.filter((d) => d.caption_id && d.status === 'rejected')

const hash = (s) => [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7)

// ---- choose ----------------------------------------------------------------
function holidayPick(date, used) {
  const year = Number(date.slice(0, 4))
  const dates = { ...holidays(year), ...Object.fromEntries(Object.entries(holidays(year + 1)).map(([k, v]) => [`${k}@next`, v])) }
  for (const c of library) {
    const h = c.when?.holiday
    if (!h) continue
    const until = daysBetween(date, dates[h]) // days from the post day to the holiday
    const db = c.when.days_before ?? 0
    // Posts go out Tue/Thu/Sat only, so allow a short window ahead of the ideal day (the day-of greeting: at most 1 day early).
    if (until < db || until > db + (db === 0 ? 1 : 2)) continue
    if (history.some((d) => d.caption_id === c.id && d.scheduled_for?.slice(0, 4) === date.slice(0, 4))) continue
    return c
  }
  return null
}

function pick(date, hist) {
  const used = new Set(hist.slice(-COOLDOWN_POSTS).map((d) => d.caption_id))
  const sat = new Set(rejected.filter((d) => daysBetween(d.created_at?.slice(0, 10) || '1970-01-01', date) < REJECT_DAYS).map((d) => d.caption_id))
  const holiday = holidayPick(date, used)
  if (holiday) return holiday

  const wd = weekdayOf(date)
  const cold = COLD_MONTHS.includes(Number(date.slice(5, 7)))
  const general = library.filter((c) => !c.when?.holiday && (!c.when?.weekday || c.when.weekday === wd) && (!c.when?.season || (c.when.season === 'cold' && cold)) && !sat.has(c.id))
  const prev = hist.at(-1)
  const recent = hist.slice(-12)

  const fresh = (list) => (list.some((c) => !used.has(c.id)) ? list.filter((c) => !used.has(c.id)) : list)
  const types = [...new Set(general.map((c) => c.type))].filter((t) => TARGET[t] && t !== prev?.type)
  const deficit = (t) => TARGET[t] - (recent.length ? recent.filter((d) => d.type === t).length / recent.length : 0)
  types.sort((a, b) => deficit(b) - deficit(a) || a.localeCompare(b))
  for (const t of types) {
    let pool = fresh(general.filter((c) => c.type === t))
    const noRepeatColour = pool.filter((c) => flyers[c.id].family !== prev?.family || flyers[c.id].family === 'mixed')
    if (noRepeatColour.length) pool = noRepeatColour
    // least recently used first, then a stable pseudo-random tie-break per date
    const last = (c) => hist.findLastIndex((d) => d.caption_id === c.id)
    pool.sort((a, b) => last(a) - last(b) || hash(date + a.id) - hash(date + b.id))
    if (pool.length) return pool[0]
  }
  return general.sort((a, b) => hash(date + a.id) - hash(date + b.id))[0] // nothing fits the rules: any eligible caption
}

function build(date, c) {
  const fly = flyers[c.id]
  const tags = (c.hashtags || []).join(' ')
  return {
    id: `${date}-${c.id}`.slice(0, 60),
    status: 'draft',
    type: c.type,
    caption_id: c.id,
    family: fly.family,
    image: fly.images[0],
    ...(fly.images.length > 1 && { images: fly.images }),
    caption: c.text, // Facebook: no hashtags
    caption_instagram: tags ? `${c.text}\n\n${tags}` : c.text,
    scheduled_for: noonLocalToUtc(date).toISOString(),
    created_at: new Date().toISOString(),
  }
}

// A Story goes with every feed post: same flyer, 1080x1920, approved on its own and published at 3 PM local.
function buildStory(date, c) {
  const story = flyers[c.id].story
  if (!story) return null
  return {
    id: `${date}-story`,
    kind: 'story',
    status: 'draft',
    story_of: c.id, // not caption_id: stories do not count in the feed rotation
    image: story,
    scheduled_for: new Date(noonLocalToUtc(date).getTime() + 3 * 3600 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  }
}

// ---- run -------------------------------------------------------------------
const start = process.env.POST_DATE || addDays(ymd(new Date()), 1)
const planIdx = process.argv.indexOf('--plan')

if (planIdx > -1) {
  const n = Number(process.argv[planIdx + 1]) || 6
  const hist = [...history]
  let date = start
  for (let shown = 0; shown < n; date = addDays(date, 1)) {
    if (!POST_DAYS.includes(weekdayOf(date))) continue
    const c = pick(date, hist)
    const d = build(date, c)
    hist.push(d)
    console.log(`${weekdayOf(date)} ${date}  ${c.type.padEnd(9)} ${d.family.padEnd(6)} ${c.id}`)
    shown++
  }
} else {
  if (live().some((d) => d.kind !== 'story' && d.scheduled_for?.slice(0, 10) === noonLocalToUtc(start).toISOString().slice(0, 10))) {
    throw new Error(`Ya hay un borrador para el ${start}`)
  }
  const c = pick(start, history)
  const draft = build(start, c)
  await writeFile(`drafts/${draft.id}.json`, JSON.stringify(draft, null, 2) + '\n')
  const story = buildStory(start, c)
  if (story) await writeFile(`drafts/${story.id}.json`, JSON.stringify(story, null, 2) + '\n')
  console.log(draft.id)
}

function live() {
  return drafts.filter((d) => d.status !== 'rejected')
}
