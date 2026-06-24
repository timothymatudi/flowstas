import { redirect } from 'next/navigation'
import { getAdminUser, listAllUsers } from '@/lib/admin'
import { AdminUsersTable } from '@/components/admin-users-table'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  // Server-side gate: only allowlisted admins. Everyone else is bounced.
  const admin = await getAdminUser()
  if (!admin) redirect('/dashboard')

  const users = await listAllUsers()
  const suspended = users.filter((u) => u.suspended).length

  return (
    <main>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl text-foreground">Users</h1>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Admin
          </span>
        </div>
        <p className="mt-1 text-muted-foreground">
          {users.length} account{users.length === 1 ? '' : 's'}
          {suspended > 0 ? ` · ${suspended} suspended` : ''}
        </p>
      </div>

      <AdminUsersTable users={users} currentAdminId={admin.id} />

      <p className="mt-4 text-xs text-muted-foreground">
        Resetting a password takes effect immediately. Suspending blocks sign-in until you un-suspend.
        Deleting removes the auth account permanently.
      </p>
    </main>
  )
}
