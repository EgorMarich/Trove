function readCookie(name: string) {
  if (typeof document === 'undefined') return undefined
  const value = document.cookie.split('; ').find((item) => item.startsWith(`${name}=`))
  return value ? decodeURIComponent(value.slice(name.length + 1)) : undefined
}

function readOrCreateSessionId() {
  if (typeof window === 'undefined') return undefined
  const key = 'trove_session_id'
  const existing = window.localStorage.getItem(key)
  if (existing) return existing
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(key, id)
  return id
}

export const useApi = () => {
  const config = useRuntimeConfig()
  return $fetch.create({
    baseURL: config.public.apiBaseUrl,
    credentials: 'include',
    onRequest({ options }) {
      const csrf = readCookie('trove_csrf')
      const sessionId = readOrCreateSessionId()
      if (sessionId) {
        const headers = new Headers(options.headers as HeadersInit | undefined)
        headers.set('X-Trove-Session', sessionId)
        options.headers = headers
      }
      if (csrf) {
        const headers = new Headers(options.headers as HeadersInit | undefined)
        headers.set('X-CSRF-Token', csrf)
        options.headers = headers
      }
    },
  })
}
