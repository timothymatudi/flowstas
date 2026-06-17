// How many sites each plan can publish. Free (no active subscription) gets a
// single site so the product is usable before/without billing; paid plans
// raise the ceiling. Keep these in sync with the pricing copy in products.ts.
export const FREE_SITE_LIMIT = 1

const SITE_LIMITS: Record<string, number> = {
  basic: 3, // Starter
  pro: 10, // Professional
  enterprise: Infinity,
}

export function siteLimitForPlan(plan?: string | null): number {
  if (!plan) return FREE_SITE_LIMIT
  return SITE_LIMITS[plan] ?? FREE_SITE_LIMIT
}

// How many full (running) apps each plan can deploy. Compute costs real money to
// keep running, so the free tier gets one; paid plans raise the ceiling.
export const FREE_APP_LIMIT = 1

const APP_LIMITS: Record<string, number> = {
  basic: 2,
  pro: 5,
  enterprise: Infinity,
}

export function appLimitForPlan(plan?: string | null): number {
  if (!plan) return FREE_APP_LIMIT
  return APP_LIMITS[plan] ?? FREE_APP_LIMIT
}
