import { Hono } from 'hono'
import { getPublicHomepage, isLocale } from './service'
export const contentRoutes = new Hono()
contentRoutes.get('/home', async c => {
  const requested = c.req.query('locale') || c.req.header('Accept-Language')?.split(',')[0]?.split('-')[0]
  const locale = isLocale(requested) ? requested : 'ru'
  return c.json(await getPublicHomepage(locale))
})
