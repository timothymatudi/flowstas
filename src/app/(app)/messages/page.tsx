import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listSites, listAllSites, listSubmissions } from '@/lib/site-store'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail, ownerEmailMap } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// "Capture messages" → see every contact-form enquiry your sites have received,
// newest first. Regular users see messages from their own sites; admins see
// every site's messages, labelled with the owner's email.
export default async function MessagesPage() {
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

  const withSubs = await Promise.all(
    sites.map(async (site) => ({ site, subs: await listSubmissions(site.id) }))
  )
  const sitesWithMessages = withSubs.filter((s) => s.subs.length > 0)
  const total = withSubs.reduce((n, s) => n + s.subs.length, 0)

  return (
    <main className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            Messages
            {admin && (
              <span className="ml-2 align-middle rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Admin
              </span>
            )}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {total} message{total === 1 ? '' : 's'} from your contact forms{admin ? ' across all users' : ''}.
            We email you the moment a new one arrives.
          </p>
        </div>
        <Link href="/sites" className="btn-secondary whitespace-nowrap">
          My Sites
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-10 glass-light rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">
            No messages yet. Once a visitor uses a contact form on one of your sites,
            it&apos;ll show up here.{' '}
            <Link href="/publish" className="font-medium text-primary hover:underline">
              Publish a site →
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {sitesWithMessages.map(({ site, subs }) => (
            <div key={site.id} className="glass-light rounded-2xl p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-lg text-foreground">{site.name}</h2>
                <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
                  {subs.length} message{subs.length === 1 ? '' : 's'}
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

              <div className="mt-4 divide-y divide-border border-t border-border">
                {subs.map((s) => (
                  <div key={s.id} className="py-3">
                    <p className="text-sm font-medium text-foreground">
                      {s.name || 'Someone'}{' '}
                      {s.email && (
                        <a href={`mailto:${s.email}`} className="font-normal text-primary hover:underline">
                          · {s.email}
                        </a>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
