import 'server-only'
import { unzipSync } from 'fflate'
import type { SiteFile } from '@/lib/site-store'

// Publish a static site straight from a public GitHub repo. We download the
// repo's zip archive (no auth needed for public repos), unzip it, and hand the
// files to the normal publish path — site-store strips the "repo-branch/" top
// folder and guarantees an index.html, so the site serves from "/".
// This is for STATIC sites (the repo's files are served as-is); it does not run
// a build step.

export type GithubImportResult =
  | { ok: true; name: string; files: SiteFile[] }
  | { ok: false; status: number; error: string }

const MAX_ARCHIVE = 25 * 1024 * 1024
const FETCH_TIMEOUT_MS = 20_000

// Pull owner/repo (+ optional branch) out of the URLs people paste:
//   https://github.com/owner/repo
//   https://github.com/owner/repo/tree/some-branch
//   owner/repo
function parseRepo(input: string): { owner: string; repo: string; branch?: string } | null {
  const s = input.trim().replace(/\.git$/, '')
  const m =
    s.match(/github\.com\/([^/\s]+)\/([^/\s]+)(?:\/tree\/([^/\s]+))?/i) ||
    s.match(/^([^/\s]+)\/([^/\s]+)$/)
  if (!m) return null
  return { owner: m[1], repo: m[2], branch: m[3] }
}

async function fetchArchive(owner: string, repo: string, branch: string): Promise<Response | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(
      `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${branch}`,
      { signal: controller.signal, headers: { 'User-Agent': 'FlowstasImporter/1.0' } }
    )
    return res
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function importFromGithub(repoUrl: string): Promise<GithubImportResult> {
  const parsed = parseRepo(repoUrl)
  if (!parsed) {
    return { ok: false, status: 400, error: 'Paste a GitHub repo link, e.g. https://github.com/you/your-site.' }
  }
  const { owner, repo } = parsed

  // Try the given branch, otherwise the usual defaults.
  const branches = parsed.branch ? [parsed.branch] : ['main', 'master']
  let res: Response | null = null
  for (const branch of branches) {
    const r = await fetchArchive(owner, repo, branch)
    if (r && r.ok) { res = r; break }
    if (r && r.status !== 404) {
      return { ok: false, status: 502, error: `GitHub returned an error (${r.status}).` }
    }
  }
  if (!res) {
    return {
      ok: false,
      status: 404,
      error: 'Could not find that repo (is it public, and is the branch right?).',
    }
  }

  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_ARCHIVE) {
    return { ok: false, status: 413, error: 'That repo is too large to publish (max 25 MB).' }
  }

  let files: SiteFile[]
  try {
    const entries = unzipSync(new Uint8Array(buf))
    files = Object.entries(entries)
      .filter(([p]) => !p.endsWith('/'))
      .map(([p, bytes]) => ({ path: p, bytes }))
  } catch {
    return { ok: false, status: 422, error: 'Could not read the repo archive.' }
  }
  if (files.length === 0) {
    return { ok: false, status: 400, error: 'That repo looks empty.' }
  }

  return { ok: true, name: repo, files }
}
