import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listApps, type AppMeta } from '@/lib/app-store'
import { createClient } from '@/lib/supabase/server'
import { ManageApp } from '@/components/manage-app'

export const dynamic = 'force-dynamic'

function StatusBadge({ status }: { status: AppMeta['status'] }) {
  const map: Record<AppMeta['status'], { label: string; cls: string }> = {
    building: { label: '● Building', cls: 'bg-blue-50 text-blue-700' },
    live: { label: '● Live', cls: 'bg-green-50 text-green-700' },
    error: { label: '● Build failed', cls: 'bg-red-50 text-red-700' },
    stopped: { label: '● Stopped', cls: 'bg-gray-100 text-gray-600' },
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

  const apps = await listApps(user.id)

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Apps</h1>
            <p className="mt-1 text-gray-500">
              {apps.length} app{apps.length === 1 ? '' : 's'} deployed
            </p>
          </div>
          <Link
            href="/deploy"
            className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-700"
          >
            + Deploy an app
          </Link>
        </div>

        {apps.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              No apps yet.{' '}
              <Link href="/deploy" className="font-medium text-blue-600 hover:underline">
                Deploy your first one →
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {apps.map((app) => (
              <div key={app.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">{app.name}</h2>
                      <StatusBadge status={app.status} />
                    </div>
                    {app.url ? (
                      <a
                        href={app.customDomain ? `https://${app.customDomain}` : app.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {app.customDomain || app.url.replace(/^https?:\/\//, '')} ↗
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">Not live yet</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      {app.repo.replace('https://github.com/', '')}
                      {app.branch ? ` · ${app.branch}` : ''}
                    </p>
                    {app.status === 'error' && app.lastError && (
                      <p className="mt-1 text-xs text-red-500">{app.lastError}</p>
                    )}
                  </div>
                </div>

                <ManageApp app={app} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
