import { runDueAutomations } from '../../modules/marketing/automation'
import { logger } from '../observability/logger'

export function startMarketingAutomationWorker(intervalMs = Number(process.env.MARKETING_AUTOMATION_INTERVAL_MS || 60_000)) {
  let running = false
  const tick = async () => {
    if (running) return
    running = true
    try {
      const result = await runDueAutomations()
      if (result.length) logger.info('marketing automation executions processed', { count: result.length })
    } catch (error) {
      logger.error('marketing automation worker failed', { error: error instanceof Error ? error.message : String(error) })
    } finally { running = false }
  }
  void tick()
  const timer = setInterval(() => void tick(), intervalMs)
  return () => clearInterval(timer)
}
