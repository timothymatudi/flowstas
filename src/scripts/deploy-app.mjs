#!/usr/bin/env node
// Flowstas app-deploy engine (Phase 1 of the compute platform).
//
// Takes a public/private Git repo of a full app and deploys it to a running app
// on Fly.io. This is the "build worker" logic; it must run somewhere with
// `flyctl` + FLY_API_TOKEN (NOT inside a Vercel function).
//
// Usage:
//   node scripts/deploy-app.mjs --repo <url> --name <fly-app-name> [--branch main]
//
// What it does:
//   1. Shallow-clones the repo (GitHub / GitLab / Bitbucket / any git URL).
//   2. Detects the framework and how to build + run it. Supported:
//        - the repo's own Dockerfile (used as-is → ANY language: Python, Go, …)
//        - Next.js, Nuxt, SvelteKit, Astro, Remix          (Node servers)
//        - Vite / Create-React-App / Vue CLI / Gatsby        (static build)
//        - generic Node (build+start / start only)
//        - pure static sites (no build, just files)
//   3. If there's no Dockerfile, generates one. Build-time env crashes are the
//      #1 failure (apps read process.env.X! at module load), so we scan the repo
//      for every process.env.NAME and feed a harmless placeholder for each, so
//      the build passes. Real values are set later via `flyctl secrets`.
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
// --dry: clone + detect + generate the Dockerfile, then stop (no Fly deploy).
// Used to verify framework detection without spending Fly resources.
const dry = process.argv.includes('--dry')
if (!repo || !name) {
  console.error('Usage: node scripts/deploy-app.mjs --repo <url> --name <app> [--branch <b>]')
  process.exit(1)
}

// 1. Clone --------------------------------------------------------------------
// Private repos pass a token via the GH_TOKEN env var (set by the worker). We
// feed it to git through a credential helper that reads it from the environment,
// so the token never appears in the command, the streamed logs, or the process
// list. The helper username is host-specific.
const token = process.env.GH_TOKEN || ''
function helperUserFor(repoUrl) {
  if (/gitlab\.com/i.test(repoUrl)) return 'oauth2'
  if (/bitbucket\.org/i.test(repoUrl)) return 'x-token-auth'
  return 'x-access-token' // github + sensible default
}
const work = mkdtempSync(join(tmpdir(), 'flowstas-deploy-'))
const src = join(work, 'src')
const branchArg = branch ? `--branch ${branch} ` : ''
console.log(`\n▶ Cloning ${repo}${branch ? ` (branch ${branch})` : ''}${token ? ' (private)' : ''} → ${src}`)
if (token) {
  const user = helperUserFor(repo)
  const helper = `!f() { echo username=${user}; echo password=$GH_TOKEN; }; f`
  execSync(`git -c credential.helper='${helper}' clone --depth 1 ${branchArg}${repo} ${src}`, {
    stdio: 'inherit',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  })
} else {
  run(`git clone --depth 1 ${branchArg}${repo} ${src}`)
}

// Some repos nest the app in a subfolder; pick the dir that has a project file.
function findAppRoot(dir) {
  const marks = ['package.json', 'Dockerfile', 'index.html']
  if (marks.some((m) => existsSync(join(dir, m)))) return dir
  for (const entry of readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue
    const p = join(dir, entry)
    if (statSync(p).isDirectory() && marks.some((m) => existsSync(join(p, m)))) return p
  }
  return dir
}
const appRoot = findAppRoot(src)
console.log(`▶ App root: ${appRoot}`)

