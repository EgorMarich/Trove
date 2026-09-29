import { query } from '../src/infrastructure/database/client'
import { hashPassword } from '../src/modules/security/crypto'
import { randomToken } from '../src/modules/security/crypto'

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD
const firstName = process.env.ADMIN_FIRST_NAME || 'Trove'
if (!email || !password || password.length < 8) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars) are required')

async function main() {
const existing = await query<{id:string}>('SELECT id FROM users WHERE lower(email)=lower($1) LIMIT 1',[email])
const passwordHash = await hashPassword(password)
if (existing.rows[0]) {
  await query(`UPDATE users SET role='admin',status='active',password_hash=$2,updated_at=now() WHERE id=$1`,[existing.rows[0].id,passwordHash])
  console.log(`Admin updated: ${email}`)
} else {
  const id=`usr_${randomToken(12)}`
  await query(`INSERT INTO users(id,first_name,email,password_hash,status,role,marketing_email_consent,marketing_sms_consent,created_at,updated_at) VALUES($1,$2,$3,$4,'active','admin',false,false,now(),now())`,[id,firstName,email,passwordHash])
  console.log(`Admin created: ${email}`)
}
}

await main()
