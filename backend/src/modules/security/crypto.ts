import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 }

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derived = (await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS)) as Buffer
  return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt.toString('base64url')}$${derived.toString('base64url')}`
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, n, r, p, saltEncoded, hashEncoded] = encoded.split('$')
  if (algorithm !== 'scrypt' || !n || !r || !p || !saltEncoded || !hashEncoded) return false
  const salt = Buffer.from(saltEncoded, 'base64url')
  const expected = Buffer.from(hashEncoded, 'base64url')
  const actual = (await scrypt(password, salt, expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 32 * 1024 * 1024 })) as Buffer
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function randomToken(size = 32) {
  return randomBytes(size).toString('base64url')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function hashIp(ip?: string) {
  return ip ? createHash('sha256').update(ip).digest('hex') : undefined
}
