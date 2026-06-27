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
//        - the repo's own Dockerfile (used as-is → ANY language)
//        - Next.js, Nuxt, SvelteKit, Astro, Remix              (Node servers)
//        - Vite / Create-React-App / Vue CLI / Gatsby / Angular (static build)
//        - Eleventy, Hugo, Jekyll                              (static site gen)
//        - Python: Django, FastAPI, Flask (gunicorn / uvicorn)
//        - Go (go.mod) and Rust (Cargo.toml)                   (compiled binary)
//        - Ruby on Rails / Rack, PHP / Laravel
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
// GIT_TERMINAL_PROMPT=0 makes git fail fast instead of hanging on a credential
// prompt when a private repo has no (or a bad) token — so we can give a clear
// message rather than a stuck build.
try {
  if (token) {
    const user = helperUserFor(repo)
    const helper = `!f() { echo username=${user}; echo password=$GH_TOKEN; }; f`
    execSync(`git -c credential.helper='${helper}' clone --depth 1 ${branchArg}${repo} ${src}`, {
      stdio: 'inherit',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
  } else {
    execSync(`git clone --depth 1 ${branchArg}${repo} ${src}`, {
      stdio: 'inherit',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    })
  }
} catch {
  // A clone failure on a reachable host is almost always private + no/bad creds.
  // Turn the raw git error into something the user can act on.
  console.error('\n✖ Could not clone the repo.')
  if (!token) {
    console.error(
      "If this repo is PRIVATE, Flowstas needs read access to clone it. Tick \"This is a private repo\" on the deploy form (or \"Private repo? Add a clone token\" under My Apps → Retry deploy) and paste a GitHub access token — a fine-grained token with read-only Contents access is enough."
    )
  } else {
    console.error(
      'The access token was rejected. It may be expired, lack read access to this repo, or be the wrong account. Generate a fresh fine-grained token (read-only Contents) for this repo and try again.'
    )
  }
  process.exit(1)
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

// Read a repo file and test it against a regex, swallowing missing-file errors.
function fileHas(rel, re) {
  try {
    return re.test(readFileSync(join(appRoot, rel), 'utf8'))
  } catch {
    return false
  }
}

// Best-effort: find the Python module + variable holding a framework app object
// (e.g. `app = FastAPI()`), so the server command can point at "module:var".
function findPyApp(klass) {
  const re = new RegExp(`(\\w+)\\s*=\\s*${klass}\\s*\\(`)
  const candidates = ['main.py', 'app.py', 'application.py', 'asgi.py', 'wsgi.py', 'server.py', 'api.py']
  for (const f of candidates) {
    const p = join(appRoot, f)
    if (existsSync(p)) {
      const m = readFileSync(p, 'utf8').match(re)
      if (m) return { module: f.replace(/\.py$/, ''), variable: m[1] }
    }
  }
  try {
    const file = capture(`grep -rlE "${klass}\\(" ${appRoot} --include=*.py 2>/dev/null | head -1`)
    if (file) {
      const m = readFileSync(file, 'utf8').match(re)
      if (m) {
        const mod = file.slice(appRoot.length + 1).replace(/\.py$/, '').replace(/[\\/]/g, '.')
        return { module: mod, variable: m[1] }
      }
    }
  } catch {}
  return null
}

// Best-effort: work out a Django project package name (the dir with settings).
function findDjangoProject() {
  try {
    const m = readFileSync(join(appRoot, 'manage.py'), 'utf8').match(
      /DJANGO_SETTINGS_MODULE['"]?\s*,\s*['"]([\w.]+)\.settings/
    )
    if (m) return m[1]
  } catch {}
  try {
    for (const e of readdirSync(appRoot)) {
      if (e === '.git' || e === 'node_modules') continue
      if (existsSync(join(appRoot, e, 'wsgi.py')) || existsSync(join(appRoot, e, 'settings.py'))) return e
    }
  } catch {}
  return null
}

// Non-Node stacks (Python, Go, Rust, Ruby, PHP) and the non-Node static site
// generators (Hugo, Jekyll). Returns a plan or null. Generated apps always
// listen on INTERNAL_PORT so they match fly.toml's internal_port.
function detectOtherPlan() {
  // --- Hugo (static site generator) ---
  const hugoConfig = ['hugo.toml', 'hugo.yaml', 'hugo.json'].some((f) => existsSync(join(appRoot, f)))
  const maybeHugo =
    hugoConfig ||
    (['config.toml', 'config.yaml', 'config.yml'].some((f) => existsSync(join(appRoot, f))) &&
      (existsSync(join(appRoot, 'content')) || existsSync(join(appRoot, 'archetypes'))))
  if (maybeHugo) return { kind: 'hugo', label: 'Hugo (static site)' }

  // --- Jekyll (checked before Ruby: a Jekyll site is also a Gemfile app) ---
  if (existsSync(join(appRoot, '_config.yml')) || existsSync(join(appRoot, '_config.yaml')))
    return { kind: 'jekyll', label: 'Jekyll (static site)' }

  // --- Python: Django / FastAPI / Flask / generic ---
  const hasReq = existsSync(join(appRoot, 'requirements.txt'))
  const hasPyproject = existsSync(join(appRoot, 'pyproject.toml'))
  if (hasReq || hasPyproject) {
    const pyInstall = hasReq
      ? 'pip install --no-cache-dir -r requirements.txt'
      : 'pip install --no-cache-dir .'

    if (existsSync(join(appRoot, 'manage.py'))) {
      const project = findDjangoProject()
      if (!project)
        console.log('▶ Django detected but could not determine the project package; assuming "config.wsgi". Add a Dockerfile if this is wrong.')
      const wsgi = project ? `${project}.wsgi` : 'config.wsgi'
      return {
        kind: 'python',
        label: `Django (${wsgi})`,
        pyInstall,
        pyServer: 'pip install --no-cache-dir gunicorn',
        start: `gunicorn ${wsgi}:application --bind 0.0.0.0:${INTERNAL_PORT}`,
      }
    }

    const fast = findPyApp('FastAPI')
    if (fast)
      return {
        kind: 'python',
        label: `FastAPI (${fast.module}:${fast.variable})`,
        pyInstall,
        pyServer: 'pip install --no-cache-dir "uvicorn[standard]"',
        start: `uvicorn ${fast.module}:${fast.variable} --host 0.0.0.0 --port ${INTERNAL_PORT}`,
      }

    const flask = findPyApp('Flask')
    if (flask)
      return {
        kind: 'python',
        label: `Flask (${flask.module}:${flask.variable})`,
        pyInstall,
        pyServer: 'pip install --no-cache-dir gunicorn',
        start: `gunicorn ${flask.module}:${flask.variable} --bind 0.0.0.0:${INTERNAL_PORT}`,
      }

    // Generic Python: run a discoverable entry script, else assume gunicorn app:app.
    const entry = ['main.py', 'app.py', 'run.py', 'server.py', 'wsgi.py'].find((f) =>
      existsSync(join(appRoot, f))
    )
    if (entry) {
      console.log(`▶ Python app detected (no Django/FastAPI/Flask app object found); running "python ${entry}". It must bind 0.0.0.0:${INTERNAL_PORT}.`)
      return { kind: 'python', label: `Python (${entry})`, pyInstall, pyServer: '', start: `python ${entry}` }
    }
    console.log('▶ Python deps detected but no obvious entrypoint; assuming gunicorn "app:app".')
    return {
      kind: 'python',
      label: 'Python (gunicorn app:app)',
      pyInstall,
      pyServer: 'pip install --no-cache-dir gunicorn',
      start: `gunicorn app:app --bind 0.0.0.0:${INTERNAL_PORT}`,
    }
  }

  // --- Go (compiled, multi-stage) ---
  if (existsSync(join(appRoot, 'go.mod'))) {
    let goPkg = '.'
    try {
      const file = capture(`grep -rlE "^func main\\(\\)" ${appRoot} --include=*.go 2>/dev/null | head -1`)
      if (file) {
        const dir = file.slice(appRoot.length + 1).split('/').slice(0, -1).join('/')
        goPkg = dir ? `./${dir}` : '.'
      }
    } catch {}
    console.log(`▶ Go module detected; building package ${goPkg}.`)
    return { kind: 'go', label: 'Go', goPkg }
  }

  // --- Rust (compiled, multi-stage) ---
  if (existsSync(join(appRoot, 'Cargo.toml'))) {
    let bin = null
    try {
      const t = readFileSync(join(appRoot, 'Cargo.toml'), 'utf8')
      const binM = t.match(/\[\[bin\]\][\s\S]*?name\s*=\s*"([^"]+)"/)
      const pkgM = t.match(/\[package\][\s\S]*?\bname\s*=\s*"([^"]+)"/)
      bin = (binM && binM[1]) || (pkgM && pkgM[1]) || null
    } catch {}
    if (!bin) {
      bin = 'app'
      console.log('▶ Rust crate detected but could not read the binary name from Cargo.toml; assuming "app".')
    }
    return { kind: 'rust', label: `Rust (${bin})`, bin }
  }

  // --- Ruby on Rails / Rack ---
  if (existsSync(join(appRoot, 'Gemfile'))) {
    const isRails =
      existsSync(join(appRoot, 'bin/rails')) ||
      existsSync(join(appRoot, 'config/application.rb')) ||
      fileHas('Gemfile', /['"]rails['"]/)
    if (isRails)
      return { kind: 'ruby', label: 'Ruby on Rails', start: `bundle exec rails server -b 0.0.0.0 -p ${INTERNAL_PORT}` }
    if (existsSync(join(appRoot, 'config.ru')))
      return { kind: 'ruby', label: 'Ruby (Rack)', start: `bundle exec rackup -o 0.0.0.0 -p ${INTERNAL_PORT}` }
    console.log('▶ Ruby Gemfile detected (not Rails/Rack); assuming a Rack app via rackup.')
    return { kind: 'ruby', label: 'Ruby', start: `bundle exec rackup -o 0.0.0.0 -p ${INTERNAL_PORT}` }
  }

  // --- PHP / Laravel ---
  if (existsSync(join(appRoot, 'composer.json'))) {
    if (existsSync(join(appRoot, 'artisan')))
      return { kind: 'php', label: 'Laravel', start: `php artisan serve --host=0.0.0.0 --port=${INTERNAL_PORT}` }
    const docroot = existsSync(join(appRoot, 'public')) ? 'public' : '.'
    console.log(`▶ PHP app detected (no artisan); serving "${docroot}" with PHP's built-in server.`)
    return { kind: 'php', label: 'PHP', start: `php -S 0.0.0.0:${INTERNAL_PORT} -t ${docroot}` }
  }

  return null
}

// Returns the build/run plan for the detected stack, or null when we can't tell.
// Order of precedence:
//   1. The repo's own Dockerfile (used verbatim → kind 'dockerfile').
//   2. Recognized Node frameworks (strong signal; needs package.json).
//   3. Non-Node stacks + non-Node static site generators (detectOtherPlan).
//   4. Generic Node fallback (build/start scripts or an entry file).
//   5. Pure static site (an index.html, no build).
function detectPlan() {
  if (existsSync(join(appRoot, 'Dockerfile'))) return { kind: 'dockerfile' }

  const hasPkg = existsSync(join(appRoot, 'package.json'))
  let pkg = null
  let scripts = {}
  let pm = null

  if (hasPkg) {
    pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    scripts = pkg.scripts || {}
    pm = pmFor(appRoot)
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
    if (has('@11ty/eleventy'))
      return { kind: 'static', label: 'Eleventy', build: scripts.build ? `${pm.run} build` : 'npx @11ty/eleventy', outDir: '_site', pm }
    if (has('@angular/core')) return { kind: 'static', label: 'Angular', build: `${pm.run} build`, outDir: 'dist', pm }
    if (has('gatsby')) return { kind: 'static', label: 'Gatsby', build: `${pm.run} build`, outDir: 'public', pm }
    if (has('react-scripts')) return { kind: 'static', label: 'Create React App', build: `${pm.run} build`, outDir: 'build', pm }
    if (has('@vue/cli-service')) return { kind: 'static', label: 'Vue CLI', build: `${pm.run} build`, outDir: 'dist', pm }
    if (has('vite')) return { kind: 'static', label: 'Vite', build: `${pm.run} build`, outDir: 'dist', pm }
  }

  // --- Non-Node stacks + non-Node static site generators ---
  const other = detectOtherPlan()
  if (other) return other

  if (hasPkg) {
    // --- Generic Node (weak signal: lean on scripts, then an entry file) ---
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
  }

  // --- Pure static site (just files, no build) ---
  if (existsSync(join(appRoot, 'index.html'))) return { kind: 'static-nobuild', label: 'Static site' }
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
  } else if (plan.kind === 'python') {
    // Python (Django / FastAPI / Flask / generic). build-essential lets native
    // wheels (psycopg2, etc.) compile; the framework server is pip-installed
    // separately in case the repo's requirements don't list it.
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY . .
RUN pip install --upgrade pip && ${plan.pyInstall}${plan.pyServer ? ` && ${plan.pyServer}` : ''}
ENV PORT=${INTERNAL_PORT}
EXPOSE ${INTERNAL_PORT}
CMD ["sh", "-c", "${plan.start}"]
`
  } else if (plan.kind === 'go') {
    // Go: multi-stage. Static (CGO off) binary built in golang, run on alpine.
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM golang:1.22 AS build
WORKDIR /app
COPY go.* ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server ${plan.goPkg}

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /app/server /app/server
ENV PORT=${INTERNAL_PORT}
EXPOSE ${INTERNAL_PORT}
CMD ["/app/server"]
`
  } else if (plan.kind === 'rust') {
    // Rust: multi-stage. cargo release build, then run the binary on debian.
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM rust:1-slim AS build
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/release/${plan.bin} /app/server
ENV PORT=${INTERNAL_PORT}
EXPOSE ${INTERNAL_PORT}
CMD ["/app/server"]
`
  } else if (plan.kind === 'ruby') {
    // Ruby on Rails / Rack. SECRET_KEY_BASE placeholder lets a production Rails
    // boot; real secrets are set later as Fly runtime secrets.
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM ruby:3.3-slim
RUN apt-get update && apt-get install -y --no-install-recommends build-essential git libpq-dev libyaml-dev pkg-config && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY Gemfile* ./
RUN gem install bundler && bundle install
COPY . .
ENV PORT=${INTERNAL_PORT} RAILS_ENV=production RACK_ENV=production RAILS_LOG_TO_STDOUT=1 RAILS_SERVE_STATIC_FILES=1 SECRET_KEY_BASE=placeholder
EXPOSE ${INTERNAL_PORT}
CMD ["sh", "-c", "${plan.start}"]
`
  } else if (plan.kind === 'php') {
    // PHP / Laravel. Composer is copied from the official image; common PHP
    // extensions are installed for typical apps.
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM php:8.3-cli
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libzip-dev libonig-dev libpng-dev && docker-php-ext-install pdo pdo_mysql zip mbstring && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY . .
RUN composer install --no-interaction --prefer-dist --no-progress --no-dev || composer install --no-interaction --prefer-dist --no-progress || true
ENV PORT=${INTERNAL_PORT}
EXPOSE ${INTERNAL_PORT}
CMD ["sh", "-c", "${plan.start}"]
`
  } else if (plan.kind === 'hugo') {
    // Hugo: build static output, then serve it like any other static site.
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM hugomods/hugo:exts AS build
WORKDIR /src
COPY . .
RUN hugo --minify --destination /src/public

FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /src/public ./public
EXPOSE ${INTERNAL_PORT}
CMD ["serve", "-s", "public", "-l", "${INTERNAL_PORT}"]
`
  } else if (plan.kind === 'jekyll') {
    // Jekyll: build to _site (bundler if a Gemfile is present, else a bare
    // jekyll), then serve the static output.
    dockerfile = `# Auto-generated by Flowstas deploy engine.
FROM ruby:3.3-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends build-essential git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN gem install bundler && (bundle install || gem install jekyll bundler) && (bundle exec jekyll build || jekyll build)

FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/_site ./public
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
