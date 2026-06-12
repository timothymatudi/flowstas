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
