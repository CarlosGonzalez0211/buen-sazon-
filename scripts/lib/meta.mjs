// Publishes a draft to Instagram and the Facebook Page via the Graph API (Page token).
// Single image: post.image. Carousel: post.images (2 to 10 slides).
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

async function waitReady(container) {
  for (let i = 0; i < 20; i++) {
    const { status_code } = await graph(container, { fields: 'status_code' }, 'GET')
    if (status_code === 'FINISHED') return
    if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Instagram: contenedor ${status_code}`)
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error('Instagram: el contenedor tardó demasiado en estar listo')
}

// `save(post)` persists the draft after each platform succeeds, so a retry after a
// partial failure skips what's already live and never double-posts.
export async function publish(post, save) {
  const { IG_USER_ID, FB_PAGE_ID, FB_PAGE_TOKEN, SITE_URL } = process.env
  if (!IG_USER_ID || !FB_PAGE_ID || !FB_PAGE_TOKEN) throw new Error('Meta no está configurado todavía')
  const urls = (post.images?.length > 1 ? post.images : [post.image]).map((p) => encodeURI(`${SITE_URL}/${p}`))
  const carousel = urls.length > 1
  post.published_on ??= {}

  if (!post.published_on.instagram) {
    const caption = post.caption_instagram || post.caption
    let creation
    if (carousel) {
      const children = []
      for (const image_url of urls) {
        const { id } = await graph(`${IG_USER_ID}/media`, { image_url, is_carousel_item: 'true' })
        await waitReady(id)
        children.push(id)
      }
      ;({ id: creation } = await graph(`${IG_USER_ID}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption }))
    } else {
      ;({ id: creation } = await graph(`${IG_USER_ID}/media`, { image_url: urls[0], caption }))
    }
    await waitReady(creation)
    const { id } = await graph(`${IG_USER_ID}/media_publish`, { creation_id: creation })
    post.published_on.instagram = id
    await save(post)
  }

  if (!post.published_on.facebook) {
    if (carousel) {
      const attached = {}
      for (const [i, url] of urls.entries()) {
        const { id } = await graph(`${FB_PAGE_ID}/photos`, { url, published: 'false' })
        attached[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id })
      }
      const { id } = await graph(`${FB_PAGE_ID}/feed`, { message: post.caption, ...attached })
      post.published_on.facebook = id
    } else {
      const { post_id, id } = await graph(`${FB_PAGE_ID}/photos`, { url: urls[0], caption: post.caption })
      post.published_on.facebook = post_id || id
    }
    await save(post)
  }
}
