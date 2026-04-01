#!/bin/bash
curl -X PATCH "https://api.supabase.com/v1/projects/iryspofjbqfzwvmkkvvd/config/auth" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyeXNwb2ZqYnFmend2bWtrdnZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg0NzI4MywiZXhwIjoyMDkwNDIzMjgzfQ.MwZzre55C4bi-U_mpkJGMgl89Q8EgcaXeDqZMHAJ-WU" \
  -H "Content-Type: application/json" \
  -d '{"mailer_autoconfirm": true}'
