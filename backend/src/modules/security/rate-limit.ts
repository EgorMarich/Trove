import { redis } from '../../infrastructure/redis/client'

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  if (redis) {
    if (redis.status === 'wait') await redis.connect()
    const redisKey = `trove:rate:${key}`
    const count = await redis.incr(redisKey)
    if (count === 1) await redis.pexpire(redisKey, windowMs)
    const ttl = Math.max(await redis.pttl(redisKey), 0)
    return { allowed: count <= limit, retryAfter: Math.ceil(ttl / 1000) }
  }

  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }
  if (current.count >= limit) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
  current.count += 1
  return { allowed: true, retryAfter: 0 }
}
