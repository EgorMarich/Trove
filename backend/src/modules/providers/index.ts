import type { TravelProvider } from '../../shared/types/tour'
import { MockProviderA } from './mock-a/provider'
import { MockProviderB } from './mock-b/provider'
import { BookingComProvider } from './booking-com/provider'
import { MockBookingProvider } from './booking'
import type { BookingProvider } from '../../shared/types/tour'

export const providers: TravelProvider[] = [new MockProviderA(), new MockProviderB(), new BookingComProvider()]
const bookingProviders: BookingProvider[] = [new MockBookingProvider(), new BookingComProvider()]
export const bookingProviderById = (id: string) => bookingProviders.find((provider) => provider.id === id)
export const providerById = (id: string) => providers.find((provider) => provider.id === id)
export const providerHealthById = (id: string) => providers.find((provider) => provider.id === id)
export { BookingComOrdersClient } from './booking-com/orders'
