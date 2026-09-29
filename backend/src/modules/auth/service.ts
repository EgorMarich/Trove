import { authRepository } from './repository'
import { hashPassword, hashIp, randomToken, verifyPassword } from '../security/crypto'
import type { User, VerificationToken } from './types'

const normalizePhone = (phone?: string) => phone?.replace(/[^\d+]/g, '')

export function publicUser(user: User) {
  const { passwordHash, ...safe } = user
  return safe
}

export async function register(input: {
  firstName: string
  email?: string
  phone?: string
  password: string
  marketingEmailConsent: boolean
  marketingSmsConsent: boolean
}) {
  const email = input.email?.trim().toLowerCase() || undefined
  const phone = normalizePhone(input.phone)
  if (!email && !phone) throw new Error('EMAIL_OR_PHONE_REQUIRED')
  if (email && await authRepository.findUserByEmail(email)) throw new Error('CONTACT_ALREADY_EXISTS')
  if (phone && await authRepository.findUserByPhone(phone)) throw new Error('CONTACT_ALREADY_EXISTS')

  let user: User
  try {
    user = await authRepository.createUser({
      firstName: input.firstName.trim(), email, phone, passwordHash: await hashPassword(input.password), status: 'active',
      marketingEmailConsent: Boolean(email && input.marketingEmailConsent), marketingSmsConsent: Boolean(phone && input.marketingSmsConsent),
      marketingConsentAt: (input.marketingEmailConsent || input.marketingSmsConsent) ? new Date().toISOString() : undefined,
    })
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as Error & { code?: string }).code === '23505') throw new Error('CONTACT_ALREADY_EXISTS')
    throw error
  }

  const verification: { type: VerificationToken['type']; token: string } | null = email
    ? { type: 'EMAIL_VERIFICATION', token: randomToken(6) }
    : phone ? { type: 'PHONE_VERIFICATION', token: randomToken(6) } : null
  if (verification) await authRepository.createVerificationToken(user.id, verification.type, verification.token, 15 * 60 * 1000)
  return { user: publicUser(user), verificationCode: verification?.token, verificationType: verification?.type }
}

export async function login(identifier: string, password: string, meta: { userAgent?: string; ip?: string }) {
  const normalized = identifier.includes('@') ? identifier.trim().toLowerCase() : normalizePhone(identifier)
  const user = normalized && (normalized.includes('@') ? await authRepository.findUserByEmail(normalized) : await authRepository.findUserByPhone(normalized))
  if (!user || !(await verifyPassword(password, user.passwordHash)) || user.status !== 'active') return undefined
  return { user, session: await authRepository.createSession(user.id, { userAgent: meta.userAgent, ipHash: hashIp(meta.ip) }) }
}

export async function verifyContact(rawCode: string, type: VerificationToken['type']) {
  const token = await authRepository.consumeVerificationToken(rawCode, type)
  if (!token) return undefined
  const user = await authRepository.findUserById(token.userId)
  if (!user) return undefined
  if (type === 'EMAIL_VERIFICATION') user.emailVerifiedAt = new Date().toISOString()
  if (type === 'PHONE_VERIFICATION') user.phoneVerifiedAt = new Date().toISOString()
  return authRepository.updateUser(user)
}

export async function requestPasswordReset(identifier: string) {
  const normalized = identifier.includes('@') ? identifier.trim().toLowerCase() : normalizePhone(identifier)
  const user = normalized && (normalized.includes('@') ? await authRepository.findUserByEmail(normalized) : await authRepository.findUserByPhone(normalized))
  if (!user) return undefined
  const code = randomToken(6)
  await authRepository.createVerificationToken(user.id, 'PASSWORD_RESET', code, 15 * 60 * 1000)
  return code
}

export async function resetPassword(code: string, password: string) {
  const token = await authRepository.consumeVerificationToken(code, 'PASSWORD_RESET')
  if (!token) return undefined
  const user = await authRepository.findUserById(token.userId)
  if (!user) return undefined
  user.passwordHash = await hashPassword(password)
  await authRepository.updateUser(user)
  await authRepository.revokeUserSessions(user.id)
  return user
}
