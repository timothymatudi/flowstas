import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getAdminUser, getUserBasic } from '@/lib/admin'
import { listSites } from '@/lib/site-store'
import { listApps } from '@/lib/app-store'

export const dynamic = 'force-dynamic'

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await getAdminUser()
  if (!admin) redirect('/dashboard')

  const { id } = await params
  const [target, sites, apps] = await Promise.all([
    getUserBasic(id),
    listSites(id),
    listApps(id),
  ])
  if (!target) notFound()

  const statusBadge = target.suspended
    ? { label: 'Suspended', cls: 'bg-red-50 text-red-700' }
    : target.confirmed
      ? { label: 'Active', cls: 'bg-green-50 text-green-700' }
      : { label: 'Unconfirmed', cls: 'bg-amber-50 text-amber-700' }

  return (
    <main>
      <Link href="/admin/users" className="text-sm text-primary hover:underline">
        ← Back to Users
      </Link>

      <div className="mt-3 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl text-foreground">
            {target.fullName || target.email.split('@')[0]}
          </h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>
        <p className="mt-1 text-muted-foreground">{target.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Joined {fmtDate(target.createdAt)} · Last sign-in {fmtDate(target.lastSignInAt)}
        </p>
      </div>

      {/* Their sites */}
      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl text-foreground">
          Sites <span className="text-muted-foreground">({sites.length})</span>
        </h2>
        {sites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sites.</p>
        ) : (
          <div className="space-y-3">
            {sites.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{s.name}</span>
                  {s.hasPassword && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      🔒 Protected
                    </span>
                  )}
                </div>
                <a
                  href={`https://${s.customDomain || `${s.subdomain}.flowstas.com`}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {s.customDomain || `${s.subdomain}.flowstas.com`} ↗
                </a>
                <p className="mt-0.5 text-xs text-muted-foreground">Created {fmtDate(s.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Their apps */}
      <section>
        <h2 className="mb-3 font-display text-xl text-foreground">
          Apps <span className="text-muted-foreground">({apps.length})</span>
        </h2>
        {apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No apps.</p>
        ) : (
          <div className="space-y-3">
            {apps.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{a.name}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {a.status}
                  </span>
                </div>
                {a.url ? (
                  <a
                    href={a.customDomain ? `https://${a.customDomain}` : a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {a.customDomain || a.url.replace(/^https?:\/\//, '')} ↗
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">Not live yet</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.repo.replace('https://github.com/', '')}
                  {a.branch ? ` · ${a.branch}` : ''} · created {fmtDate(a.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-8 text-xs text-muted-foreground">
        Read-only view of this user&apos;s content.
      </p>
    </main>
  )
}
