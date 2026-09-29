import { computed } from 'vue'
import { useApi } from './useApi'

export interface AuthUser {
  id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  emailVerifiedAt?: string
  phoneVerifiedAt?: string
  status: 'active' | 'suspended'
  role: 'user' | 'admin' | 'manager' | 'editor'
  marketingEmailConsent: boolean
  marketingSmsConsent: boolean
  createdAt: string
  updatedAt: string
}

export const useAuth = () => {
  const api = useApi()
  const isAuthenticated = computed(() => Boolean(user.value))

  const user = useState<AuthUser | null>('trove-auth-user', () => null)
  const loading = useState<boolean>('trove-auth-loading', () => false)
  const initialized = useState<boolean>('trove-auth-initialized', () => false)

  const load = async () => {
    if (initialized.value) return user.value
    loading.value = true
    try {
      const response = await api<{ user: AuthUser | null }>('/api/auth/me')
      user.value = response.user
    } catch {
      user.value = null
    } finally {
      initialized.value = true
      loading.value = false
    }
    return user.value
  }

  const login = async (identifier: string, password: string) => {
    const response = await api<{ user: AuthUser }>('/api/auth/login', { method: 'POST', body: { identifier, password } })
    user.value = response.user
    initialized.value = true
    return response.user
  }

  const register = async (payload: Record<string, unknown>) => {
    return api<{ user: AuthUser; verificationType?: string; demoOnlyVerificationCode?: string }>('/api/auth/register', { method: 'POST', body: payload })
  }

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    user.value = null
  }

  return { user, loading, initialized, isAuthenticated, load, login, register, logout }
}
