import { databaseEnabled, query } from './client'

export async function getDatabaseHealth() {
  if (!databaseEnabled) return { configured: false, ok: false }
  try {
    await query('SELECT 1')
    return { configured: true, ok: true }
  } catch {
    return { configured: true, ok: false }
  }
}
