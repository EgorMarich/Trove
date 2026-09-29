export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const baseUrl = String(config.public.siteUrl || 'http://localhost:3000').replace(/\/$/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\nDisallow: /account/\nDisallow: /booking/\nDisallow: /payment/\nDisallow: /auth/\n\nSitemap: ${baseUrl}/sitemap.xml\n`
})