// 2. Detect framework + how to build/run it -----------------------------------
function scanEnvNames(dir) {
  // Grep the source for process.env.NAME references so the build doesn't crash
  // on missing build-time env.
  try {
    const out = capture(
      `grep -rhoE "process\\.env\\.[A-Z0-9_]+" ${dir} --include=*.ts --include=*.tsx --include=*.js --include=*.jsx --include=*.mjs --include=*.cjs 2>/dev/null | sort -u`
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

// Real build-time env values supplied by the worker (FLOWSTAS_BUILD_ENV, a JSON
// map). These are only ever client-side PUBLIC values (NEXT_PUBLIC_*, VITE_*,
// etc.) that get inlined into the browser bundle at build time, so a placeholder
// would be frozen into the shipped app and break it. Server secrets are NOT sent
// here — they stay placeholders at build and are set as real Fly runtime secrets.
let BUILD_ENV = {}
try {
  const parsed = JSON.parse(process.env.FLOWSTAS_BUILD_ENV || '{}')
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) BUILD_ENV = parsed
} catch {
  BUILD_ENV = {}
}

// Escape a value so it is safe inside a double-quoted Dockerfile ENV instruction.
function dockerEnvValue(v) {
  return String(v)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/\r?\n/g, ' ')
}

// Resolve the build-time value for an env name: the real value when the worker
// provided one (public vars), otherwise a harmless placeholder so the build
// doesn't crash on `process.env.X!` at module load.
function buildEnvValueFor(name) {
  const real = BUILD_ENV[name]
  if (real != null && String(real) !== '') {
    return { value: dockerEnvValue(real), real: true }
  }
  return { value: placeholderFor(name), real: false }
}

const INTERNAL_PORT = 3000

// Choose package manager from the lockfile so installs/builds match the project.
function pmFor(dir) {
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) {
    return { install: 'corepack enable && pnpm install --no-frozen-lockfile', run: 'pnpm run' }
  }
  if (existsSync(join(dir, 'yarn.lock'))) {
    return { install: 'corepack enable && yarn install', run: 'yarn' }
  }
  return { install: 'npm install --no-audit --no-fund', run: 'npm run' }
}

// Returns the build/run plan for the detected framework, or null when the repo
// already has a Dockerfile (we use that verbatim).
function detectPlan() {
  if (existsSync(join(appRoot, 'Dockerfile'))) return { kind: 'dockerfile' }

  const hasPkg = existsSync(join(appRoot, 'package.json'))
  if (!hasPkg) {
    if (existsSync(join(appRoot, 'index.html'))) return { kind: 'static-nobuild', label: 'Static site' }
    return null // can't tell — caller errors with guidance
  }

  const pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const scripts = pkg.scripts || {}
  const pm = pmFor(appRoot)
  const has = (d) => Boolean(deps[d])

  // --- Node-server frameworks (build, then run a long-lived server) ---
  if (has('next'))
    return { kind: 'server', label: `Next.js ${deps.next}`, build: `${pm.run} build`, start: `${pm.run} start`, pm }
  if (has('nuxt') || has('nuxt3'))
    return { kind: 'server', label: 'Nuxt', build: `${pm.run} build`, start: 'node .output/server/index.mjs', pm }
  if (has('@sveltejs/kit'))
    return { kind: 'server', label: 'SvelteKit', build: `${pm.run} build`, start: 'node build', pm }
  if (has('@remix-run/server-runtime') || has('@remix-run/node') || has('@remix-run/serve'))
    return { kind: 'server', label: 'Remix', build: `${pm.run} build`, start: `${pm.run} start`, pm }
  if (has('astro')) {
    if (has('@astrojs/node'))
      return { kind: 'server', label: 'Astro (SSR)', build: `${pm.run} build`, start: 'node ./dist/server/entry.mjs', pm }
    return { kind: 'static', label: 'Astro (static)', build: `${pm.run} build`, outDir: 'dist', pm }
  }

  // --- Static build frameworks (build to a folder, then serve it) ---
  if (has('@angular/core')) return { kind: 'static', label: 'Angular', build: `${pm.run} build`, outDir: 'dist', pm }
  if (has('gatsby')) return { kind: 'static', label: 'Gatsby', build: `${pm.run} build`, outDir: 'public', pm }
  if (has('react-scripts')) return { kind: 'static', label: 'Create React App', build: `${pm.run} build`, outDir: 'build', pm }
  if (has('@vue/cli-service')) return { kind: 'static', label: 'Vue CLI', build: `${pm.run} build`, outDir: 'dist', pm }
  if (has('vite')) return { kind: 'static', label: 'Vite', build: `${pm.run} build`, outDir: 'dist', pm }

  // --- Generic Node ---
  if (scripts.build && scripts.start)
    return { kind: 'server', label: 'Node app', build: `${pm.run} build`, start: `${pm.run} start`, pm }
  if (scripts.start)
    return { kind: 'server', label: 'Node app', build: null, start: `${pm.run} start`, pm }
  if (scripts.build)
    return { kind: 'static', label: 'Static build', build: `${pm.run} build`, outDir: 'dist', pm }

  // No build/start script: fall back to running the main entry file directly
  // (covers plain Node apps that only ship a `dev` script or none).
  const entries = [pkg.main, 'server.js', 'index.js', 'src/index.js', 'app.js', 'src/server.js', 'main.js']
  for (const e of entries) {
    if (e && existsSync(join(appRoot, e)))
      return { kind: 'server', label: `Node app (${e})`, build: null, start: `node ${e}`, pm }
  }

  return null
}

