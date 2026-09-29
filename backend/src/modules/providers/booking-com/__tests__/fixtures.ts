export const fixtures = {
  search: {
    data: [
      {
        id: 1001,
        name: 'Trove Test Hotel',
        review_score: 9.1,
        review_count: 120,
        products: [{ id: 'P-1', price: { display: 420 }, room: { name: 'Double Room' }, policies: { cancellation: { free_cancellation_until: '2026-10-01' } } }],
        url: { web: 'https://example.test/hotel/1001' },
      },
    ],
    request_id: 'search-req-1',
  },
  availability: {
    data: {
      products: [{ id: 'P-1', price: { display: 420 }, policies: { cancellation: { free_cancellation_until: '2026-10-01' } } }],
      currency: 'EUR',
    },
    request_id: 'availability-req-1',
  },
  preview: {
    data: {
      order_token: 'ORDER-TOKEN-123',
      accommodation: { currency: { booker: 'EUR' }, price: { total: { display: { amount: 420 } } }, payment: { timing: 'pay_at_property' }, policies: { cancellation: { type: 'free' } } },
    },
    request_id: 'preview-req-1',
  },
  create: {
    data: { order: 'ORDER-9001', accommodation: { reservation: 'RES-9001' } },
    request_id: 'create-req-1',
  },
  detailsConfirmed: { data: [{ status: 'booked' }], request_id: 'details-req-1' },
  detailsMissing: { data: [], request_id: 'details-req-2' },
}
