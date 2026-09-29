import { serve } from '@hono/node-server'
import app from './index'
import { closeDatabase } from './infrastructure/database/client'
import { closeRedis } from './infrastructure/redis/client'
import { startReconciliationWorker } from './infrastructure/operations/reconciliation-worker'
import { logger } from './infrastructure/observability/logger'
import { startMarketingAutomationWorker } from './infrastructure/operations/marketing-automation-worker'

const port = Number(process.env.PORT || 3001)
const hostname = process.env.HOST || '0.0.0.0'

const server = serve({ fetch: app.fetch, port, hostname })
const stopReconciliationWorker = startReconciliationWorker()
const stopMarketingAutomationWorker = startMarketingAutomationWorker()

let shuttingDown = false
async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info('shutdown requested', { signal })
  stopReconciliationWorker()
  stopMarketingAutomationWorker()
  server.close(async () => {
    await Promise.allSettled([closeDatabase(), closeRedis()])
    process.exit(0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

logger.info('server listening', { hostname, port })
