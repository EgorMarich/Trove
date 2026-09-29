import assert from 'node:assert/strict'
import { hashToken } from '../crypto'

const token = 'csrf-test-token'
assert.equal(hashToken(token), hashToken(token))
assert.notEqual(hashToken(token), hashToken('other-token'))
console.log('security primitives: ok')
