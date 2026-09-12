import { LegacyPage } from '@/components/LegacyPage'
import { BookingClient } from '@/components/BookingClient'

export default function Page() {
  return (
    <>
      <LegacyPage fileName="booking.html" />
      <BookingClient />
    </>
  )
}