// 3. Generate a Dockerfile (unless the repo ships its own) ---------------------
const plan = detectPlan()
if (!plan) {
  console.error(
    '✗ Could not detect how to build this app. Add a Dockerfile to your repo and Flowstas will use it as-is.'
  )
  process.exit(1)
}

// The port Fly should route to. For our generated Dockerfiles it's always
// INTERNAL_PORT; for a repo's own Dockerfile we read its EXPOSE so apps that
// listen on a different port (e.g. Python/gunicorn on 5000) still work.
let internalPort = INTERNAL_PORT
if (plan.kind === 'dockerfile') {
  console.log('▶ Detected a Dockerfile — using it as-is.')
  const m = readFileSync(join(appRoot, 'Dockerfile'), 'utf8').match(/^\s*EXPOSE\s+(\d+)/im)
  if (m) {
    internalPort = parseInt(m[1], 10)
    console.log(`▶ Using EXPOSE ${internalPort} from your Dockerfile.`)
  }
} else {
  console.log(`▶ Detected ${plan.label}`)
  const envNames = scanEnvNames(appRoot)
  const resolvedEnv = envNames.map((n) => ({ name: n, ...buildEnvValueFor(n) }))
  const envLines = resolvedEnv.map((e) => `ENV ${e.name}="${e.value}"`).join('\n')
  const realNames = resolvedEnv.filter((e) => e.real).map((e) => e.name)
  const placeholderNames = resolvedEnv.filter((e) => !e.real).map((e) => e.name)
  if (realNames.length) console.log(`▶ Real build env baked for: ${realNames.join(', ')}`)
  if (placeholderNames.length) console.log(`▶ Placeholder build env for: ${placeholderNames.join(', ')}`)

  let dockerfile
  if (plan.kind === 'static-nobuild') {
    // Pure static: no package.json, just serve the files.
    console.log('▶ No build step — serving files directly.')
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY . .
EXPOSE ${INTERNAL_PORT}
CMD ["serve", "-s", ".", "-l", "${INTERNAL_PORT}"]
`
  } else if (plan.kind === 'static') {
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN ${plan.pm.install}
COPY . .
${envLines}
RUN ${plan.build}

FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/${plan.outDir} ./public
EXPOSE ${INTERNAL_PORT}
CMD ["serve", "-s", "public", "-l", "${INTERNAL_PORT}"]
`
  } else {
    // Node server.
    const buildLine = plan.build ? `RUN ${plan.build}` : '# (no build step)'
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN ${plan.pm.install}
COPY . .
${envLines}
${buildLine}
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=${INTERNAL_PORT}
EXPOSE ${INTERNAL_PORT}
CMD ["sh", "-c", "${plan.start}"]
`
  }
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
  internal_port = ${internalPort}
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

if (dry) {
  const df = existsSync(join(appRoot, 'Dockerfile')) ? readFileSync(join(appRoot, 'Dockerfile'), 'utf8') : '(none)'
  console.log(`\n▶ DRY RUN — plan: ${plan.label || plan.kind}`)
  console.log(`\n----- Dockerfile -----\n${df}\n----------------------`)
  console.log('✅ Dry run OK (no Fly deploy performed).')
  process.exit(0)
}

// 4. Ensure app exists, then deploy -------------------------------------------
console.log(`\n▶ Ensuring Fly app "${name}" exists`)
try {
  run(`flyctl apps create ${name} --org personal`, { stdio: ['ignore', 'inherit', 'pipe'] })
} catch (err) {
  const stderr = (err.stderr || '').toString()
  if (/already.*taken|already exists|name has already been taken/i.test(stderr)) {
    console.log('  (app already exists — continuing)')
  } else {
    console.error(stderr || err.message)
    console.error(`✗ Could not create or access Fly app "${name}".`)
    process.exit(1)
  }
}

console.log(`\n▶ Deploying to Fly (remote build)`)
run(`flyctl deploy --remote-only --ha=false --now`, { cwd: appRoot })

console.log(`\n✅ Deployed. Live at: https://${name}.fly.dev/`)
