#!/usr/bin/env node
// Flowstas app-deploy engine (Phase 1 of the compute platform).
//
// Takes a public GitHub repo of a full app and deploys it to a running app on
// Fly.io — the same steps proven by hand in the Phase 0 spike, now codified so
// Flowstas itself can drive them. This is the "build worker" logic; it must run
// somewhere with `flyctl` + FLY_API_TOKEN (NOT inside a Vercel function).
//
// Usage:
//   node scripts/deploy-app.mjs --repo <url> --name <fly-app-name> [--branch main]
//
// What it does:
//   1. Shallow-clones the repo.
//   2. Detects a Next.js app (package.json has "next").
//   3. If there's no Dockerfile, generates one. Build-time env crashes are the
//      #1 failure (apps read process.env.X! at module load), so we scan the repo
//      for every process.env.NAME and feed a harmless placeholder for each, so
//      `next build` passes. Real values are set later via `flyctl secrets`.
//   4. Ensures the Fly app exists, then deploys with Fly's remote builder.
//   5. Prints the live URL.

import { execSync } from 'node:child_process'
import { mkdtempSync, existsSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function arg(flag, fallback = undefined) {
  const i = process.argv.indexOf(flag)
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback
}
function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`)
  return execSync(cmd, { stdio: 'inherit', ...opts })
}
function capture(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', ...opts }).trim()
}

const repo = arg('--repo')
const name = arg('--name')
const branch = arg('--branch')
if (!repo || !name) {
  console.error('Usage: node scripts/deploy-app.mjs --repo <url> --name <app> [--branch <b>]')
  process.exit(1)
}

// 1. Clone --------------------------------------------------------------------
// Private repos pass a GitHub token via the GH_TOKEN env var (set by the worker).
// We feed it to git through a credential helper that reads it from the
// environment, so the token never appears in the command, the streamed build
// logs, or the process list.
const token = process.env.GH_TOKEN || ''
const work = mkdtempSync(join(tmpdir(), 'flowstas-deploy-'))
const src = join(work, 'src')
const branchArg = branch ? `--branch ${branch} ` : ''
console.log(`\n▶ Cloning ${repo}${branch ? ` (branch ${branch})` : ''}${token ? ' (private)' : ''} → ${src}`)
if (token) {
  // Run directly (not via run(), which echoes the command) so the helper config
  // isn't printed. The token stays in $GH_TOKEN; git expands it only inside the
  // helper subprocess.
  const helper = `!f() { echo username=x-access-token; echo password=$GH_TOKEN; }; f`
  execSync(`git -c credential.helper='${helper}' clone --depth 1 ${branchArg}${repo} ${src}`, {
    stdio: 'inherit',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
} else {
  run(`git clone --depth 1 ${branchArg}${repo} ${src}`)
}

// Some repos nest the app in a subfolder; pick the dir that has package.json.
function findAppRoot(dir) {
  if (existsSync(join(dir, 'package.json'))) return dir
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory() && existsSync(join(p, 'package.json'))) return p
  }
  return dir
}
const appRoot = findAppRoot(src)
console.log(`▶ App root: ${appRoot}`)

// 2. Detect framework ---------------------------------------------------------
const pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
const deps = { ...pkg.dependencies, ...pkg.devDependencies }
if (!deps.next) {
  console.error('✗ Only Next.js apps are supported by this engine for now.')
  process.exit(1)
}
console.log(`▶ Detected Next.js ${deps.next}`)

// 3. Generate a Dockerfile (with placeholder build env) -----------------------
function scanEnvNames(dir) {
  // Grep the source for process.env.NAME references.
  try {
    const out = capture(
      `grep -rhoE "process\\.env\\.[A-Z0-9_]+" ${dir} --include=*.ts --include=*.tsx --include=*.js --include=*.mjs 2>/dev/null | sort -u`
    )
    return [...new Set(out.split('\n').map((l) => l.replace('process.env.', '').trim()).filter(Boolean))]
  } catch {
    return []
  }
}
function placeholderFor(envName) {
  if (/SUPABASE_URL/.test(envName)) return 'https://placeholder.supabase.co'
  if (/URL/.test(envName)) return 'https://placeholder.example.com'
  if (/STRIPE_SECRET/.test(envName)) return 'sk_test_placeholder'
  if (/PUBLISHABLE/.test(envName)) return 'pk_test_placeholder'
  if (/WEBHOOK_SECRET/.test(envName)) return 'whsec_placeholder'
  if (/PRICE/.test(envName)) return 'price_placeholder'
  return 'placeholder'
}

if (!existsSync(join(appRoot, 'Dockerfile'))) {
  const envNames = scanEnvNames(appRoot)
  const envLines = envNames.map((n) => `ENV ${n}="${placeholderFor(n)}"`).join('\n')
  console.log(`▶ No Dockerfile — generating one. Placeholder build env for: ${envNames.join(', ') || '(none)'}`)
  const dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM node:20-slim AS app
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
${envLines}
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
`
  writeFileSync(join(appRoot, 'Dockerfile'), dockerfile)
}

// fly.toml — minimal, idle-stops to keep cost near zero.
if (!existsSync(join(appRoot, 'fly.toml'))) {
  writeFileSync(
    join(appRoot, 'fly.toml'),
    `app = "${name}"
primary_region = "lhr"
[build]
[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
[[vm]]
  size = "shared-cpu-1x"
  memory = "1024mb"
`
  )
}

// 4. Ensure app exists, then deploy -------------------------------------------
console.log(`\n▶ Ensuring Fly app "${name}" exists`)
try {
  run(`flyctl apps create ${name} --org personal`)
} catch {
  console.log('  (app already exists — continuing)')
}

console.log(`\n▶ Deploying to Fly (remote build)`)
run(`flyctl deploy --remote-only --ha=false --now`, { cwd: appRoot })

console.log(`\n✅ Deployed. Live at: https://${name}.fly.dev/`)
