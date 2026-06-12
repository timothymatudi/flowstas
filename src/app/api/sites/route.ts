import { NextResponse } from 'next/server'
import { unzipSync } from 'fflate'
import {
  createSite,
  createSiteFromHtml,
  countSitesForOwner,
  type SiteFile,
} from '@/lib/site-store'
import { createClient } from '@/lib/supabase/server'
import { siteLimitForPlan } from '@/lib/plan-limits'

export const dynamic = 'force-dynamic'

// Max accepted upload size (bytes) — keeps a single publish reasonable.
const MAX_TOTAL = 25 * 1024 * 1024

// Publish a new site. Accepts either:
//  - JSON  { name, html }                       → single pasted HTML page
//  - multipart form-data with a `zip` file       → unzipped into a site
//  - multipart form-data with one+ `files`       → a folder upload (webkitRelativePath in filename)
export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') ?? ''

  // Publishing requires an account, and each plan caps how many sites you can
  // have. Published sites stay public to view — this only gates creating them.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Please log in to publish your site.', needsAuth: true },
      { status: 401 }
    )
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()
  const limit = siteLimitForPlan(sub?.plan)
  if ((await countSitesForOwner(user.id)) >= limit) {
    return NextResponse.json(
      {
        error: `You've reached your plan's limit of ${limit} site${limit === 1 ? '' : 's'}. Upgrade your plan to publish more.`,
        needsUpgrade: true,
      },
      { status: 403 }
    )
  }

  try {
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null)
      if (!body || typeof body.html !== 'string' || !body.html.trim()) {
        return NextResponse.json({ error: 'Add some HTML for your site first.' }, { status: 400 })
      }
      const meta = await createSiteFromHtml(String(body.name ?? ''), body.html, user.id)
      return NextResponse.json({ id: meta.id, url: `/s/${meta.id}` })
    }

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const name = String(form.get('name') ?? '')
      const files: SiteFile[] = []
      let total = 0

      const zip = form.get('zip')
      if (zip instanceof File && zip.size > 0) {
        total = zip.size
        if (total > MAX_TOTAL) {
          return NextResponse.json({ error: 'That zip is too large (max 25 MB).' }, { status: 413 })
        }
        const entries = unzipSync(new Uint8Array(await zip.arrayBuffer()))
        for (const [p, bytes] of Object.entries(entries)) {
          if (p.endsWith('/')) continue
          files.push({ path: p, bytes })
        }
      } else {
        for (const value of form.getAll('files')) {
          if (!(value instanceof File) || value.size === 0) continue
          total += value.size
          if (total > MAX_TOTAL) {
            return NextResponse.json({ error: 'Those files are too large (max 25 MB).' }, { status: 413 })
          }
          // Browsers send the folder-relative path as the file name when using
          // <input webkitdirectory>; fall back to the bare name.
          const rel = (value as File & { webkitRelativePath?: string }).webkitRelativePath || value.name
          files.push({ path: rel, bytes: new Uint8Array(await value.arrayBuffer()) })
        }
      }

      if (files.length === 0) {
        return NextResponse.json({ error: 'No files received. Pick a folder or a .zip of your site.' }, { status: 400 })
      }

      const meta = await createSite(name, files, user.id)
      return NextResponse.json({ id: meta.id, url: `/s/${meta.id}` })
    }

    return NextResponse.json({ error: 'Unsupported upload type.' }, { status: 415 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not publish your site.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
