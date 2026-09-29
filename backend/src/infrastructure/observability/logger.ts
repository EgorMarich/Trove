type LogLevel = 'info' | 'warn' | 'error'

function write(level: LogLevel, message: string, metadata?: Record<string, unknown>) {
  const entry = { timestamp: new Date().toISOString(), level, service: 'trove-api', message, ...metadata }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (message: string, metadata?: Record<string, unknown>) => write('info', message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => write('warn', message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) => write('error', message, metadata),
}
