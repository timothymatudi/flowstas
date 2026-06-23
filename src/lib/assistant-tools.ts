import 'server-only'
import type Anthropic from '@anthropic-ai/sdk'
import {
  createSite,
  createSiteFromHtml,
  listSites,
  setCustomDomain,
  countSitesForOwner,
} from '@/lib/site-store'
import { listApps, createApp, updateAppDeploy, countAppsForOwner } from '@/lib/app-store'
import { TEMPLATES } from '@/lib/templates'
import { importFromUrl } from '@/lib/import-url'
import { importFromGithub } from '@/lib/import-github'
import { siteLimitForPlan, appLimitForPlan } from '@/lib/plan-limits'
import { workerConfigured, startDeploy, parseResult } from '@/lib/build-worker'

// GitHub / GitLab / Bitbucket repo URL (mirrors the deploy API's validation).
const VALID_REPO = /^https:\/\/(?:github\.com|gitlab\.com|bitbucket\.org)\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/

// Tools the in-dashboard agent can actually USE to do work for the user. Read
// tools run immediately; mutating tools (creating a site, connecting a domain)
// are gated behind a user confirmation in the route ("ask, then do"). Web
// search/fetch are Anthropic server-side tools, declared alongside.

export const MUTATING_TOOLS = new Set(['publish_site', 'connect_custom_domain', 'deploy_app'])

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
      "Host the user's EXISTING website on Flowstas, live at <slug>.flowstas.com with HTTPS. Give a display `name` and EXACTLY ONE source: `import_url` (host/snapshot an existing public web page), `import_github` (a public GitHub repo of a static site), or `template_id` (a built-in Flowstas starter). Do NOT author website content yourself — you host what the user already has. For files on their computer (a zip/folder), you can't take them in chat — point them to /publish to upload. Only call after the user confirms.",
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Display name for the site' },
        import_url: { type: 'string', description: 'A public http(s) URL to host/snapshot' },
        import_github: { type: 'string', description: 'A public GitHub repo URL (static site) to host' },
        template_id: {
          type: 'string',
          description: 'A built-in Flowstas starter template id',
          enum: TEMPLATES.map((t) => t.id),
        },
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
  {
    name: 'deploy_app',
    description:
      "Deploy a FULL APPLICATION from a Git repo — Flowstas builds it into a container and runs it live on the internet. Use this (not publish_site) when the user has a real app in a repo: Next.js, Astro, SvelteKit, Nuxt, Vite/React, plain Node, a static site, or any repo with its own Dockerfile. Works with GitHub, GitLab, or Bitbucket. The build takes a couple of minutes. Only call after the user confirms.",
    input_schema: {
      type: 'object',
      properties: {
        repo: { type: 'string', description: 'Repo URL, e.g. https://github.com/owner/name (gitlab.com / bitbucket.org also work)' },
        name: { type: 'string', description: 'Optional app name (defaults to the repo name)' },
        branch: { type: 'string', description: 'Optional branch (defaults to the repo default)' },
        github_token: {
          type: 'string',
          description: 'Optional access token for a PRIVATE repo; used once for the clone, never stored',
        },
      },
      required: ['repo'],
      additionalProperties: false,
    },
  },
]

