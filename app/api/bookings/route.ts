import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type BookingPayload = {
  guest_name?: string
  guest_email?: string
  check_in?: string
  check_out?: string
  room_type?: string
  adults?: string | number
  children?: string | number
  guests?: string | number
  special_requests?: string
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

function roomLabel(value: string): string {
  const labels: Record<string, string> = {
    any: 'Any room type',
    standard: 'Standard Room',
    deluxe: 'Deluxe Suite',
    executive: 'Executive Suite',
    family: 'Family Room',
    presidential: 'Presidential Suite'
  }
  return labels[value] ?? value
}

async function parseBookingPayload(request: NextRequest): Promise<{ body: BookingPayload; nativeForm: boolean }> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return { body: await request.json(), nativeForm: false }
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData()
    const body: BookingPayload = {
      guest_name: String(form.get('guest_name') ?? ''),
      guest_email: String(form.get('guest_email') ?? ''),
      check_in: String(form.get('check_in') ?? ''),
      check_out: String(form.get('check_out') ?? ''),
      room_type: String(form.get('room_type') ?? 'any'),
      adults: String(form.get('adults') ?? '1'),
      children: String(form.get('children') ?? '0'),
      special_requests: String(form.get('special_requests') ?? '')
    }
    return { body, nativeForm: true }
  }

  throw new Error('Unsupported booking request format')
}

async function sendResendEmail(input: {
  from: string
  to: string[]
  subject: string
  html: string
  text: string
  replyTo?: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(input.replyTo ? { reply_to: input.replyTo } : {})
    })
  })

  const result = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(result?.message || result?.error?.message || `Resend returned ${response.status}`)
  }

  return result
}

