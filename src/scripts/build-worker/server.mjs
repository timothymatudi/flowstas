#!/usr/bin/env node
// Flowstas build worker (Phase 1 of the compute platform).
//
// The deploy engine (scripts/deploy-app.mjs) shells out to git + flyctl and can
// run a multi-minute build, so it CANNOT live inside a Vercel function. This
// worker is the always-on home for it: a tiny HTTP service that the Flowstas
// website calls to deploy a customer's app. It runs on a Fly machine that has
// flyctl + FLY_API_TOKEN baked in.
//
// Endpoints:
//   GET  /health          -> { ok: true }
//   POST /deploy          -> streams build logs as plain text, ends with a line
//                            "FLOWSTAS_RESULT { ...json }" carrying url|error.
//     auth:  Authorization: Bearer <WORKER_TOKEN>
//     body:  { repo: "<github url>", name: "<fly-app>", branch?: "<branch>" }
//
// Env it needs:
//   WORKER_TOKEN   shared secret the website signs requests with
//   FLY_API_TOKEN  Fly access token (so the engine can create + deploy apps)
//   PORT           defaults to 8080

import { createServer } from 'node:http'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ENGINE = join(__dirname, '..', 'deploy-app.mjs')

const PORT = process.env.PORT || 8080
const WORKER_TOKEN = process.env.WORKER_TOKEN || ''

// Fly app names: lowercase letters, numbers, hyphens. We never pass user text to
// a shell, but still validate so a bad name fails fast with a clear message.
const VALID_NAME = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
const VALID_REPO = /^https:\/\/(?:github\.com|gitlab\.com|bitbucket\.org)\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/
const VALID_DOMAIN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i
const VALID_ENV_KEY = /^[A-Z][A-Z0-9_]*$/

// Run a flyctl command with arguments passed as a real argv (NEVER a shell
// string), so customer-supplied values can't inject commands. Returns stdout.
function runFly(args) {
  return execFileSync('flyctl', args, {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  })
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(body))
}

