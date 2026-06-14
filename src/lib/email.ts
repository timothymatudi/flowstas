import 'server-only'

// Send a plain-text email via Resend's REST API.
//
// This is a no-op (returns false) when RESEND_API_KEY is unset, so the app runs
// fine without email configured — set RESEND_API_KEY (and optionally
// ALERT_FROM_EMAIL, a from-address on a domain you've verified in Resend) to
// turn real sending on. No SDK needed; we call the HTTP API directly.
export async function sendEmail(opts: {
  to: string
  subject: string
  text: string
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) return false

  const from = process.env.ALERT_FROM_EMAIL || 'Flowstas <onboarding@resend.dev>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, text: opts.text }),
    })
    return res.ok
  } catch {
    return false
  }
}
