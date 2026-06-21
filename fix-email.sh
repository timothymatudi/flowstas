#!/bin/bash
# Enable auto-confirm on the Supabase project's auth config.
# Token is read from the environment — never hardcode it (this file is committed).
# Set SUPABASE_ACCESS_TOKEN (a Supabase personal access token, sbp_...) first.
set -euo pipefail
: "${SUPABASE_ACCESS_TOKEN:?set SUPABASE_ACCESS_TOKEN (Supabase personal access token) first}"
curl -X PATCH "https://api.supabase.com/v1/projects/iryspofjbqfzwvmkkvvd/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"mailer_autoconfirm": true}'
