export interface BookingComTransportResponse {
  ok: boolean
  status: number
  requestId?: string
  json(): Promise<unknown>
  text(): Promise<string>
}

export interface BookingComTransport {
  post(path: string, body: Record<string, unknown>, headers: Record<string, string>): Promise<BookingComTransportResponse>
}

export class FetchBookingComTransport implements BookingComTransport {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = Number(process.env.BOOKING_API_TIMEOUT_MS || '15000'),
  ) {}

  async post(path: string, body: Record<string, unknown>, headers: Record<string, string>) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      return {
        ok: response.ok,
        status: response.status,
        requestId: response.headers.get('x-request-id') || response.headers.get('request-id') || undefined,
        json: () => response.json(),
        text: () => response.text(),
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new Error(`BOOKING_API_TIMEOUT_${this.timeoutMs}`)
      throw error
    } finally {
      clearTimeout(timer)
    }
  }
}
