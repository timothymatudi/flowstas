import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import createNextIntlPlugin from 'next-intl/plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // Billing lives under the dashboard; keep a bare /billing working.
      { source: '/billing', destination: '/dashboard/billing', permanent: false },
    ]
  },
}

export default withNextIntl(nextConfig)
