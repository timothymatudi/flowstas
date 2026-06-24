'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AdminUserRow } from '@/lib/admin'
import {
  adminSetPasswordAction,
  adminSetSuspendedAction,
  adminDeleteUserAction,
} from '@/app/actions/admin'

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

type Status = 'active' | 'suspended' | 'unconfirmed'
function statusOf(u: AdminUserRow): Status {
  if (u.suspended) return 'suspended'
  return u.confirmed ? 'active' : 'unconfirmed'
}

type SortKey = 'name' | 'status' | 'sites' | 'apps' | 'joined' | 'lastSignIn'
function sortValue(u: AdminUserRow, key: SortKey): string | number {
  switch (key) {
    case 'name': return (u.fullName || u.email).toLowerCase()
    case 'status': return statusOf(u)
    case 'sites': return u.sitesCount
    case 'apps': return u.appsCount
    case 'joined': return new Date(u.createdAt).getTime()
    case 'lastSignIn': return u.lastSignInAt ? new Date(u.lastSignInAt).getTime() : 0
  }
}

const STATUS_TABS: { value: Status | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'unconfirmed', label: 'Unconfirmed' },
]

export function AdminUsersTable({
  users,
  currentAdminId,
}: {
  users: AdminUserRow[]
  currentAdminId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'joined', dir: 'desc' })

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = users.filter((u) => {
      if (q && !(u.email.toLowerCase().includes(q) || (u.fullName || '').toLowerCase().includes(q))) return false
      if (statusFilter !== 'all' && statusOf(u) !== statusFilter) return false
      return true
    })
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      const av = sortValue(a, sort.key)
      const bv = sortValue(b, sort.key)
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [users, query, statusFilter, sort])

  function run(id: string, fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    setBusyId(id)
    setNotice(null)
    startTransition(async () => {
      const res = await fn()
      setBusyId(null)
      if (res.ok) {
        setNotice({ kind: 'ok', msg: okMsg })
        router.refresh()
      } else {
        setNotice({ kind: 'err', msg: res.error || 'Something went wrong.' })
      }
    })
  }

  function onResetPassword(u: AdminUserRow) {
    const pw = window.prompt(`Set a new password for ${u.email}\n(at least 8 characters):`)
    if (pw == null) return
    if (pw.length < 8) {
      setNotice({ kind: 'err', msg: 'Password must be at least 8 characters.' })
      return
    }
    run(u.id, () => adminSetPasswordAction(u.id, pw), `Password updated for ${u.email}.`)
  }

  function onToggleSuspend(u: AdminUserRow) {
    const verb = u.suspended ? 'un-suspend' : 'suspend'
    if (!window.confirm(`Are you sure you want to ${verb} ${u.email}?`)) return
    run(u.id, () => adminSetSuspendedAction(u.id, !u.suspended),
      `${u.email} ${u.suspended ? 'un-suspended' : 'suspended'}.`)
  }

  function onDelete(u: AdminUserRow) {
    if (!window.confirm(`Permanently delete ${u.email}?\n\nThis removes their account and cannot be undone.`)) return
    if (window.prompt(`Type the email to confirm deletion:`) !== u.email) {
      setNotice({ kind: 'err', msg: 'Email did not match — deletion cancelled.' })
      return
    }
    run(u.id, () => adminDeleteUserAction(u.id), `${u.email} deleted.`)
  }

  // A clickable, sortable column header.
  function SortHeader({ label, sortKey, align = 'left' }: { label: string; sortKey: SortKey; align?: 'left' | 'right' }) {
    const active = sort.key === sortKey
    return (
      <th className={`px-4 py-3 font-medium ${align === 'right' ? 'text-right' : ''}`}>
        <button
          onClick={() => toggleSort(sortKey)}
          className={`inline-flex items-center gap-1 hover:text-foreground ${active ? 'text-foreground' : ''}`}
          aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          {label}
          <span className="text-[10px] leading-none">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
        </button>
      </th>
    )
  }

  return (
    <div>
      {notice && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            notice.kind === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notice.msg}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full max-w-xs rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="inline-flex rounded-lg border bg-background p-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === t.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {visible.length} of {users.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <SortHeader label="User" sortKey="name" />
              <SortHeader label="Status" sortKey="status" />
              <SortHeader label="Sites" sortKey="sites" />
              <SortHeader label="Apps" sortKey="apps" />
              <SortHeader label="Joined" sortKey="joined" />
              <SortHeader label="Last sign-in" sortKey="lastSignIn" />
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No users match your filters.
                </td>
              </tr>
            )}
            {visible.map((u) => {
              const isSelf = u.id === currentAdminId
              const rowBusy = busyId === u.id && isPending
              return (
                <tr key={u.id} className="border-b last:border-0 align-middle">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {u.fullName || u.email.split('@')[0]}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {u.suspended ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Suspended</span>
                    ) : u.confirmed ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Unconfirmed</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground">{u.sitesCount}</td>
                  <td className="px-4 py-3 text-foreground">{u.appsCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(u.lastSignInAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => onResetPassword(u)}
                        disabled={rowBusy}
                        className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      >
                        Reset password
                      </button>
                      <button
                        onClick={() => onToggleSuspend(u)}
                        disabled={rowBusy || isSelf}
                        title={isSelf ? "You can't suspend yourself" : ''}
                        className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {u.suspended ? 'Un-suspend' : 'Suspend'}
                      </button>
                      <button
                        onClick={() => onDelete(u)}
                        disabled={rowBusy || isSelf}
                        title={isSelf ? "You can't delete yourself" : ''}
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
