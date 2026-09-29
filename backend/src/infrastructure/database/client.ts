import { Pool, type PoolClient, type QueryResultRow } from 'pg'

const connectionString = process.env.DATABASE_URL

export const databaseEnabled = Boolean(connectionString)

export const db = connectionString
  ? new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
    })
  : null

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED')
  return db.query<T>(text, values)
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>) {
  if (!db) throw new Error('DATABASE_NOT_CONFIGURED')
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function closeDatabase() {
  if (db) await db.end()
}
