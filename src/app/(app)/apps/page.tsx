import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listApps, listAllApps, type AppMeta } from '@/lib/app-store'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail, ownerEmailMap } from '@/lib/admin'
import { ManageApp } from '@/components/manage-app'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: AppMeta['status'] }) {
  const map: Record<AppMeta['status'], { label: string; cls: string }> = {
    building: { label: '● Building', cls: 'bg-blue-50 text-blue-700' },
    live: { label: '● Live', cls: 'bg-green-50 text-green-700' },
    error: { label: '● Build failed', cls: 'bg-red-50 text-red-700' },
    stopped: { label: '● Stopped', cls: 'bg-secondary text-muted-foreground' },
  }
  const s = map[status]
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
}

export default async function AppsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = isAdminEmail(user.email)
  const apps: Array<AppMeta & { ownerId?: string }> = admin
    ? await listAllApps()
    : await listApps(user.id)
  const emails = admin ? await ownerEmailMap() : null

  return (
    <main className="min-h-screen bg-background bg-grid p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">
              {admin ? 'All Apps' : 'My Apps'}
              {admin && (
                <span className="ml-2 align-middle rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  Admin
                </span>
              )}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {apps.length} app{apps.length === 1 ? '' : 's'} {admin ? 'across all users' : 'deployed'}
            </p>
          </div>
          <Link
            href="/deploy"
            className="btn-primary rounded-xl px-5 py-3"
          >
            + Deploy an app
          </Link>
        </div>

        {apps.length === 0 ? (
          <div className="mt-10 glass-light rounded-2xl p-10 text-center">
            <p className="text-muted-foreground">
              No apps yet.{' '}
              <Link href="/deploy" className="font-medium text-primary hover:underline">
                Deploy your first one →
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {apps.map((app) => (
              <div key={app.id} className="glass-light card-hover rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg text-foreground">{app.name}</h2>
                      <StatusBadge status={app.status} />
                    </div>
                    {app.url ? (
                      <a
                        href={app.customDomain ? `https://${app.customDomain}` : app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {app.customDomain || app.url.replace(/^https?:\/\//, '')} ↗
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not live yet</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {app.repo.replace('https://github.com/', '')}
                      {app.branch ? ` · ${app.branch}` : ''}
                    </p>
                    {admin && app.ownerId && (
                      <p className="mt-0.5 text-xs text-amber-700">
                        owner: {emails?.get(app.ownerId) || app.ownerId}
                      </p>
                    )}
                    {app.status === 'error' && app.lastError && (
                      <p className="mt-1 text-xs text-red-500">{app.lastError}</p>
                    )}
                  </div>
                </div>

                {/* Manage controls act as the owner; only show them for the
                    viewer's own apps (admins view others' apps read-only). */}
                {(!admin || app.ownerId === user.id) && <ManageApp app={app} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
