export default async function BookingSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f8fafc' }}>
      <section style={{ width: '100%', maxWidth: 640, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <h1 style={{ marginTop: 0 }}>Booking Request Received</h1>
        <p>Thank you for choosing Procare Suites & Resorts. Your booking request has been received and a confirmation email has been sent.</p>
        {ref ? <p><strong>Reference:</strong> {ref}</p> : null}
        <p>Our team will confirm room availability with you shortly.</p>
        <p style={{ marginTop: 24 }}><a href="/booking">Make another booking</a> &nbsp;|&nbsp; <a href="/">Return home</a></p>
      </section>
    </main>
  )
}
