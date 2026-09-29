import Redis from 'ioredis'

const url = process.env.REDIS_URL
export const redisEnabled = Boolean(url)
export const redis = url
  ? new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: true,
    })
  : null

export async function getRedisHealth() {
  if (!redis) return { configured: false, ok: false }
  try {
    if (redis.status === 'wait') await redis.connect()
    await redis.ping()
    return { configured: true, ok: true }
  } catch {
    return { configured: true, ok: false }
  }
}

export async function closeRedis() {
  if (redis) redis.disconnect()
}
