const routes = ['/', '/tours', '/hot', '/guides', '/favorites', '/legal/terms', '/legal/privacy', '/support']

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const baseUrl = String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  const urls = routes.map((path) => `<url><loc>${baseUrl}${path}</loc></url>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
})
