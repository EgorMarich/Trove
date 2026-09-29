import { randomToken } from '../../modules/security/crypto'
import { redis } from './client'

const memoryLocks = new Map<string, { token: string; expiresAt: number }>()

export async function acquireLock(key: string, ttlMs = 15_000) {
  const token = randomToken(16)
  if (redis) {
    if (redis.status === 'wait') await redis.connect()
    const result = await redis.set(`trove:lock:${key}`, token, 'PX', ttlMs, 'NX')
    return result === 'OK' ? token : null
  }

  const current = memoryLocks.get(key)
  if (current && current.expiresAt > Date.now()) return null
  memoryLocks.set(key, { token, expiresAt: Date.now() + ttlMs })
  return token
}

export async function releaseLock(key: string, token: string) {
  if (redis) {
    if (redis.status === 'wait') await redis.connect()
    const script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end"
    return (await redis.eval(script, 1, `trove:lock:${key}`, token)) === 1
  }
  const current = memoryLocks.get(key)
  if (current?.token !== token) return false
  memoryLocks.delete(key)
  return true
}
