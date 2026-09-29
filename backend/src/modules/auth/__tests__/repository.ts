import { authRepository } from '../repository'

const email = `auth-test-${Date.now()}@example.com`
const user = await authRepository.createUser({
  firstName: 'Trove',
  email,
  passwordHash: 'test-hash',
  status: 'active',
  marketingEmailConsent: false,
  marketingSmsConsent: false,
})

if ((await authRepository.findUserByEmail(email))?.id !== user.id) throw new Error('AUTH_REPOSITORY_USER_LOOKUP_FAILED')

const session = await authRepository.createSession(user.id, { userAgent: 'test', ipHash: 'hash' })
if ((await authRepository.findSession(session.id))?.userId !== user.id) throw new Error('AUTH_REPOSITORY_SESSION_LOOKUP_FAILED')

const token = await authRepository.createVerificationToken(user.id, 'PASSWORD_RESET', '123456', 60_000)
if ((await authRepository.consumeVerificationToken('123456', 'PASSWORD_RESET'))?.id !== token.id) throw new Error('AUTH_REPOSITORY_TOKEN_CONSUME_FAILED')
if (await authRepository.consumeVerificationToken('123456', 'PASSWORD_RESET')) throw new Error('AUTH_REPOSITORY_TOKEN_REPLAY_ALLOWED')

await authRepository.revokeSession(session.id)
if (await authRepository.findSession(session.id)) throw new Error('AUTH_REPOSITORY_SESSION_REVOKE_FAILED')

console.log('auth repository test passed')
