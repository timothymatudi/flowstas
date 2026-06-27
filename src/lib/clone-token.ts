import 'server-only'
import { getConnectionToken as githubConnectionToken } from '@/lib/github-connection'
import { getConnectionToken as gitlabConnectionToken } from '@/lib/gitlab-connection'
import { getConnectionToken as bitbucketConnectionToken } from '@/lib/bitbucket-connection'

// Unified clone-token resolver across all connected git providers. Decide which
// token to clone a repo with. Priority:
//   1. a token the caller passed explicitly (manual PAT/app password)
//   2. the user's connected account for the repo's host — github.com → GitHub,
//      gitlab.com → GitLab, bitbucket.org → Bitbucket — since each OAuth token is
//      host-specific
//   3. none (public repo, no auth needed)
// This is what makes "connect once, deploy any repo" work — on any of the three
// hosts — without pasting a token. scripts/deploy-app.mjs maps the resolved token
// to the right clone-auth user per host (github → token, gitlab → oauth2,
// bitbucket → x-token-auth).
export async function resolveCloneTokenForRepo(
  userId: string,
  repo: string,
  manualToken?: string | null
): Promise<string | null> {
  if (manualToken && manualToken.trim()) return manualToken.trim()
  if (/^https:\/\/(?:www\.)?github\.com\//i.test(repo)) {
    return await githubConnectionToken(userId)
  }
  if (/^https:\/\/(?:www\.)?gitlab\.com\//i.test(repo)) {
    return await gitlabConnectionToken(userId)
  }
  if (/^https:\/\/(?:www\.)?bitbucket\.org\//i.test(repo)) {
    return await bitbucketConnectionToken(userId)
  }
  return null
}