export async function POST(request: NextRequest) {
  let body: BookingPayload
  let nativeForm = false

  try {
    const parsed = await parseBookingPayload(request)
    body = parsed.body
    nativeForm = parsed.nativeForm
  } catch {
    return Response.json({ success: false, message: 'Invalid booking request.' }, { status: 400 })
  }

  const guestName = String(body.guest_name ?? '').trim()
  const guestEmail = String(body.guest_email ?? '').trim().toLowerCase()
  const checkIn = String(body.check_in ?? '').trim()
  const checkOut = String(body.check_out ?? '').trim()
  const roomType = String(body.room_type ?? 'any').trim() || 'any'
  const adults = Math.max(1, Number(body.adults ?? body.guests ?? 1) || 1)
  const children = Math.max(0, Number(body.children ?? 0) || 0)
  const specialRequests = String(body.special_requests ?? '').trim().slice(0, 2000)

  if (!guestName || !guestEmail || !checkIn || !checkOut) {
    return Response.json({ success: false, message: 'Please complete all required booking fields.' }, { status: 400 })
  }

  if (!isValidEmail(guestEmail)) {
    return Response.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 })
  }

  if (!isValidDate(checkIn) || !isValidDate(checkOut) || checkOut <= checkIn) {
    return Response.json({ success: false, message: 'Check-out must be after check-in.' }, { status: 400 })
  }

  const fromEmail = process.env.BOOKING_FROM_EMAIL || 'Procare Suites & Resorts <bookings@procaresuites.com.ng>'
  const adminEmail = process.env.BOOKING_ADMIN_EMAIL || 'info@procaresuites.com.ng'
  const bookingReference = `PCR-${Date.now().toString(36).toUpperCase()}`

  const safeName = escapeHtml(guestName)
  const safeEmail = escapeHtml(guestEmail)
  const safeCheckIn = escapeHtml(checkIn)
  const safeCheckOut = escapeHtml(checkOut)
  const safeRoom = escapeHtml(roomLabel(roomType))
  const safeAdults = escapeHtml(adults)
  const safeChildren = escapeHtml(children)
  const safeSpecialRequests = escapeHtml(specialRequests || 'None')
  const safeReference = escapeHtml(bookingReference)

  const details = `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0;background:#fff;border:1px solid #e5e7eb;">
      <tr><td style="padding:10px;font-weight:700">Reference</td><td style="padding:10px">${safeReference}</td></tr>
      <tr><td style="padding:10px;font-weight:700">Guest</td><td style="padding:10px">${safeName}</td></tr>
      <tr><td style="padding:10px;font-weight:700">Email</td><td style="padding:10px">${safeEmail}</td></tr>
      <tr><td style="padding:10px;font-weight:700">Check-in</td><td style="padding:10px">${safeCheckIn}</td></tr>
      <tr><td style="padding:10px;font-weight:700">Check-out</td><td style="padding:10px">${safeCheckOut}</td></tr>
      <tr><td style="padding:10px;font-weight:700">Room</td><td style="padding:10px">${safeRoom}</td></tr>
      <tr><td style="padding:10px;font-weight:700">Adults</td><td style="padding:10px">${safeAdults}</td></tr>
      <tr><td style="padding:10px;font-weight:700">Children</td><td style="padding:10px">${safeChildren}</td></tr>
      <tr><td style="padding:10px;font-weight:700">Special requests</td><td style="padding:10px">${safeSpecialRequests}</td></tr>
    </table>`

  const shell = (content: string) => `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b"><div style="max-width:640px;margin:0 auto;padding:28px 16px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><div style="background:#1d4ed8;color:#fff;padding:24px;text-align:center;font-size:22px;font-weight:700">Procare Suites & Resorts</div><div style="padding:28px">${content}</div></div></div></body></html>`

  const textDetails = [
    `Reference: ${bookingReference}`,
    `Guest: ${guestName}`,
    `Email: ${guestEmail}`,
    `Check-in: ${checkIn}`,
    `Check-out: ${checkOut}`,
    `Room type: ${roomLabel(roomType)}`,
    `Adults: ${adults}`,
    `Children: ${children}`,
    `Special requests: ${specialRequests || 'None'}`
  ].join('\n')

  try {
    const adminResult = await sendResendEmail({
      from: fromEmail,
      to: [adminEmail],
      replyTo: guestEmail,
      subject: `New booking request — ${guestName} (${bookingReference})`,
      html: shell(`<h1>New booking request</h1><p>A guest submitted a booking request through the website.</p>${details}<p>Reply directly to this email to contact the guest.</p>`),
      text: `A new booking request was received.\n\n${textDetails}`
    })

    const guestResult = await sendResendEmail({
      from: fromEmail,
      to: [guestEmail],
      replyTo: adminEmail,
      subject: `We received your booking request — ${bookingReference}`,
      html: shell(`<h1>Booking request received</h1><p>Dear ${safeName},</p><p>Thank you for choosing Procare Suites & Resorts. We received your booking request and will confirm availability shortly.</p>${details}<p>This confirms receipt of your request; it is not a final room-availability confirmation.</p>`),
      text: `Dear ${guestName},\n\nThank you for choosing Procare Suites & Resorts. We received your booking request and will confirm availability shortly.\n\n${textDetails}`
    })

    if (nativeForm) {
      const successUrl = new URL('/booking/success', request.url)
      successUrl.searchParams.set('ref', bookingReference)
      return NextResponse.redirect(successUrl, 303)
    }

    return Response.json({
      success: true,
      message: 'Booking request received. Confirmation email sent.',
      booking_reference: bookingReference,
      email_ids: {
        admin: adminResult?.id ?? null,
        guest: guestResult?.id ?? null
      }
    })
  } catch (error) {
    console.error('Booking email failed', error)

    if (nativeForm) {
      const errorUrl = new URL('/booking', request.url)
      errorUrl.searchParams.set('error', 'email')
      return NextResponse.redirect(errorUrl, 303)
    }

    return Response.json(
      { success: false, message: 'We could not send your booking request right now. Please try again or contact the hotel directly.' },
      { status: 502 }
    )
  }
}
