import { query } from '../../infrastructure/database/client'
import { databaseEnabled } from '../../infrastructure/database/client'
import { randomToken, hashToken } from '../security/crypto'
import type { Session, User, VerificationToken } from './types'

const users = new Map<string, User>()
const sessions = new Map<string, Session>()
const verificationTokens = new Map<string, VerificationToken>()

const userFromRow = (row: Record<string, unknown>): User => ({
  id: String(row.id),
  firstName: String(row.first_name),
  lastName: row.last_name ? String(row.last_name) : undefined,
  email: row.email ? String(row.email) : undefined,
  phone: row.phone ? String(row.phone) : undefined,
  emailVerifiedAt: row.email_verified_at ? new Date(String(row.email_verified_at)).toISOString() : undefined,
  phoneVerifiedAt: row.phone_verified_at ? new Date(String(row.phone_verified_at)).toISOString() : undefined,
  passwordHash: String(row.password_hash),
  status: row.status as User['status'],
  role: (row.role ? String(row.role) : 'user') as User['role'],
  marketingEmailConsent: Boolean(row.marketing_email_consent),
  marketingSmsConsent: Boolean(row.marketing_sms_consent),
  marketingConsentAt: row.marketing_consent_at ? new Date(String(row.marketing_consent_at)).toISOString() : undefined,
  createdAt: new Date(String(row.created_at)).toISOString(),
  updatedAt: new Date(String(row.updated_at)).toISOString(),
})

const sessionFromRow = (row: Record<string, unknown>): Session => ({
  id: String(row.id),
  userId: String(row.user_id),
  createdAt: new Date(String(row.created_at)).toISOString(),
  lastActivityAt: new Date(String(row.last_activity_at)).toISOString(),
  expiresAt: new Date(String(row.expires_at)).toISOString(),
  userAgent: row.user_agent ? String(row.user_agent) : undefined,
  ipHash: row.ip_hash ? String(row.ip_hash) : undefined,
})

const verificationFromRow = (row: Record<string, unknown>): VerificationToken => ({
  id: String(row.id),
  userId: String(row.user_id),
  type: row.type as VerificationToken['type'],
  tokenHash: String(row.token_hash),
  expiresAt: new Date(String(row.expires_at)).toISOString(),
  usedAt: row.used_at ? new Date(String(row.used_at)).toISOString() : undefined,
  createdAt: new Date(String(row.created_at)).toISOString(),
})

