'use client'

import { useEffect } from 'react'

export function BookingClient() {
  useEffect(() => {
    const form = document.getElementById('booking-form') as HTMLFormElement | null
    if (!form) return

    const success = document.getElementById('booking-success')
    const formContainer = document.getElementById('booking-form-container')
    const bookingInfo = document.getElementById('booking-info')
    const availableRooms = document.getElementById('available-rooms')
    const newBookingBtn = document.getElementById('new-booking-btn') as HTMLButtonElement | null

    const setSuccess = (title: string, message: string) => {
      if (!success || !formContainer || !bookingInfo || !availableRooms) return
      formContainer.style.display = 'none'
      bookingInfo.style.display = 'none'
      availableRooms.style.display = 'none'
      success.style.display = 'block'
      const heading = success.querySelector('h2')
      const paragraph = success.querySelector('p')
      if (heading) heading.textContent = title
      if (paragraph) paragraph.textContent = message
      success.scrollIntoView({ behavior: 'smooth' })
    }

    const restoreForm = () => {
      if (success) success.style.display = 'none'
      if (formContainer) formContainer.style.display = 'block'
      if (bookingInfo) bookingInfo.style.display = 'block'
    }

    const handler = async (event: SubmitEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const guestName = (document.getElementById('guest-name') as HTMLInputElement | null)?.value.trim() ?? ''
      const guestEmail = (document.getElementById('guest-email') as HTMLInputElement | null)?.value.trim() ?? ''
      const checkIn = (document.getElementById('check-in') as HTMLInputElement | null)?.value ?? ''
      const checkOut = (document.getElementById('check-out') as HTMLInputElement | null)?.value ?? ''
      const roomType = (document.getElementById('room-type') as HTMLSelectElement | null)?.value ?? 'any'
      const adults = (document.getElementById('adults') as HTMLSelectElement | null)?.value ?? '1'
      const children = (document.getElementById('children') as HTMLSelectElement | null)?.value ?? '0'
      const specialRequests = (document.getElementById('special-requests') as HTMLTextAreaElement | null)?.value ?? ''

      if (!guestName || !guestEmail || !checkIn || !checkOut) {
        window.alert('Please complete all required booking fields.')
        return
      }

      setSuccess('Booking Processing...', 'Thank you. We are sending your booking request now.')

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guest_name: guestName,
            guest_email: guestEmail,
            check_in: checkIn,
            check_out: checkOut,
            room_type: roomType,
            adults,
            children,
            special_requests: specialRequests
          })
        })

        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || `Booking request failed with status ${response.status}`)
        }

        setSuccess('Booking Request Received!', `Your booking request has been received. Reference: ${result.booking_reference || 'Pending'}. Please check your email for confirmation.`)
      } catch (error) {
        console.error('Booking submission failed', error)
        restoreForm()
        window.alert(error instanceof Error ? error.message : 'Booking request failed. Please try again.')
      }
    }

    form.addEventListener('submit', handler)

    const newBookingHandler = () => {
      form.reset()
      if (availableRooms) availableRooms.style.display = 'none'
      restoreForm()
    }

    newBookingBtn?.addEventListener('click', newBookingHandler)

    return () => {
      form.removeEventListener('submit', handler)
      newBookingBtn?.removeEventListener('click', newBookingHandler)
    }
  }, [])

  return null
}
