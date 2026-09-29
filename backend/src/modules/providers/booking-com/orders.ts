import type { BookingProviderPreview, NormalizedTour } from '../../../shared/types/tour'
import { FetchBookingComTransport, type BookingComTransport } from './transport'

export interface BookingComOrderPreviewInput {
  accommodationId: number
  checkin: string
  checkout: string
  productId: string
  adults: number
  country: string
  currency: string
}

export interface BookingComOrderPreview extends BookingProviderPreview {
  orderToken: string
}

export interface BookingComOrderCreateInput {
  orderToken: string
  label?: string
  productId?: string
  guest?: { name: string; email: string; phone?: string; address?: { country: string; city: string; address: string; zip?: string }}
  paymentTiming?: string
  paymentMethod?: string
}

export interface BookingComOrderResult {
  providerOrderId: string
  status: 'created' | 'pending'
  providerRequestId?: string
  reservationId?: string
}

export interface BookingComOrderStatus {
  status: 'confirmed' | 'cancelled' | 'pending' | 'not_found'
  providerRequestId?: string
}

export interface BookingComOrderCancelInput {
  orderId?: string
  reservationId: string
  reason: string
  requestPropertyApproval?: boolean
}

export interface BookingComOrderCancelResult {
  status: 'cancelled'
  providerRequestId?: string
}

export class BookingComOrdersClient {
  private readonly baseUrl = process.env.BOOKING_API_BASE_URL || 'https://demandapi-sandbox.booking.com/3.2'
  private readonly apiKey = process.env.BOOKING_API_KEY
  private readonly affiliateId = process.env.BOOKING_AFFILIATE_ID
  private readonly transport: BookingComTransport

  constructor(transport?: BookingComTransport) {
    this.transport = transport ?? new FetchBookingComTransport(this.baseUrl)
  }

  get enabled() {
    return process.env.BOOKING_NATIVE_BOOKING_ENABLED === 'true' && Boolean(this.apiKey && this.affiliateId)
  }

  async preview(input: BookingComOrderPreviewInput): Promise<BookingComOrderPreview> {
    if (!this.enabled) throw new Error('NATIVE_BOOKING_DISABLED')
    const body = {
      currency: input.currency,
      accommodation: {
        id: input.accommodationId,
        checkin: input.checkin,
        checkout: input.checkout,
        booker: { platform: 'desktop', country: input.country },
        products: [{ id: input.productId, allocation: { number_of_adults: input.adults, children: [] } }],
      },
    }
    const response = await this.request('/orders/preview', body)
    const data = response?.data?.accommodation ?? response?.data
    const token = String(response?.data?.order_token ?? '')
    const total = Number(data?.price?.total?.display?.amount ?? data?.price?.total ?? data?.total_price ?? data?.price?.display?.amount ?? 0)
    if (!token || !Number.isFinite(total) || total <= 0) throw new Error('BOOKING_API_INVALID_PREVIEW')
    return {
      orderToken: token,
      token,
      currency: String(data?.currency?.booker ?? data?.currency ?? input.currency),
      totalPrice: Math.round(total),
      payment: data?.payment ?? data?.general_policies?.payment,
      policies: data?.products?.[0]?.policies ?? data?.policies ?? data?.general_policies,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      requestId: response?.request_id,
    }
  }

  async create(input: BookingComOrderCreateInput): Promise<BookingComOrderResult> {
    if (!this.enabled) throw new Error('NATIVE_BOOKING_DISABLED')
    const body: Record<string, unknown> = {
      order_token: input.orderToken,
      accommodation: {
        ...(input.label ? { label: input.label } : {}),
        ...(input.productId && input.guest ? { products: [{ id: input.productId, guests: [{ name: input.guest.name, email: input.guest.email }] }] } : {}),
      },
      ...(input.guest ? {
        booker: {
          name: { first_name: input.guest.name.split(' ')[0] || input.guest.name, last_name: input.guest.name.split(' ').slice(1).join(' ') || input.guest.name },
          email: input.guest.email,
          ...(input.guest.phone ? { telephone: input.guest.phone } : {}),
          ...(input.guest.address ? { address: { address_line: input.guest.address.address, city: input.guest.address.city, country: input.guest.address.country, ...(input.guest.address.zip ? { post_code: input.guest.address.zip } : {}) } } : {}),
        },
      } : {}),
      ...(input.paymentTiming && input.paymentMethod ? { payment: { timing: input.paymentTiming, method: input.paymentMethod } } : {}),
    }
    const response = await this.request('/orders/create', body)
    const data = response?.data ?? {}
    const accommodation = data?.accommodation ?? {}
    const providerOrderId = String(data?.order ?? accommodation?.order ?? accommodation?.reservation ?? '')
    if (!providerOrderId) throw new Error('BOOKING_API_INVALID_CREATE')
    return {
      providerOrderId,
      reservationId: accommodation?.reservation ? String(accommodation.reservation) : undefined,
      status: 'created',
      providerRequestId: response?.request_id,
    }
  }

  async cancel(input: BookingComOrderCancelInput): Promise<BookingComOrderCancelResult> {
    if (!this.enabled) throw new Error('NATIVE_BOOKING_DISABLED')
    const response = await this.request('/orders/cancel', {
      ...(input.orderId ? { order: input.orderId } : {}),
      accommodation: {
        reservation: input.reservationId,
        reason: input.reason,
        ...(input.requestPropertyApproval ? { request_property_approval: true } : {}),
      },
    })
    const status = String(response?.data?.status || '').toLowerCase()
    if (status !== 'successful') throw new Error('BOOKING_API_CANCEL_NOT_CONFIRMED')
    return { status: 'cancelled', providerRequestId: response?.request_id }
  }

  async details(providerOrderId: string): Promise<BookingComOrderStatus> {
    if (!this.enabled) throw new Error('NATIVE_BOOKING_DISABLED')
    const response = await this.request('/orders/details/accommodations', { orders: [providerOrderId], extras: ['payment', 'policies', 'extra_charges'] })
    const item = Array.isArray(response?.data) ? response.data[0] : undefined
    if (!item) return { status: 'not_found', providerRequestId: response?.request_id }
    const raw = String(item.status ?? '').toLowerCase()
    const status = raw.includes('cancel') ? 'cancelled' : raw.includes('book') || raw.includes('confirm') ? 'confirmed' : 'pending'
    return { status, providerRequestId: response?.request_id }
  }

  private async request(path: string, body: Record<string, unknown>) {
    const response = await this.transport.post(path, body, {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Affiliate-Id': String(this.affiliateId),
    })
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const requestId = response.requestId ? `:request_id=${response.requestId}` : ''
      throw new Error(`BOOKING_API_${response.status}${requestId}${text ? `:${text.slice(0, 180)}` : ''}`)
    }
    const payload = await response.json() as Record<string, unknown>
    if (response.requestId && !payload.request_id) payload.request_id = response.requestId
    return payload
  }
}