// Return an app's public dedicated IPs ({ v4, v6 }) so customers can point
// branded A/AAAA records at them. Empty strings if none allocated yet.
function listAppIps(app) {
  try {
    const rows = JSON.parse(runFly(['ips', 'list', '--app', app, '--json']))
    const v4 = rows.find((r) => r.Type === 'v4' || r.type === 'v4')
    const v6 = rows.find((r) => r.Type === 'v6' || r.type === 'v6')
    return { v4: (v4?.Address || v4?.address || ''), v6: (v6?.Address || v6?.address || '') }
  } catch {
    return { v4: '', v6: '' }
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (c) => {
      body += c
      if (body.length > 1e6) reject(new Error('payload too large'))
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  // Everything past here is POST + Bearer-authed.
  if (req.method !== 'POST') {
    return sendJson(res, 404, { error: 'not found' })
  }
  const auth = req.headers.authorization || ''
  if (!WORKER_TOKEN || auth !== `Bearer ${WORKER_TOKEN}`) {
    return sendJson(res, 401, { error: 'unauthorized' })
  }

  let payload
  try {
    payload = await readJson(req)
  } catch (err) {
    return sendJson(res, 400, { error: err.message })
  }

  // The Fly app name is required + validated for every command below.
  const name = payload.name
  if (!VALID_NAME.test(name || '')) {
    return sendJson(res, 400, { error: 'name must be lowercase letters, numbers, hyphens' })
  }

  // --- POST /secrets : set real env vars/secrets, then they take effect ------
  if (req.url === '/secrets') {
    const secrets = payload.secrets
    if (!secrets || typeof secrets !== 'object' || Array.isArray(secrets)) {
      return sendJson(res, 400, { error: 'secrets must be an object of KEY: value' })
    }
    const pairs = []
    for (const [k, v] of Object.entries(secrets)) {
      if (!VALID_ENV_KEY.test(k)) {
        return sendJson(res, 400, { error: `invalid env key: ${k}` })
      }
      pairs.push(`${k}=${v == null ? '' : String(v)}`)
    }
    if (pairs.length === 0) return sendJson(res, 400, { error: 'no secrets provided' })
    try {
      // --stage avoids an immediate restart; deploy/machine update applies them.
      runFly(['secrets', 'set', ...pairs, '--app', name, '--stage'])
      return sendJson(res, 200, { ok: true, count: pairs.length })
    } catch (err) {
      return sendJson(res, 502, { ok: false, error: (err.stderr || err.message || '').toString().slice(0, 500) })
    }
  }

  // --- POST /lifecycle : stop | start | restart -----------------------------
  if (req.url === '/lifecycle') {
    const action = payload.action
    try {
      if (action === 'stop') runFly(['scale', 'count', '0', '--app', name, '--yes'])
      else if (action === 'start') runFly(['scale', 'count', '1', '--app', name, '--yes'])
      else if (action === 'restart') runFly(['apps', 'restart', name])
      else return sendJson(res, 400, { error: 'action must be stop, start or restart' })
      return sendJson(res, 200, { ok: true, action })
    } catch (err) {
      return sendJson(res, 502, { ok: false, error: (err.stderr || err.message || '').toString().slice(0, 500) })
    }
  }

  // --- POST /domain : add | remove a custom domain (+ TLS cert) --------------
  if (req.url === '/domain') {
    const action = payload.action
    const domain = (payload.domain || '').toLowerCase().trim()
    if (!VALID_DOMAIN.test(domain)) {
      return sendJson(res, 400, { error: 'invalid domain' })
    }
    try {
      if (action === 'add') {
        // Ensure the app has dedicated IPs so customers point A/AAAA records at
        // numbers (branded as "Flowstas") — never at a *.fly.dev host. This keeps
        // the underlying provider hidden from customers.
        let ips = listAppIps(name)
        if (!ips.v4) {
          try { runFly(['ips', 'allocate-v4', '--app', name, '--yes']) } catch {}
        }
        if (!ips.v6) {
          try { runFly(['ips', 'allocate-v6', '--app', name]) } catch {}
        }
        runFly(['certs', 'add', domain, '--app', name])
        ips = listAppIps(name)
        return sendJson(res, 200, { ok: true, domain, a: ips.v4, aaaa: ips.v6 })
      }
      if (action === 'remove') {
        runFly(['certs', 'remove', domain, '--app', name, '--yes'])
        return sendJson(res, 200, { ok: true, domain })
      }
      return sendJson(res, 400, { error: 'action must be add or remove' })
    } catch (err) {
      return sendJson(res, 502, { ok: false, error: (err.stderr || err.message || '').toString().slice(0, 500) })
    }
  }

  // --- POST /deploy : build + deploy from a repo (streams logs) --------------
  if (req.url !== '/deploy') {
    return sendJson(res, 404, { error: 'not found' })
  }

  const { repo, branch, token, buildEnv } = payload
  if (!VALID_REPO.test(repo || '')) {
    return sendJson(res, 400, { error: 'repo must be a https://{github.com|gitlab.com|bitbucket.org}/owner/name URL' })
  }
  if (branch && !/^[\w./-]{1,100}$/.test(branch)) {
    return sendJson(res, 400, { error: 'invalid branch name' })
  }
  // Optional GitHub token for private repos (classic ghp_… or fine-grained
  // github_pat_…). Passed to the engine via env so it never lands in argv/logs.
  if (token != null && !/^[A-Za-z0-9_]{20,300}$/.test(token)) {
    return sendJson(res, 400, { error: 'invalid token' })
  }
  // Optional real build-time env (PUBLIC client-side values only, e.g.
  // NEXT_PUBLIC_*/VITE_*) the engine bakes into the image so client bundles get
  // real values instead of placeholders. Passed via env, never argv.
  let buildEnvJson = ''
  if (buildEnv != null) {
    if (typeof buildEnv !== 'object' || Array.isArray(buildEnv)) {
      return sendJson(res, 400, { error: 'buildEnv must be an object of KEY: value' })
    }
    const clean = {}
    for (const [k, v] of Object.entries(buildEnv)) {
      if (!VALID_ENV_KEY.test(k)) {
        return sendJson(res, 400, { error: `invalid buildEnv key: ${k}` })
      }
      clean[k] = v == null ? '' : String(v)
    }
    if (Object.keys(clean).length) buildEnvJson = JSON.stringify(clean)
  }

  // Stream the build as it happens so the website can show live logs.
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' })

  const args = [ENGINE, '--repo', repo, '--name', name]
  if (branch) args.push('--branch', branch)

  const child = spawn(process.execPath, args, {
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      ...(token ? { GH_TOKEN: token } : {}),
      ...(buildEnvJson ? { FLOWSTAS_BUILD_ENV: buildEnvJson } : {}),
    },
  })

  child.stdout.on('data', (d) => res.write(d))
  child.stderr.on('data', (d) => res.write(d))

  child.on('close', (code) => {
    const result =
      code === 0
        ? { ok: true, url: `https://${name}.fly.dev/` }
        : { ok: false, error: `build failed (exit ${code})` }
    res.end(`\nFLOWSTAS_RESULT ${JSON.stringify(result)}\n`)
  })

  child.on('error', (err) => {
    res.end(`\nFLOWSTAS_RESULT ${JSON.stringify({ ok: false, error: err.message })}\n`)
  })

  // If the website hangs up, don't leave a build running headless.
  req.on('close', () => {
    if (!child.killed) child.kill('SIGTERM')
  })
})

server.listen(PORT, () => {
  console.log(`Flowstas build worker listening on :${PORT}`)
  if (!WORKER_TOKEN) console.warn('WARNING: WORKER_TOKEN is empty — refusing all deploys.')
})
