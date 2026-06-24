import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  listSites,
  listAllSites,
  getViewStats,
  listVisits,
  type ViewStats,
  type Visit,
} from '@/lib/site-store'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail, ownerEmailMap } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// A 7-day bar chart of daily views.
function Trend({ stats }: { stats: ViewStats }) {
  const max = Math.max(1, ...stats.days.map((d) => d.views))
  return (
    <div className="mt-4 flex items-end gap-1.5">
      {stats.days.map((d) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-20 w-full items-end">
            <div
              className="w-full rounded-sm bg-primary/70"
              style={{ height: `${Math.max(4, (d.views / max) * 100)}%` }}
              title={`${d.views} view${d.views === 1 ? '' : 's'}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {new Date(d.day + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'short' })}
          </span>
        </div>
      ))}
    </div>
  )
}

function flag(country: string | null): string {
  if (!country || country.length !== 2) return '🌐'
  const A = 0x1f1e6
  return String.fromCodePoint(
    ...country.toUpperCase().split('').map((c) => A + c.charCodeAt(0) - 65)
  )
}

function VisitRow({ v }: { v: Visit }) {
  let from = 'Direct / unknown'
  if (v.referrer) {
    try {
      from = new URL(v.referrer).hostname
    } catch {
      from = v.referrer
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2 text-sm">
      <span title={v.country || 'Unknown'}>{flag(v.country)}</span>
      <span className="font-medium text-foreground">{v.path || '/'}</span>
      <span className="text-muted-foreground">from {from}</span>
      {v.device && <span className="text-muted-foreground">· {v.device}</span>}
      <span className="ml-auto text-xs text-muted-foreground">
        {new Date(v.createdAt).toLocaleString()}
      </span>
    </div>
  )
}

// "See your visitors" → who's been looking at your sites: total views, a 7-day
// trend, and a recent-visits log (page, source, country, device). Users see
// their own sites; admins see everyone's.
export default async function VisitorsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = isAdminEmail(user.email)
  const sites: Array<Awaited<ReturnType<typeof listSites>>[number] & { ownerId?: string }> = admin
    ? await listAllSites()
    : await listSites(user.id)
  const emails = admin ? await ownerEmailMap() : null

  const data = await Promise.all(
    sites.map(async (site) => ({
      site,
      stats: await getViewStats(site.id),
      visits: await listVisits(site.id, 25),
    }))
  )
  const totalViews = data.reduce((n, d) => n + d.stats.total, 0)

  return (
    <main className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            Visitors
            {admin && (
              <span className="ml-2 align-middle rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Admin
              </span>
            )}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {totalViews} total view{totalViews === 1 ? '' : 's'} across {sites.length} site
            {sites.length === 1 ? '' : 's'}{admin ? ' (all users)' : ''}.
          </p>
        </div>
        <Link href="/sites" className="btn-secondary whitespace-nowrap">
          My Sites
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="mt-10 glass-light rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">
            No sites yet, so no visitors to show.{' '}
            <Link href="/publish" className="font-medium text-primary hover:underline">
              Publish your first site →
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {data.map(({ site, stats, visits }) => (
            <div key={site.id} className="glass-light rounded-2xl p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg text-foreground">{site.name}</h2>
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{stats.total}</span> views
                </span>
              </div>
              <a
                href={`https://${site.customDomain || `${site.subdomain}.flowstas.com`}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                {site.customDomain || `${site.subdomain}.flowstas.com`} ↗
              </a>
              {admin && site.ownerId && (
                <p className="mt-0.5 text-xs text-amber-700">
                  owner: {emails?.get(site.ownerId) || site.ownerId}
                </p>
              )}

              <Trend stats={stats} />

              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Recent visits
                </p>
                {visits.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">
                    No individual visits logged yet — they&apos;ll appear here as people open the site.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {visits.map((v) => (
                      <VisitRow key={v.id} v={v} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
