import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Procare Suites & Resorts',
  icons: {
    icon: '/img/logo-removebg-preview.png'
  }
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
