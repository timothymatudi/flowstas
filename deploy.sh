#!/bin/bash
cd ~/flowstas/src
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyeXNwb2ZqYnFmend2bWtrdnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg0NzI4MywiZXhwIjoyMDkwNDIzMjgzfQ.MwZzre55C4bi-U_mpkJGMgl89Q8EgcaXeDqZMHAJ-WU" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force 2>/dev/null
cd ~/flowstas
git add src/app/actions/auth.ts src/app/auth/login/page.tsx src/app/auth/sign-up/page.tsx
git commit -m "Professional login and sign-up pages with auto-confirm"
git push origin main
cd src
vercel --prod --force
