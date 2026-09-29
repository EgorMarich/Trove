import { randomToken, hashToken } from './crypto'
import type { Context, Next } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'

const CSRF_COOKIE = 'trove_csrf'
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const SESSION_COOKIE = process.env.NODE_ENV === 'production' ? '__Host-trove_session' : 'trove_session'

function isSameOrigin(c: Context) {
  const origin = c.req.header('origin')
  if (!origin) return true
  return origin === (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
}

export async function securityMiddleware(c: Context, next: Next) {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (process.env.NODE_ENV === 'production') c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  if (!getCookie(c, CSRF_COOKIE)) {
    setCookie(c, CSRF_COOKIE, randomToken(24), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }

  if (!SAFE_METHODS.has(c.req.method) && getCookie(c, SESSION_COOKIE)) {
    if (!isSameOrigin(c)) return c.json({ error: 'CSRF_ORIGIN_MISMATCH' }, 403)
    const csrfCookie = getCookie(c, CSRF_COOKIE)
    const csrfHeader = c.req.header('X-CSRF-Token')
    if (!csrfCookie || !csrfHeader || hashToken(csrfCookie) !== hashToken(csrfHeader)) {
      return c.json({ error: 'CSRF_TOKEN_REQUIRED' }, 403)
    }
  }

  await next()
}
