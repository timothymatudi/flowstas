'use client'

import { useState, useTransition } from 'react'
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

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sites</th>
              <th className="px-4 py-3 font-medium">Apps</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Last sign-in</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
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
