import Link from 'next/link'
import type { PlatformStats } from '@/lib/admin'

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export function AdminOverview({ stats, adminName }: { stats: PlatformStats; adminName: string }) {
  return (
    <main>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl text-foreground">Admin Overview</h1>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Admin</span>
        <span className="text-muted-foreground">· {adminName}</span>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Users"
          value={stats.users.total}
          sub={`${stats.users.active} active · ${stats.users.suspended} suspended · ${stats.users.unconfirmed} unconfirmed`}
        />
        <StatCard label="Sites" value={stats.sites} sub="published across all users" />
        <StatCard label="Apps" value={stats.apps} sub="deployed across all users" />
        <StatCard
          label="Paying customers"
          value={stats.subscriptions.paying}
          sub={`${stats.subscriptions.trialing} on trial`}
        />
      </div>

      {/* Quick controls */}
      <div className="mt-8">
        <h2 className="mb-3 font-display text-xl text-foreground">Manage</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/admin/users" className="rounded-xl border bg-card p-4 hover:bg-muted">
            <p className="font-medium text-foreground">Users →</p>
            <p className="text-sm text-muted-foreground">Search, reset passwords, suspend, delete</p>
          </Link>
          <Link href="/sites" className="rounded-xl border bg-card p-4 hover:bg-muted">
            <p className="font-medium text-foreground">All Sites →</p>
            <p className="text-sm text-muted-foreground">Every published site</p>
          </Link>
          <Link href="/apps" className="rounded-xl border bg-card p-4 hover:bg-muted">
            <p className="font-medium text-foreground">All Apps →</p>
            <p className="text-sm text-muted-foreground">Every deployed app</p>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Plans / subscriptions report */}
        <section>
          <h2 className="mb-3 font-display text-xl text-foreground">Plans</h2>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Plan · status</th>
                  <th className="px-4 py-2.5 font-medium text-right">Users</th>
                </tr>
              </thead>
              <tbody>
                {stats.subscriptions.byPlan.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No subscriptions yet.</td>
                  </tr>
                ) : (
                  stats.subscriptions.byPlan.map((p) => (
                    <tr key={p.label} className="border-b last:border-0">
                      <td className="px-4 py-2.5 capitalize text-foreground">{p.label}</td>
                      <td className="px-4 py-2.5 text-right text-foreground">{p.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent signups */}
        <section>
          <h2 className="mb-3 font-display text-xl text-foreground">Recent signups</h2>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <tbody>
                {stats.recentSignups.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/users/${u.id}`} className="font-medium text-primary hover:underline">
                        {u.email}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
