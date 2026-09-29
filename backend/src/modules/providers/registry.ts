import { providers } from './index'

export type ProviderHealthStatus = 'ready' | 'disabled' | 'degraded'

export interface ProviderHealth {
  id: string
  name: string
  status: ProviderHealthStatus
  capabilities: { search: boolean; priceCheck: boolean; booking: boolean; redirect: boolean }
  checkedAt: string
  reason?: string
}

export async function getProviderHealth(): Promise<ProviderHealth[]> {
  const checkedAt = new Date().toISOString()
  return providers.map((provider) => {
    const enabled = 'enabled' in provider ? Boolean(provider.enabled) : true
    if (!enabled) return { id: provider.id, name: provider.name, status: 'disabled', capabilities: provider.capabilities, checkedAt, reason: 'Credentials are not configured' }
    return { id: provider.id, name: provider.name, status: 'ready', capabilities: provider.capabilities, checkedAt }
  })
}
