// Ready-made starter sites for people who have no files of their own. Picking
// one drops its HTML into the editor so they can change the words and publish.
// Each contact form posts to {{FORM_ACTION}}, which the server rewrites to the
// real capture endpoint when the site is served (see lib/site-store.ts).

export type Template = {
  id: string
  name: string
  tagline: string
  emoji: string
  html: string
}

const page = (title: string, body: string, accent: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2430;line-height:1.6}
  .hero{background:${accent};padding:96px 24px;text-align:center;color:#fff}
  .hero h1{font-size:3rem;margin-bottom:12px}
  .hero p{font-size:1.25rem;opacity:.92}
  .wrap{max-width:760px;margin:0 auto;padding:64px 24px}
  h2{font-size:1.75rem;margin-bottom:16px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:24px}
  .card{border:1px solid #eee;border-radius:14px;padding:22px;box-shadow:0 6px 18px rgba(0,0,0,.05)}
  .card h3{margin-bottom:6px}
  form{display:grid;gap:14px;margin-top:24px}
  input,textarea{width:100%;padding:14px;border:1px solid #ddd;border-radius:10px;font:inherit}
  button{background:#1f2430;color:#fff;border:0;padding:14px;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer}
  button:hover{opacity:.9}
  footer{text-align:center;padding:32px;color:#888;font-size:.9rem}
</style>
</head>
<body>
${body}
  <footer>Made with Flowstas</footer>
</body>
</html>`

const contactForm = `    <h2>Get in touch</h2>
    <form action="{{FORM_ACTION}}" method="POST">
      <input name="name" placeholder="Your name" required>
      <input name="email" type="email" placeholder="Your email" required>
      <textarea name="message" rows="4" placeholder="Your message" required></textarea>
      <button type="submit">Send message</button>
    </form>`

export const TEMPLATES: Template[] = [
  {
    id: 'cafe',
    name: 'Corner Café',
    tagline: 'Menu + contact for a shop or restaurant',
    emoji: '☕',
    html: page(
      'Corner Café',
      `  <section class="hero" style="background:linear-gradient(135deg,#8e5a3b,#c08552)">
    <h1>☕ Corner Café</h1>
    <p>Good coffee, warm welcome, every day.</p>
  </section>
  <div class="wrap">
    <h2>On the menu</h2>
    <div class="grid">
      <div class="card"><h3>Flat White</h3><p>Smooth double shot.</p></div>
      <div class="card"><h3>Fresh Pastries</h3><p>Baked this morning.</p></div>
      <div class="card"><h3>Brunch</h3><p>Served till noon.</p></div>
    </div>
${contactForm}
  </div>`,
      'linear-gradient(135deg,#8e5a3b,#c08552)'
    ),
  },
  {
    id: 'portfolio',
    name: 'Freelancer Portfolio',
    tagline: 'Show your work and take enquiries',
    emoji: '🎨',
    html: page(
      'Your Name — Portfolio',
      `  <section class="hero" style="background:linear-gradient(135deg,#3a1c71,#5f2c82)">
    <h1>Your Name</h1>
    <p>Designer &amp; maker. Available for new projects.</p>
  </section>
  <div class="wrap">
    <h2>Selected work</h2>
    <div class="grid">
      <div class="card"><h3>Project One</h3><p>What you did and the result.</p></div>
      <div class="card"><h3>Project Two</h3><p>What you did and the result.</p></div>
      <div class="card"><h3>Project Three</h3><p>What you did and the result.</p></div>
    </div>
${contactForm}
  </div>`,
      'linear-gradient(135deg,#3a1c71,#5f2c82)'
    ),
  },
  {
    id: 'startup',
    name: 'Startup Landing',
    tagline: 'One-page pitch with a sign-up form',
    emoji: '🚀',
    html: page(
      'Your Product',
      `  <section class="hero" style="background:linear-gradient(135deg,#0f2027,#2c5364)">
    <h1>🚀 Your Product</h1>
    <p>The one line that explains what you do.</p>
  </section>
  <div class="wrap">
    <h2>Why teams choose us</h2>
    <div class="grid">
      <div class="card"><h3>Fast</h3><p>Up and running in minutes.</p></div>
      <div class="card"><h3>Simple</h3><p>No manual needed.</p></div>
      <div class="card"><h3>Reliable</h3><p>Built to be trusted.</p></div>
    </div>
${contactForm}
  </div>`,
      'linear-gradient(135deg,#0f2027,#2c5364)'
    ),
  },
]
