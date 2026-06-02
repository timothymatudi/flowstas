import type { MetadataRoute } from 'next'

const BASE_URL = 'https://flowstas.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/about', '/pricing', '/contact', '/privacy', '/terms', '/auth/login', '/auth/sign-up']

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))
}
