import { NextRequest } from 'next/server'

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

async function sendResendEmail(input: {
  from: string
  to: string[]
  subject: string
  html: string
  text: string
  replyTo?: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

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
    const message = result?.message || result?.error?.message || `Resend returned ${response.status}`
    throw new Error(message)
  }

  return result
}

export async function POST(request: NextRequest) {
  let body: BookingPayload

  try {
    body = await request.json()
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

  const detailsTable = `
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:20px 0;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:10px 14px;font-weight:700;">Reference</td><td style="padding:10px 14px;">${safeReference}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:10px 14px;font-weight:700;">Guest</td><td style="padding:10px 14px;">${safeName}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:700;">Email</td><td style="padding:10px 14px;">${safeEmail}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:10px 14px;font-weight:700;">Check-in</td><td style="padding:10px 14px;">${safeCheckIn}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:700;">Check-out</td><td style="padding:10px 14px;">${safeCheckOut}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:10px 14px;font-weight:700;">Room type</td><td style="padding:10px 14px;">${safeRoom}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:700;">Adults</td><td style="padding:10px 14px;">${safeAdults}</td></tr>
      <tr style="background:#f8fafc;"><td style="padding:10px 14px;font-weight:700;">Children</td><td style="padding:10px 14px;">${safeChildren}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:700;vertical-align:top;">Special requests</td><td style="padding:10px 14px;">${safeSpecialRequests}</td></tr>
    </table>`

  const shell = (content: string) => `
    <!doctype html>
    <html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#1e293b;">
      <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div style="background:#1d4ed8;color:#ffffff;padding:24px;text-align:center;">
            <div style="font-size:22px;font-weight:700;">Procare Suites & Resorts</div>
          </div>
          <div style="padding:28px;">${content}</div>
        </div>
      </div>
    </body></html>`

  const adminHtml = shell(`
    <h1 style="font-size:24px;margin:0 0 12px;">New booking request</h1>
    <p style="line-height:1.6;color:#475569;">A guest has submitted a booking request through the website.</p>
    ${detailsTable}
    <p style="line-height:1.6;color:#475569;">Reply directly to this email to contact the guest.</p>`)

  const guestHtml = shell(`
    <h1 style="font-size:24px;margin:0 0 12px;">Booking request received</h1>
    <p style="line-height:1.6;color:#475569;">Dear ${safeName},</p>
    <p style="line-height:1.6;color:#475569;">Thank you for choosing Procare Suites & Resorts. We have received your booking request and our team will confirm availability with you shortly.</p>
    ${detailsTable}
    <p style="line-height:1.6;color:#475569;">This email confirms receipt of your request; it is not a final room-availability confirmation.</p>
    <p style="line-height:1.6;color:#475569;">Warm regards,<br><strong>Procare Suites & Resorts</strong></p>`)

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
      html: adminHtml,
      text: `A new booking request was received.\n\n${textDetails}`
    })

    const guestResult = await sendResendEmail({
      from: fromEmail,
      to: [guestEmail],
      replyTo: adminEmail,
      subject: `We received your booking request — ${bookingReference}`,
      html: guestHtml,
      text: `Dear ${guestName},\n\nThank you for choosing Procare Suites & Resorts. We received your booking request and will confirm availability shortly.\n\n${textDetails}\n\nThis is not a final room-availability confirmation.`
    })

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
    return Response.json(
      { success: false, message: 'We could not send your booking request right now. Please try again or contact the hotel directly.' },
      { status: 502 }
    )
  }
}
