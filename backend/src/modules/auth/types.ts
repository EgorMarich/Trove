export type ContactType = 'email' | 'phone'
export type UserRole = 'user' | 'admin' | 'manager' | 'editor'

export interface User {
  id: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  emailVerifiedAt?: string
  phoneVerifiedAt?: string
  passwordHash: string
  status: 'active' | 'suspended'
  role: UserRole
  marketingEmailConsent: boolean
  marketingSmsConsent: boolean
  marketingConsentAt?: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: string
  createdAt: string
  lastActivityAt: string
  expiresAt: string
  userAgent?: string
  ipHash?: string
}

export interface VerificationToken {
  id: string
  userId: string
  type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET'
  tokenHash: string
  expiresAt: string
  usedAt?: string
  createdAt: string
}
