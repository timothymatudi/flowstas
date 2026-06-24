#!/bin/bash
# Deploy Flowstas to production (flowstas.com).
#
# Usage:
#   ./deploy.sh "your commit message"
#
# Why this looks the way it does — three things the old script got wrong and
# this one fixes (all learned the hard way):
#   1. Run `vercel --prod` from the repo ROOT (~/flowstas), never from src/.
#      The Vercel project's Root Directory is already "src", so deploying from
#      src/ makes it look for src/src and fails.
#   2. The production domain (www.flowstas.com) is PINNED — a plain
#      `vercel --prod` makes a new deployment but does NOT point the live domain
#      at it. You must `vercel promote` the new deployment to go live.
#   3. Env vars are NOT set here. Piping a value into `vercel env add` silently
#      stored it EMPTY on our CLI version. Manage env vars in the Vercel
#      dashboard (Project → Settings → Environment Variables) or via the REST
#      API — they persist across deploys, so a deploy script shouldn't touch them.

set -euo pipefail

MSG="$*"
if [ -z "$MSG" ]; then
  echo "✗ Commit message required."
  echo "  Usage: ./deploy.sh \"your commit message\""
  exit 1
fi

REPO=~/flowstas
cd "$REPO"

# 1. Commit any changes (skip cleanly if there's nothing to commit).
if [ -n "$(git status --porcelain)" ]; then
  echo "▶ Committing changes: $MSG"
  git add -A
  git commit -m "$MSG"
else
  echo "▶ No local changes to commit — deploying current HEAD."
fi

# 2. Push to GitHub (keeps the repo and any git integration in sync).
echo "▶ Pushing to origin/main"
git push origin main

# 3. Build + deploy to production from the repo root.
echo "▶ Deploying to Vercel (production build)"
DEPLOY_OUT="$(vercel --prod --force --yes 2>&1)"
echo "$DEPLOY_OUT"
DEPLOY_URL="$(printf '%s\n' "$DEPLOY_OUT" | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | tail -n1)"
if [ -z "$DEPLOY_URL" ]; then
  echo "✗ Could not determine the new deployment URL from Vercel output." >&2
  exit 1
fi
echo "▶ New deployment: $DEPLOY_URL"

# 4. Promote it so the live domain (flowstas.com) actually serves this build.
#    `vercel --prod` sometimes already aliases the domain to the new build; in
#    that case promote returns "already the current production deployment",
#    which is success, not an error — so we tolerate it.
echo "▶ Promoting to the live domain"
if PROMOTE_OUT="$(vercel promote "$DEPLOY_URL" --yes 2>&1)"; then
  echo "$PROMOTE_OUT"
else
  echo "$PROMOTE_OUT"
  if printf '%s' "$PROMOTE_OUT" | grep -qi "already the current production deployment"; then
    echo "  (already live — nothing to promote)"
  else
    echo "✗ Promote failed." >&2
    exit 1
  fi
fi

# 5. Smoke-check the live site.
echo "▶ Verifying https://www.flowstas.com"
CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 https://www.flowstas.com/)"
if [ "$CODE" = "200" ]; then
  echo "✅ Live: https://www.flowstas.com (HTTP $CODE)"
else
  echo "⚠ Live site returned HTTP $CODE — check the Vercel dashboard." >&2
  exit 1
fi
