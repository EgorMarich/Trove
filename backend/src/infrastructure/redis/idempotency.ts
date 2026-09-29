import { redis } from './client'

const memory = new Map<string, { value: string; expiresAt: number }>()

export async function acquireIdempotency(key: string, value: string, ttlSeconds = 900) {
  if (redis) {
    if (redis.status === 'wait') await redis.connect()
    const result = await redis.set(`trove:idempotency:${key}`, value, 'EX', ttlSeconds, 'NX')
    return result === 'OK'
  }

  const current = memory.get(key)
  if (current && current.expiresAt > Date.now()) return false
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  return true
}

export async function getIdempotency(key: string) {
  if (redis) {
    if (redis.status === 'wait') await redis.connect()
    return redis.get(`trove:idempotency:${key}`)
  }
  const item = memory.get(key)
  if (!item || item.expiresAt <= Date.now()) {
    memory.delete(key)
    return null
  }
  return item.value
}
