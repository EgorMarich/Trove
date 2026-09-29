const counters = new Map<string, number>()
const startedAt = Date.now()

export function incrementMetric(name: string, value = 1) {
  counters.set(name, (counters.get(name) ?? 0) + value)
}

export function metricsSnapshot() {
  return {
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    counters: Object.fromEntries(counters.entries()),
  }
}