// A plain-language summary of a pending mutating action, shown on the confirm card.
export function describeAction(name: string, input: Record<string, unknown>): string {
  if (name === 'publish_site') {
    const src = input.import_url
      ? String(input.import_url)
      : input.import_github
        ? `the GitHub repo ${String(input.import_github)}`
        : input.template_id
          ? `the "${String(input.template_id)}" starter template`
          : 'your content'
    return `Host "${String(input.name ?? 'Untitled')}" from ${src} — it’ll go live at its own flowstas.com address with HTTPS.`
  }
  if (name === 'connect_custom_domain') {
    return `Connect the domain ${String(input.domain ?? '')} to your site "${String(input.site ?? '')}".`
  }
  if (name === 'deploy_app') {
    return `Deploy the app from ${String(input.repo ?? '')}${
      input.branch ? ` (branch ${String(input.branch)})` : ''
    } — Flowstas will build it and run it live. This can take a couple of minutes.`
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
        if (typeof input.import_url === 'string' && input.import_url.trim()) {
          const r = await importFromUrl(input.import_url)
          if (!r.ok) return { ok: false, content: r.error }
          const meta = await createSite(name || r.name, r.files, ctx.userId)
          subdomain = meta.subdomain
          siteName = meta.name
        } else if (typeof input.import_github === 'string' && input.import_github.trim()) {
          const r = await importFromGithub(input.import_github)
          if (!r.ok) return { ok: false, content: r.error }
          const meta = await createSite(name || r.name, r.files, ctx.userId)
          subdomain = meta.subdomain
          siteName = meta.name
        } else if (typeof input.template_id === 'string' && input.template_id.trim()) {
          const tpl = TEMPLATES.find((t) => t.id === input.template_id)
          if (!tpl)
            return { ok: false, content: `Unknown template_id. Valid ids: ${TEMPLATES.map((t) => t.id).join(', ')}.` }
          const meta = await createSiteFromHtml(name, tpl.html, ctx.userId)
          subdomain = meta.subdomain
          siteName = meta.name
        } else {
          return {
            ok: false,
            content:
              'No source given. Use import_url, import_github, or template_id. For files on the user’s computer, point them to /publish to upload.',
          }
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
      case 'deploy_app': {
        if (!workerConfigured())
          return { ok: false, content: 'App hosting is not configured on the server right now — tell the user to try again later.' }
        const repo = String(input.repo ?? '').trim()
        if (!VALID_REPO.test(repo))
          return { ok: false, content: 'Provide a valid GitHub, GitLab, or Bitbucket repo URL, e.g. https://github.com/you/your-app.' }
        const count = await countAppsForOwner(ctx.userId)
        const limit = appLimitForPlan(ctx.plan)
        if (count >= limit)
          return {
            ok: false,
            content: `The user has reached their plan limit of ${limit} app${limit === 1 ? '' : 's'}. Tell them to upgrade at /pricing.`,
          }
        const name = String(input.name ?? '').trim() || repo.split('/').pop() || 'app'
        const branch = String(input.branch ?? '').trim() || null
        const githubToken = String(input.github_token ?? '').trim() || null

        const app = await createApp(name, repo, branch, ctx.userId)
        let res: Response
        try {
          res = await startDeploy({ repo, name: app.flyApp, branch, githubToken })
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Could not start the build.'
          await updateAppDeploy(app.id, { ok: false, error: msg }, msg)
          return { ok: false, content: `Could not start the build: ${msg}` }
        }
        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => '')
          const msg = `Build worker error (${res.status}). ${text}`.trim()
          await updateAppDeploy(app.id, { ok: false, error: msg }, msg)
          return { ok: false, content: msg }
        }
        // Consume the whole build stream (it can take a couple of minutes), then
        // record + report the outcome.
        const logs = await res.text()
        const result = parseResult(logs) ?? { ok: false as const, error: 'Build ended without a result.' }
        await updateAppDeploy(app.id, result, logs)
        if (result.ok)
          return {
            ok: true,
            content: `Deployed "${app.name}" — it's live at ${result.url}. Give the user that link; they can add env vars, a custom domain, or restart it under My Apps.`,
          }
        return {
          ok: false,
          content: `The build failed: ${result.error}\n\nRecent build log:\n${logs.slice(-1500)}\n\nExplain the likely cause and a concrete fix; the user can retry from My Apps.`,
        }
      }
      default:
        return { ok: false, content: `Unknown tool: ${name}.` }
    }
  } catch (e) {
    return { ok: false, content: `That action failed: ${e instanceof Error ? e.message : 'unknown error'}.` }
  }
}
