import 'server-only'

// Lightweight in-memory rate limiter for unauthenticated public endpoints
// (contact-form submit, password unlock). It guards against rapid-fire abuse
// from a single source — brute-forcing a site password, or flooding an owner's
// inbox with form spam.
//
// Scope/limits: the counter lives in the function instance's memory. On Vercel
// Fluid Compute instances are reused across requests, so a burst from one IP
// hits the same counter and gets throttled. It is deliberately not a
// distributed limiter (no Redis/DB round-trip on every request); it raises the
// cost of abuse without adding infrastructure. Tighten to a shared store later
// if a determined, distributed attacker becomes a real problem.

interface Bucket {
  // timestamps (ms) of hits still inside the current window
  hits: number[]
}

const buckets = new Map<string, Bucket>()

// Evict idle buckets occasionally so the Map can't grow unbounded.
let lastSweep = 0
function sweep(now: number, windowMs: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.hits.length === 0 || now - bucket.hits[bucket.hits.length - 1] > windowMs) {
      buckets.delete(key)
    }
  }
}

export interface RateLimitResult {
  ok: boolean
  // seconds the caller should wait before retrying (only meaningful when !ok)
  retryAfter: number
}

// Sliding-window check: allow at most `limit` hits per `windowMs` for `key`.
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now, windowMs)

  const bucket = buckets.get(key) ?? { hits: [] }
  // drop hits that have aged out of the window
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]
    const retryAfter = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
    buckets.set(key, bucket)
    return { ok: false, retryAfter }
  }

  bucket.hits.push(now)
  buckets.set(key, bucket)
  return { ok: true, retryAfter: 0 }
}

// Best-effort client IP from the proxy headers Vercel sets. Falls back to a
// constant so a missing header degrades to a shared (still limited) bucket
// rather than bypassing the limiter entirely.
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

// 429 response with a Retry-After header, for callers that hit the limit.
export function tooManyRequests(retryAfter: number): Response {
  return new Response('Too many requests. Please slow down and try again shortly.', {
    status: 429,
    headers: { 'Retry-After': String(retryAfter) },
  })
}
