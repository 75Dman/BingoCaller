#!/usr/bin/env node
// tools/predeploy-scan.js
// Lightweight predeploy scan: checks for common secrets, tracked .env files, large files, and optionally runs tests/audit.

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = process.cwd()
const IGNORES = new Set(['node_modules', '.git', '.github', 'dist', 'build', 'coverage'])
const LARGE_FILE_BYTES = 2 * 1024 * 1024 // 2MB

const secretPatterns = [
  /AKIA[0-9A-Z]{16}/i,
  /AIza[0-9A-Za-z-_]{35}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /ssh-rsa\s+/i,
  /sk_live_[0-9a-zA-Z_-]{16,}/i,
  /xox[pboa]-/i,
  /client_secret\s*[:=]/i,
  /api[_-]?key\s*[:=]/i,
  // require at least 20 chars for bearer tokens to avoid matching "bearer tokens" descriptive text
  /\bbearer\s+[A-Za-z0-9\-_.=]{20,}\b/i,
  /password\s*[:=]\s*['\"]/i
]

function log(...args){ console.log('[predeploy-scan]', ...args) }

function isBinary(buf){
  for (let i = 0; i < Math.min(buf.length, 512); i++) if (buf[i] === 0) return true
  return false
}

function walk(dir, cb){
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries){
    if (IGNORES.has(e.name)) continue
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, cb)
    else if (e.isFile()) cb(full)
  }
}

let secretHits = []
let largeFiles = []

log('Scanning files for secrets and large files...')
walk(ROOT, (file) => {
  try {
    const rel = path.relative(ROOT, file)
    // skip package-lock and yarn.lock? No — still useful to scan
    // Skip binary files
    const stat = fs.statSync(file)
    if (stat.size > LARGE_FILE_BYTES) largeFiles.push({ path: rel, size: stat.size })

    const buf = fs.readFileSync(file)
    if (isBinary(buf)) return
    const s = buf.toString('utf8')
    for (const r of secretPatterns){
      const m = s.match(r)
      if (m){
        secretHits.push({ file: rel, pattern: r.toString(), match: m[0].slice(0, 200) })
      }
    }
  } catch (err){ /* ignore read errors */ }
})

// Check for tracked .env files
let envFiles = []
try{
  const gitFiles = execSync('git ls-files', { encoding: 'utf8' })
  gitFiles.split(/\r?\n/).forEach(line => {
    if (!line) return
    const base = path.basename(line)
    if (base.startsWith('.env')) envFiles.push(line)
  })
} catch (err){ /* not a git repo or git missing */ }

// Optionally run npm test (single-run by setting CI=true) if a test script exists
let testFailed = false
let ranTests = false
try{
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'))
  if (pkg.scripts && pkg.scripts.test){
    log('Running `npm test` (single-run, CI=true)')
    try{
      // capture output so we can detect 'No tests found' (which exits with code 1 in some setups)
      execSync('npm test --silent', { encoding: 'utf8', env: { ...process.env, CI: 'true' } })
      ranTests = true
    } catch (err){
      const stdout = err.stdout ? String(err.stdout) : ''
      const stderr = err.stderr ? String(err.stderr) : ''
      if (stdout.includes('No tests found') || stderr.includes('No tests found')){
        // Treat as OK — no tests present
        log('No tests found (treating as OK).')
        ranTests = false
      } else {
        ranTests = true
        testFailed = true
      }
    }
  }
} catch (err){ /* ignore */ }

// Optionally run npm audit --audit-level=moderate if npm present
let auditFailed = false
let ranAudit = false
try{
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT,'package.json'),'utf8'))
  if (pkg.dependencies || pkg.devDependencies){
    log('Running `npm audit --audit-level=moderate` (this may take a moment)')
    ranAudit = true
    try{
      execSync('npm audit --audit-level=moderate', { stdio: 'inherit' })
    } catch (err){ auditFailed = true }
  }
} catch (err){ /* ignore */ }

// Summarize
let failed = false
console.log('')
if (secretHits.length){
  failed = true
  console.error('Potential secrets found:')
  secretHits.slice(0, 20).forEach(h => console.error(`  - ${h.file}: ${h.pattern} -> ${h.match}`))
  if (secretHits.length > 20) console.error(`  ...and ${secretHits.length-20} more matches`)
}

if (envFiles.length){
  failed = true
  console.error('Tracked .env files found in repository:')
  envFiles.forEach(f => console.error(`  - ${f}`))
}

if (largeFiles.length){
  console.warn('Large files (>2MB) detected:')
  largeFiles.sort((a,b)=>b.size-a.size).slice(0, 20).forEach(f => console.warn(`  - ${f.path}: ${(f.size/1024/1024).toFixed(2)} MB`))
}

if (ranTests && testFailed){
  failed = true
  console.error('`npm test` failed. Fix tests before deploying.')
}
if (ranAudit && auditFailed){
  // Report audit findings as warnings only — do not block deploys automatically.
  console.warn('`npm audit` reported issues (audit exit non-zero). This check is non-blocking; review and fix vulnerabilities as needed.')
}


if (failed){
  console.error('\nPredeploy scan FAILED. Please resolve the issues above before deploying.\n')
  process.exit(2)
}

console.log('Predeploy scan OK — no obvious secrets, tracked .env files, or failing checks found.')
process.exit(0)