export const authRepository = {
  async findUserByEmail(email: string) {
    if (!databaseEnabled) return [...users.values()].find((user) => user.email?.toLowerCase() === email.toLowerCase())
    const result = await query<Record<string, unknown>>('SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1', [email])
    return result.rows[0] ? userFromRow(result.rows[0]) : undefined
  },

  async findUserByPhone(phone: string) {
    if (!databaseEnabled) return [...users.values()].find((user) => user.phone === phone)
    const result = await query<Record<string, unknown>>('SELECT * FROM users WHERE phone = $1 LIMIT 1', [phone])
    return result.rows[0] ? userFromRow(result.rows[0]) : undefined
  },

  async findUserById(id: string) {
    if (!databaseEnabled) return users.get(id)
    const result = await query<Record<string, unknown>>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id])
    return result.rows[0] ? userFromRow(result.rows[0]) : undefined
  },

  async createUser(input: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role'> & { role?: User['role'] }) {
    const now = new Date().toISOString()
    const user: User = { ...input, role: input.role ?? 'user', id: `usr_${randomToken(12)}`, createdAt: now, updatedAt: now }
    if (!databaseEnabled) {
      users.set(user.id, user)
      return user
    }
    const result = await query<Record<string, unknown>>(
      `INSERT INTO users (id, first_name, last_name, email, phone, email_verified_at, phone_verified_at, password_hash, status, role,
        marketing_email_consent, marketing_sms_consent, marketing_consent_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [user.id, user.firstName, user.lastName ?? null, user.email ?? null, user.phone ?? null,
        user.emailVerifiedAt ?? null, user.phoneVerifiedAt ?? null, user.passwordHash, user.status,
        user.role, user.marketingEmailConsent, user.marketingSmsConsent, user.marketingConsentAt ?? null, user.createdAt, user.updatedAt],
    )
    return userFromRow(result.rows[0])
  },

  async updateUser(user: User) {
    user.updatedAt = new Date().toISOString()
    if (!databaseEnabled) {
      users.set(user.id, user)
      return user
    }
    const result = await query<Record<string, unknown>>(
      `UPDATE users SET first_name=$2,last_name=$3,email=$4,phone=$5,email_verified_at=$6,phone_verified_at=$7,
        password_hash=$8,status=$9,role=$10,marketing_email_consent=$11,marketing_sms_consent=$12,marketing_consent_at=$13,updated_at=$14
       WHERE id=$1 RETURNING *`,
      [user.id, user.firstName, user.lastName ?? null, user.email ?? null, user.phone ?? null,
        user.emailVerifiedAt ?? null, user.phoneVerifiedAt ?? null, user.passwordHash, user.status, user.role,
        user.marketingEmailConsent, user.marketingSmsConsent, user.marketingConsentAt ?? null, user.updatedAt],
    )
    return result.rows[0] ? userFromRow(result.rows[0]) : undefined
  },

  async createSession(userId: string, meta: Pick<Session, 'userAgent' | 'ipHash'>) {
    const now = new Date()
    const session: Session = {
      id: randomToken(32), userId, createdAt: now.toISOString(), lastActivityAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString(), ...meta,
    }
    if (!databaseEnabled) {
      sessions.set(session.id, session)
      return session
    }
    const result = await query<Record<string, unknown>>(
      `INSERT INTO sessions (id,user_id,created_at,last_activity_at,expires_at,user_agent,ip_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [session.id, session.userId, session.createdAt, session.lastActivityAt, session.expiresAt, session.userAgent ?? null, session.ipHash ?? null],
    )
    return sessionFromRow(result.rows[0])
  },

  async findSession(id: string) {
    if (!databaseEnabled) {
      const session = sessions.get(id)
      if (!session) return undefined
      if (new Date(session.expiresAt).getTime() <= Date.now()) { sessions.delete(id); return undefined }
      session.lastActivityAt = new Date().toISOString()
      return session
    }
    const result = await query<Record<string, unknown>>(
      `UPDATE sessions SET last_activity_at = now() WHERE id=$1 AND expires_at > now() RETURNING *`, [id],
    )
    return result.rows[0] ? sessionFromRow(result.rows[0]) : undefined
  },

  async revokeSession(id: string) {
    if (!databaseEnabled) { sessions.delete(id); return }
    await query('DELETE FROM sessions WHERE id=$1', [id])
  },

  async revokeUserSessions(userId: string) {
    if (!databaseEnabled) {
      for (const [id, session] of sessions) if (session.userId === userId) sessions.delete(id)
      return
    }
    await query('DELETE FROM sessions WHERE user_id=$1', [userId])
  },

  async createVerificationToken(userId: string, type: VerificationToken['type'], rawToken: string, ttlMs: number) {
    const token: VerificationToken = {
      id: `vfy_${randomToken(8)}`, userId, type, tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + ttlMs).toISOString(), createdAt: new Date().toISOString(),
    }
    if (!databaseEnabled) {
      verificationTokens.set(token.id, token)
      return token
    }
    const result = await query<Record<string, unknown>>(
      `INSERT INTO verification_tokens (id,user_id,type,token_hash,expires_at,created_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [token.id, token.userId, token.type, token.tokenHash, token.expiresAt, token.createdAt],
    )
    return verificationFromRow(result.rows[0])
  },

  async consumeVerificationToken(rawToken: string, type: VerificationToken['type']) {
    const hashed = hashToken(rawToken)
    if (!databaseEnabled) {
      const token = [...verificationTokens.values()].find((item) => item.type === type && item.tokenHash === hashed && !item.usedAt)
      if (!token || new Date(token.expiresAt).getTime() <= Date.now()) return undefined
      token.usedAt = new Date().toISOString()
      return token
    }
    const result = await query<Record<string, unknown>>(
      `UPDATE verification_tokens SET used_at=now()
       WHERE id = (SELECT id FROM verification_tokens WHERE type=$1 AND token_hash=$2 AND used_at IS NULL AND expires_at > now()
                   ORDER BY created_at DESC LIMIT 1)
       RETURNING *`, [type, hashed],
    )
    return result.rows[0] ? verificationFromRow(result.rows[0]) : undefined
  },
}
