#!/bin/bash
cd ~/flowstas/src
# Read the service-role key from .env.local — never hardcode it (this file is committed).
set -a; . ./.env.local; set +a
printf '%s' "${SUPABASE_SERVICE_ROLE_KEY:-}" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force 2>/dev/null
cd ~/flowstas
git add src/app/actions/auth.ts src/app/auth/login/page.tsx src/app/auth/sign-up/page.tsx
git commit -m "Professional login and sign-up pages with auto-confirm"
git push origin main
cd src
vercel --prod --force
