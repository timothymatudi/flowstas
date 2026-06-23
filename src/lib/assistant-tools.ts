import 'server-only'
import type Anthropic from '@anthropic-ai/sdk'
import {
  createSite,
  createSiteFromHtml,
  listSites,
  setCustomDomain,
  countSitesForOwner,
} from '@/lib/site-store'
import { listApps } from '@/lib/app-store'
import { TEMPLATES } from '@/lib/templates'
import { importFromUrl } from '@/lib/import-url'
import { importFromGithub } from '@/lib/import-github'
import { siteLimitForPlan } from '@/lib/plan-limits'

// Tools the in-dashboard agent can actually USE to do work for the user. Read
// tools run immediately; mutating tools (creating a site, connecting a domain)
// are gated behind a user confirmation in the route ("ask, then do"). Web
// search/fetch are Anthropic server-side tools, declared alongside.

export const MUTATING_TOOLS = new Set(['publish_site', 'connect_custom_domain'])

export const CUSTOM_TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_my_sites',
    description: "List the user's published sites (name + live address). Use before editing or connecting a domain, or to answer 'what sites do I have?'.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'list_my_apps',
    description: "List the user's deployed apps (name, status, URL).",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'publish_site',
    description:
      "Create and publish a real website on the user's account, live at <slug>.flowstas.com with HTTPS. Give a display `name` and EXACTLY ONE source: `html` (a complete HTML document YOU write for them — strongly preferred when the user describes the site they want), `template_id` (a built-in starter), `import_url` (snapshot an existing public web page), or `import_github` (a public GitHub repo of a static site). Include a contact form posting to {{FORM_ACTION}} when relevant. This creates a real, public site — only call it once you have the details you need; the platform will ask the user to confirm before it runs.",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Display name for the site' },
        html: {
          type: 'string',
          description:
            'A complete, self-contained HTML document (start with <!doctype html>, inline CSS). Make it attractive and specific to what the user asked for.',
        },
        template_id: {
          type: 'string',
          description: 'A built-in template id',
          enum: TEMPLATES.map((t) => t.id),
        },
        import_url: { type: 'string', description: 'A public http(s) URL to snapshot into a site' },
        import_github: { type: 'string', description: 'A public GitHub repo URL (static site) to publish' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'connect_custom_domain',
    description:
      "Connect the user's own domain (e.g. www.theirbiz.com) to one of their existing sites. Give the site's name or subdomain and the domain. Returns the DNS record to set. Only call after the user confirms.",
    input_schema: {
      type: 'object',
      properties: {
        site: { type: 'string', description: "The site's name or subdomain to attach the domain to" },
        domain: { type: 'string', description: 'The custom domain, e.g. www.example.com' },
      },
      required: ['site', 'domain'],
      additionalProperties: false,
    },
  },
]

// A plain-language summary of a pending mutating action, shown on the confirm card.
export function describeAction(name: string, input: Record<string, unknown>): string {
  if (name === 'publish_site') {
    const src = input.html
      ? 'a page I wrote for you'
      : input.template_id
        ? `the "${String(input.template_id)}" template`
        : input.import_url
          ? `a snapshot of ${String(input.import_url)}`
          : input.import_github
            ? `the GitHub repo ${String(input.import_github)}`
            : 'your content'
    return `Publish a new website "${String(input.name ?? 'Untitled')}" using ${src}. It will go live at its own flowstas.com address with HTTPS.`
  }
  if (name === 'connect_custom_domain') {
    return `Connect the domain ${String(input.domain ?? '')} to your site "${String(input.site ?? '')}".`
  }
  return `Run ${name}.`
}

export interface ToolContext {
  userId: string
  plan: string | null // effective plan for limit checks
}

export interface ToolOutcome {
  ok: boolean
  content: string
}

