import type { BookingProvider, BookingProviderPreview, BookingRequest, BookingResult, NormalizedTour, ProviderCapabilities } from '../../shared/types/tour'

const offerPrices: Record<string, { price: number; currency: string }> = {
  'mediterranean-01': { price: 87400, currency: 'RUB' },
  'red-sea-01': { price: 64900, currency: 'RUB' },
  'ae-01': { price: 119800, currency: 'RUB' },
}

/** Deterministic local provider used for the complete booking journey and integration tests. */
export class MockBookingProvider implements BookingProvider {
  readonly id = 'mock-a'
  readonly capabilities: ProviderCapabilities = { search: true, priceCheck: true, booking: true, redirect: false }

  async previewBooking(request: BookingRequest): Promise<BookingProviderPreview> {
    const offer = offerPrices[request.offerId] ?? { price: 0, currency: 'RUB' }
    if (!offer.price) throw new Error('OFFER_NOT_FOUND')
    return {
      token: `MOCK-PREVIEW-${Date.now()}`,
      totalPrice: offer.price,
      currency: offer.currency,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      requestId: `REQ-${Date.now()}`,
      payment: { timing: 'pay_at_property', methods: ['cash', 'card'] },
      policies: { cancellable: true, summary: 'Демо-поставщик: отмена доступна до начала поездки.' },
    }
  }

  async createBooking(request: BookingRequest): Promise<BookingResult> {
    if (!request.providerPreviewToken) throw new Error('PROVIDER_PREVIEW_REQUIRED')
    return { providerId: this.id, mode: 'booking', status: 'created', bookingId: `MOCK-${Date.now()}`, providerRequestId: `REQ-${Date.now()}` }
  }

  async getBookingRedirect(offer: NormalizedTour) {
    return offer.bookingUrl ?? null
  }
}
