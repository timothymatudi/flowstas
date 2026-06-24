import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listSites, listAllSites } from '@/lib/site-store'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail, ownerEmailMap } from '@/lib/admin'
import { SitePasswordForm } from '@/components/site-password-form'

export const dynamic = 'force-dynamic'

// "Password-protect it" → put a password on any site for client previews,
// drafts or private pages. Users manage their own sites; admins can see every
// site's protection status but only change passwords on sites they own.
export default async function PasswordsPage() {
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
  const protectedCount = sites.filter((s) => s.hasPassword).length

  return (
    <main className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            Password protection
            {admin && (
              <span className="ml-2 align-middle rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Admin
              </span>
            )}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {protectedCount} of {sites.length} site{sites.length === 1 ? '' : 's'} protected. Put a
            password on any site for client previews, drafts or private pages.
          </p>
        </div>
        <Link href="/sites" className="btn-secondary whitespace-nowrap">
          My Sites
        </Link>
      </div>

      {sites.length === 0 ? (
        <div className="mt-10 glass-light rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">
            No sites yet.{' '}
            <Link href="/publish" className="font-medium text-primary hover:underline">
              Publish your first site →
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {sites.map((site) => {
            const canEdit = !admin || site.ownerId === user.id
            return (
              <div key={site.id} className="glass-light rounded-2xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg text-foreground">{site.name}</h2>
                      {site.hasPassword ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          🔒 Protected
                        </span>
                      ) : (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Public
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
                    {admin && site.ownerId && (
                      <p className="mt-0.5 text-xs text-amber-700">
                        owner: {emails?.get(site.ownerId) || site.ownerId}
                      </p>
                    )}
                  </div>
                </div>

                {canEdit ? (
                  <SitePasswordForm id={site.id} hasPassword={site.hasPassword} />
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {site.hasPassword ? 'Protected by the owner.' : 'Public.'} Only the owner can change this.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
