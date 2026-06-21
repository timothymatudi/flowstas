import { addSubmission, getSiteOwnerEmail } from '@/lib/site-store'
import { sendEmail } from '@/lib/email'
import { rateLimit, clientIp, tooManyRequests } from '@/lib/rate-limit'

// Capture a contact-form submission from a published site, then notify the owner.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Throttle submissions per IP+site so a site's contact form can't be used to
  // flood the owner's inbox: 5 messages per minute.
  const rl = rateLimit(`submit:${id}:${clientIp(req)}`, 5, 60_000)
  if (!rl.ok) return tooManyRequests(rl.retryAfter)

  const form = await req.formData()
  const submission = await addSubmission(id, {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    message: String(form.get('message') ?? ''),
  })
  if (!submission) {
    return new Response('Site not found', { status: 404 })
  }

  // Feature #1 (from Netlify): alert the owner the instant a message arrives.
  // Email the site owner when email is configured (RESEND_API_KEY); otherwise
  // fall back to logging so nothing is silently lost.
  const ownerEmail = await getSiteOwnerEmail(id)
  let emailed = false
  if (ownerEmail) {
    emailed = await sendEmail({
      to: ownerEmail,
      subject: 'New message from your Flowstas site',
      text:
        `You received a new message via your published site (/s/${id}):\n\n` +
        `From: ${submission.name} <${submission.email}>\n\n` +
        `${submission.message}\n`,
    })
  }
  if (!emailed) {
    console.log(
      `\n📬 New message for site ${id} — ${submission.name} <${submission.email}>: ${submission.message}\n`
    )
  }

  // Send the visitor back to the exact page they submitted from (works whether
  // the site was viewed at <slug>.flowstas.com or /s/<id>), with a success
  // banner. Fall back to the id URL if there's no referer.
  const referer = req.headers.get('referer')
  let target: string
  if (referer) {
    const u = new URL(referer)
    u.searchParams.set('sent', '1')
    target = u.toString()
  } else {
    target = `${new URL(req.url).origin}/s/${id}?sent=1`
  }
  return Response.redirect(target, 303)
}
