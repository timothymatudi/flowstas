import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listSites, listSubmissions, getViewStats, type ViewStats } from '@/lib/site-store'
import { createClient } from '@/lib/supabase/server'
import { DeleteSiteButton } from '@/components/delete-site-button'
import { ManageSite } from '@/components/manage-site'

export const dynamic = 'force-dynamic'

function Sparkline({ stats }: { stats: ViewStats }) {
  const max = Math.max(1, ...stats.days.map((d) => d.views))
  return (
    <span className="inline-flex items-end gap-0.5 h-5" title="Views, last 7 days">
      {stats.days.map((d) => (
        <span
          key={d.day}
          className="w-1.5 rounded-sm bg-primary/70"
          style={{ height: `${Math.max(10, (d.views / max) * 100)}%` }}
        />
      ))}
    </span>
  )
}

export default async function SitesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const sites = await listSites(user.id)
  const data = await Promise.all(
    sites.map(async (site) => ({
      site,
      subs: await listSubmissions(site.id),
      stats: await getViewStats(site.id),
    }))
  )

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Sites</h1>
            <p className="mt-1 text-muted-foreground">
              {sites.length} site{sites.length === 1 ? '' : 's'} published
            </p>
          </div>
          <Link href="/publish" className="btn-primary">
            + Publish a site
          </Link>
        </div>

        {data.length === 0 ? (
          <div className="mt-10 glass-light rounded-2xl p-10 text-center">
            <p className="text-muted-foreground">
              No sites yet.{' '}
              <Link href="/publish" className="font-medium text-primary hover:underline">
                Publish your first one →
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {data.map(({ site, subs, stats }) => (
              <div key={site.id} className="glass-light rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">{site.name}</h2>
                      {site.hasPassword && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          🔒 Protected
                        </span>
                      )}
                    </div>
                    <a
                      href={`https://${site.customDomain || `${site.subdomain}.flowstas.com`}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {site.customDomain || `${site.subdomain}.flowstas.com`} ↗
                    </a>
                    {site.customDomain && (
                      <p className="text-xs text-muted-foreground">also at {site.subdomain}.flowstas.com</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkline stats={stats} />
                      <span><span className="font-semibold text-foreground">{stats.total}</span> views</span>
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
                      {subs.length} message{subs.length === 1 ? '' : 's'}
                    </span>
                    <DeleteSiteButton id={site.id} name={site.name} />
                  </div>
                </div>

                <ManageSite
                  id={site.id}
                  name={site.name}
                  subdomain={site.subdomain}
                  customDomain={site.customDomain}
                  hasPassword={site.hasPassword}
                />

                {subs.length > 0 && (
                  <div className="mt-4 divide-y divide-border border-t border-border">
                    {subs.map((s) => (
                      <div key={s.id} className="py-3">
                        <p className="text-sm font-medium text-foreground">
                          {s.name} <span className="font-normal text-muted-foreground">· {s.email}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">{s.message}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(s.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
