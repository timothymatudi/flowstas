// Publish a few real example sites on Flowstas (live at <slug>.flowstas.com) so
// the homepage can show real screenshots — honest proof, like Framer's gallery.
// Usage: node scripts/seed-examples.mjs
import { readFileSync } from 'node:fs'
import { Client } from 'pg'

const env = {}
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '')
}
const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
const conn = (env.POSTGRES_URL_NON_POOLING || '').split('?')[0]

const page = ({ font, ink, accent, bg, brand, nav, hero, sub, sections }) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${brand}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${font}:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'${font.replace(/\+/g,' ')}',system-ui,sans-serif;color:${ink};background:${bg};line-height:1.6}
.wrap{max-width:1040px;margin:0 auto;padding:0 24px}
header{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.logo{font-weight:800;font-size:20px;letter-spacing:-.02em}
nav a{margin-left:22px;text-decoration:none;color:${ink};opacity:.7;font-size:15px}
.btn{display:inline-block;background:${accent};color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px}
.hero{padding:64px 0 40px}
.hero h1{font-size:clamp(38px,6vw,68px);line-height:1.05;letter-spacing:-.03em;font-weight:800;max-width:14ch}
.hero p{font-size:20px;opacity:.7;margin:20px 0 28px;max-width:48ch}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:32px 0 64px}
.card{background:#fff;border:1px solid rgba(0,0,0,.07);border-radius:16px;padding:26px;box-shadow:0 10px 30px -16px rgba(0,0,0,.2)}
.card h3{font-size:18px;margin-bottom:8px}
.card p{opacity:.65;font-size:15px}
.band{background:${accent};color:#fff;border-radius:20px;padding:48px;text-align:center;margin:0 0 56px}
.band h2{font-size:32px;letter-spacing:-.02em}
.pill{display:inline-block;background:${accent}1a;color:${accent};padding:6px 14px;border-radius:99px;font-weight:600;font-size:13px;margin-bottom:18px}
</style></head>
<body><div class="wrap">
<header><div class="logo">${brand}</div><nav>${nav.map((n) => `<a href="#">${n}</a>`).join('')}<a class="btn" style="margin-left:22px" href="#">Get in touch</a></nav></header>
<section class="hero"><span class="pill">${sub}</span><h1>${hero}</h1><p>${sections.lead}</p><a class="btn" href="#">${sections.cta}</a></section>
<section class="grid">${sections.cards.map((c) => `<div class="card"><h3>${c.t}</h3><p>${c.d}</p></div>`).join('')}</section>
<section class="band"><h2>${sections.bandTitle}</h2></section>
</div></body></html>`

const SITES = [
  {
    slug: 'sunrise-bakery', name: 'Sunrise Bakery',
    html: page({
      font: 'Plus+Jakarta+Sans', ink: '#2a2118', accent: '#c9722f', bg: '#fbf6ef', brand: 'Sunrise Bakery',
      nav: ['Menu', 'About', 'Visit'], sub: 'Baked fresh every morning',
      hero: 'Real bread, baked before sunrise.',
      sections: { lead: 'Sourdough, pastries and celebration cakes — handmade daily in our little corner bakery. Order ahead or just pop in.', cta: 'See today’s menu',
        cards: [{ t: 'Daily sourdough', d: 'Slow-proved for 24 hours and baked at dawn.' }, { t: 'Custom cakes', d: 'Birthdays, weddings and everything between.' }, { t: 'Coffee bar', d: 'Local roast, flat whites and a warm seat.' }], bandTitle: 'Pre-order for the weekend →' },
    }),
  },
  {
    slug: 'atlas-fitness', name: 'Atlas Fitness',
    html: page({
      font: 'Inter', ink: '#10151f', accent: '#1f7a4d', bg: '#f4f7f5', brand: 'Atlas Fitness',
      nav: ['Classes', 'Coaches', 'Pricing'], sub: 'Strength & conditioning studio',
      hero: 'Train with intent. Get stronger.',
      sections: { lead: 'Small-group coaching, real programming and a community that shows up. First session is on us.', cta: 'Book a free session',
        cards: [{ t: 'Small groups', d: 'Max 8 per class so form always comes first.' }, { t: 'Real coaches', d: 'Qualified, certified and genuinely invested.' }, { t: 'Flexible plans', d: 'Pay monthly, pause anytime, no contracts.' }], bandTitle: 'Your first week is free →' },
    }),
  },
  {
    slug: 'lumen-studio', name: 'Lumen Studio',
    html: page({
      font: 'Sora', ink: '#171520', accent: '#5b46d6', bg: '#f6f5fb', brand: 'Lumen Studio',
      nav: ['Work', 'Services', 'Contact'], sub: 'Brand & web design studio',
      hero: 'Brands that look the part.',
      sections: { lead: 'A small studio crafting identities and websites for ambitious founders. Clear, considered, and built to convert.', cta: 'Start a project',
        cards: [{ t: 'Brand identity', d: 'Logo, type and a system that scales.' }, { t: 'Web design', d: 'Fast, modern sites that feel premium.' }, { t: 'Art direction', d: 'A consistent look across everything you ship.' }], bandTitle: 'Let’s build something →' },
    }),
  },
]

const main = async () => {
  const c = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  await c.connect()
  for (const s of SITES) {
    const id = s.slug // use slug as id for simplicity
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/sites/${id}/index.html`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'text/html; charset=utf-8', 'x-upsert': 'true' },
      body: s.html,
    })
    await c.query(
      `insert into public.sites(id,name,file_count,subdomain) values($1,$2,1,$3)
       on conflict(id) do update set name=excluded.name, subdomain=excluded.subdomain`,
      [id, s.name, s.slug]
    )
    console.log(`published ${s.slug} -> ${up.status} -> https://${s.slug}.flowstas.com`)
  }
  await c.end()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
