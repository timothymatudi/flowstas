import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listSites, listSubmissions } from '@/lib/site-store'
import { createClient } from '@/lib/supabase/server'
import { DeleteSiteButton } from '@/components/delete-site-button'
import { ManageSite } from '@/components/manage-site'

export const dynamic = 'force-dynamic'

export default async function SitesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const sites = await listSites(user.id)
  const data = await Promise.all(
    sites.map(async (site) => ({ site, subs: await listSubmissions(site.id) }))
  )

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Sites</h1>
            <p className="mt-1 text-gray-500">
              {sites.length} site{sites.length === 1 ? '' : 's'} published
            </p>
          </div>
          <Link
            href="/publish"
            className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-700"
          >
            + Publish a site
          </Link>
        </div>

        {data.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              No sites yet.{' '}
              <Link href="/publish" className="font-medium text-blue-600 hover:underline">
                Publish your first one →
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {data.map(({ site, subs }) => (
              <div key={site.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{site.name}</h2>
                    <a
                      href={`https://${site.subdomain}.flowstas.com`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      {site.subdomain}.flowstas.com ↗
                    </a>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                      {subs.length} message{subs.length === 1 ? '' : 's'}
                    </span>
                    <ManageSite id={site.id} name={site.name} subdomain={site.subdomain} />
                    <DeleteSiteButton id={site.id} name={site.name} />
                  </div>
                </div>
                {subs.length > 0 && (
                  <div className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
                    {subs.map((s) => (
                      <div key={s.id} className="py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {s.name} <span className="font-normal text-gray-400">· {s.email}</span>
                        </p>
                        <p className="text-sm text-gray-600">{s.message}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
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
