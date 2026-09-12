import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/*': [
      './*.html',
      './styles.css',
      './js/**/*',
      './img/**/*'
    ]
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/rooms.html', destination: '/rooms', permanent: true },
      { source: '/dining.html', destination: '/dining', permanent: true },
      { source: '/facilities.html', destination: '/facilities', permanent: true },
      { source: '/contact.html', destination: '/contact', permanent: true },
      { source: '/booking.html', destination: '/booking', permanent: true }
    ]
  }
}

export default nextConfig
