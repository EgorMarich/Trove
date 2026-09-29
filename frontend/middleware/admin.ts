export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return
  const api = useApi()
  try {
    await api('/api/admin/me')
  } catch {
    return navigateTo(`/admin/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
