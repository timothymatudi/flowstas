// A ready-to-publish sample site so anyone can try the flow in one click.
// The contact form posts to {{FORM_ACTION}}, which the server rewrites to the
// real capture endpoint when the site is served.
export const SAMPLE_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bella's Bakery</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2d2a26;line-height:1.6}
  .hero{background:linear-gradient(135deg,#f6d365,#fda085);padding:96px 24px;text-align:center;color:#3a2a1a}
  .hero h1{font-size:3rem;margin-bottom:12px}
  .hero p{font-size:1.25rem;opacity:.9}
  .wrap{max-width:760px;margin:0 auto;padding:64px 24px}
  h2{font-size:1.75rem;margin-bottom:16px}
  .menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:24px}
  .card{border:1px solid #eee;border-radius:14px;padding:20px;box-shadow:0 6px 18px rgba(0,0,0,.05)}
  .card h3{margin-bottom:6px}
  .price{color:#e07b39;font-weight:700}
  form{display:grid;gap:14px;margin-top:24px}
  input,textarea{width:100%;padding:14px;border:1px solid #ddd;border-radius:10px;font:inherit}
  button{background:#e07b39;color:#fff;border:0;padding:14px;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer}
  button:hover{background:#c96a2e}
  footer{text-align:center;padding:32px;color:#888;font-size:.9rem}
</style>
</head>
<body>
  <section class="hero">
    <h1>🥐 Bella's Bakery</h1>
    <p>Fresh-baked happiness, every morning.</p>
  </section>
  <div class="wrap">
    <h2>Today's favourites</h2>
    <div class="menu">
      <div class="card"><h3>Sourdough</h3><p>Slow-fermented, crusty, perfect.</p><p class="price">$6</p></div>
      <div class="card"><h3>Almond Croissant</h3><p>Buttery, flaky, almond cream.</p><p class="price">$4</p></div>
      <div class="card"><h3>Cinnamon Roll</h3><p>Warm, gooey, iced.</p><p class="price">$5</p></div>
    </div>
  </div>
  <div class="wrap" style="padding-top:0">
    <h2>Get in touch</h2>
    <p>Questions, custom orders, catering? Send us a message.</p>
    <form action="{{FORM_ACTION}}" method="POST">
      <input name="name" placeholder="Your name" required>
      <input name="email" type="email" placeholder="Your email" required>
      <textarea name="message" rows="4" placeholder="Your message" required></textarea>
      <button type="submit">Send message</button>
    </form>
  </div>
  <footer>© Bella's Bakery — made with Flowstas</footer>
</body>
</html>`
