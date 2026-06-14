import { addSubmission, getSiteOwnerEmail } from '@/lib/site-store'
import { sendEmail } from '@/lib/email'

// Capture a contact-form submission from a published site, then notify the owner.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Send the visitor back to the site with a success banner.
  const origin = new URL(req.url).origin
  return Response.redirect(`${origin}/s/${id}?sent=1`, 303)
}
