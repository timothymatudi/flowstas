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

// --- Trial handling ---
// New users get a 1-day trial (the `handle_new_user` Postgres trigger inserts a
// {plan:'trial', status:'trialing', trial_ends_at: now()+1d} subscription row).
// While the trial is live we grant Pro-level limits so they can genuinely try
// the product; once it expires they fall back to the free tier until they pay.
export const TRIAL_PLAN = 'pro'

export interface SubscriptionRow {
  plan?: string | null
  status?: string | null
  trial_ends_at?: string | null
}

// Is this subscription a currently-running (not-yet-expired) trial?
export function isTrialActive(sub?: SubscriptionRow | null): boolean {
  return (
    !!sub &&
    sub.status === 'trialing' &&
    !!sub.trial_ends_at &&
    new Date(sub.trial_ends_at).getTime() > Date.now()
  )
}

// The plan whose limits actually apply to a user right now. Resolves trials and
// expiry so callers never have to special-case them:
//   - paid & active           -> the paid plan
//   - trialing & not expired   -> Pro-level (TRIAL_PLAN)
//   - no sub / expired trial / canceled -> null (free tier)
export function effectivePlan(sub?: SubscriptionRow | null): string | null {
  if (!sub) return null
  if (sub.status === 'active') return sub.plan ?? null
  if (isTrialActive(sub)) return TRIAL_PLAN
  return null
}
