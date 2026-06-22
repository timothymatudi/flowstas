import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

export default nextConfig
