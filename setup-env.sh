#!/bin/bash
# Push production env vars to Vercel. Values are read from src/.env.local —
# never hardcode secrets in this file (it is committed to git).
set -euo pipefail
cd ~/flowstas/src
set -a; . ./.env.local; set +a

push() {
  local name="$1"
  if [ -z "${!name:-}" ]; then echo "!! $name missing in .env.local — skipping"; return; fi
  printf '%s' "${!name}" | vercel env add "$name" production --force
}

push NEXT_PUBLIC_SUPABASE_ANON_KEY
push NEXT_PUBLIC_SUPABASE_URL
push NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
push STRIPE_SECRET_KEY
push SUPABASE_SERVICE_ROLE_KEY