// Execute a tool with the user's identity. Every store function re-checks
// ownership, so this can only ever touch the calling user's own resources.
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolOutcome> {
  try {
    switch (name) {
      case 'list_my_sites': {
        const sites = await listSites(ctx.userId)
        if (!sites.length) return { ok: true, content: 'The user has no published sites yet.' }
        return {
          ok: true,
          content: sites
            .map(
              (s) =>
                `- "${s.name}" → https://${s.subdomain}.flowstas.com${s.customDomain ? ` (also ${s.customDomain})` : ''}`
            )
            .join('\n'),
        }
      }
      case 'list_my_apps': {
        const apps = await listApps(ctx.userId)
        if (!apps.length) return { ok: true, content: 'The user has no deployed apps yet.' }
        return {
          ok: true,
          content: apps.map((a) => `- "${a.name}" — ${a.status}${a.url ? ` → ${a.url}` : ''}`).join('\n'),
        }
      }
      case 'publish_site': {
        const name = String(input.name ?? '').trim() || 'My site'
        const count = await countSitesForOwner(ctx.userId)
        const limit = siteLimitForPlan(ctx.plan)
        if (count >= limit)
          return {
            ok: false,
            content: `The user has reached their plan limit of ${limit} site${limit === 1 ? '' : 's'}. Tell them to upgrade at /pricing to publish more.`,
          }

        let subdomain: string
        let siteName: string
        if (typeof input.html === 'string' && input.html.trim()) {
          const meta = await createSiteFromHtml(name, input.html, ctx.userId)
          subdomain = meta.subdomain
          siteName = meta.name
        } else if (typeof input.template_id === 'string') {
          const tpl = TEMPLATES.find((t) => t.id === input.template_id)
          if (!tpl)
            return { ok: false, content: `Unknown template_id. Valid ids: ${TEMPLATES.map((t) => t.id).join(', ')}.` }
          const meta = await createSiteFromHtml(name, tpl.html, ctx.userId)
          subdomain = meta.subdomain
          siteName = meta.name
        } else if (typeof input.import_url === 'string') {
          const r = await importFromUrl(input.import_url)
          if (!r.ok) return { ok: false, content: r.error }
          const meta = await createSite(name || r.name, r.files, ctx.userId)
          subdomain = meta.subdomain
          siteName = meta.name
        } else if (typeof input.import_github === 'string') {
          const r = await importFromGithub(input.import_github)
          if (!r.ok) return { ok: false, content: r.error }
          const meta = await createSite(name || r.name, r.files, ctx.userId)
          subdomain = meta.subdomain
          siteName = meta.name
        } else {
          return { ok: false, content: 'No source provided. Provide html, template_id, import_url, or import_github.' }
        }
        const url = `https://${subdomain}.flowstas.com`
        return {
          ok: true,
          content: `Published "${siteName}" — it's live now at ${url}. Give the user that URL as a clickable link and offer to connect their own domain or tweak the design.`,
        }
      }
      case 'connect_custom_domain': {
        const sites = await listSites(ctx.userId)
        const q = String(input.site ?? '').toLowerCase().trim()
        const site =
          sites.find((s) => s.subdomain.toLowerCase() === q || s.name.toLowerCase() === q) ||
          sites.find((s) => s.name.toLowerCase().includes(q) || s.subdomain.toLowerCase().includes(q))
        if (!site)
          return {
            ok: false,
            content: `No site matched "${String(input.site ?? '')}". The user's sites: ${
              sites.map((s) => `${s.name} (${s.subdomain})`).join('; ') || 'none'
            }.`,
          }
        const res = await setCustomDomain(site.id, ctx.userId, String(input.domain ?? ''))
        if (!res) return { ok: false, content: 'Could not connect that domain (it may be invalid or already in use).' }
        return {
          ok: true,
          content: `Connected ${String(input.domain)} to "${site.name}". Tell the user to add this DNS record at their registrar: a CNAME from ${String(
            input.domain
          )} to cname.vercel-dns.com (or, for a root domain, an A record to 76.76.21.21). HTTPS is issued automatically once DNS propagates.`,
        }
      }
      default:
        return { ok: false, content: `Unknown tool: ${name}.` }
    }
  } catch (e) {
    return { ok: false, content: `That action failed: ${e instanceof Error ? e.message : 'unknown error'}.` }
  }
}
