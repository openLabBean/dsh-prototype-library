/**
 * 原型库 — Host half.
 *
 * 一个 Host 插件，在 DSH web server 上提供 /prototype-library/api/*：
 *   - 原型注册表（本地目录、名称、归属项目、缩略图）
 *   - Git 只读状态 / 分支 / 切换 / 新建 / fetch / init / commit / push
 *   - 前端原型运行时（Vite dev server 或静态托管）的启动、探活、停止与日志
 *   - 缩略图：目录内图片、上传、headless Chrome 截图
 *
 * 所有状态持久化在 $DSH_HOME/prototype-library/，插件重载后保留。
 */

import { createServer } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { promises as fsp, existsSync, createReadStream } from 'node:fs'
import { join, resolve, relative, extname, basename, dirname, sep } from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'

const ROUTE_PREFIX = '/prototype-library/api'
const PROVIDER_NAME = 'prototype-library'
const START_TIMEOUT_MS = 40000
const INSTALL_TIMEOUT_MS = 10 * 60 * 1000
const FOREIGN_LOCKFILES = ['pnpm-lock.yaml', 'yarn.lock', 'bun.lockb']
const MAX_BODY = 1024 * 1024
const MAX_THUMB_BODY = 9 * 1024 * 1024
const MAX_THUMB_BYTES = 8 * 1024 * 1024
const LOG_LIMIT_BYTES = 2 * 1024 * 1024
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.ts': 'text/javascript; charset=utf-8',
  '.tsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

const execFileAsync = promisify(execFile)

// ── module state ────────────────────────────────────────────────────────────

let ctxRef = null
let dataDir = ''
let registryFile = ''
let serversFile = ''
let thumbsDir = ''
let logsDir = ''
let tmpDir = ''
let registry = { version: 1, prototypes: [] }
let runtime = new Map()
let gitVersion = ''
let chromePath = ''
let saveChain = Promise.resolve()
const queues = new Map()
const inspectedDirs = new Set()

// ── errors ──────────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function fail(status, code, message, details) {
  throw new ApiError(status, code, message, details)
}

function asApiError(error) {
  if (error instanceof ApiError) return error
  const wrapped = new ApiError(500, 'INTERNAL', error instanceof Error ? error.message : String(error))
  return wrapped
}

// ── tiny utilities ──────────────────────────────────────────────────────────

function nowIso() {
  return new Date().toISOString()
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function firstLine(text) {
  return String(text || '').split('\n').map((line) => line.trim()).filter(Boolean)[0] || ''
}

function truncate(text, max) {
  const value = String(text || '')
  return value.length > max ? value.slice(0, max) + '…' : value
}

function queue(key, fn) {
  const previous = queues.get(key) || Promise.resolve()
  const next = previous.then(fn, fn)
  queues.set(key, next.catch(() => {}))
  return next
}

async function readJson(file, fallback) {
  try {
    const raw = await fsp.readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function writeJsonAtomic(file, value) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`
  await fsp.writeFile(temp, JSON.stringify(value, null, 2), 'utf8')
  await fsp.rename(temp, file)
}

function saveRegistry() {
  saveChain = saveChain
    .then(() => writeJsonAtomic(registryFile, registry))
    .catch((error) => console.error('[prototype-library] 保存注册表失败', error))
  return saveChain
}

async function saveServers() {
  const items = []
  for (const [id, rt] of runtime) {
    if (rt && rt.pid) items.push({ id, pid: rt.pid, port: rt.port })
  }
  await writeJsonAtomic(serversFile, { items }).catch(() => {})
}

function mimeFor(file) {
  return MIME[extname(file).toLowerCase()] || 'application/octet-stream'
}

function isLoopback(request) {
  const address = request.socket && request.socket.remoteAddress
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
}

function sendJson(response, status, value) {
  const body = Buffer.from(JSON.stringify(value), 'utf8')
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': body.length,
    'cache-control': 'no-store',
  })
  response.end(body)
}

async function readBody(request, limit = MAX_BODY) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > limit) fail(413, 'BODY_TOO_LARGE', '请求体过大')
    chunks.push(chunk)
  }
  if (size === 0) return {}
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(400, 'BAD_JSON', '请求体必须是 JSON 对象')
    return parsed
  } catch (error) {
    if (error instanceof ApiError) throw error
    fail(400, 'BAD_JSON', '请求体不是合法 JSON')
  }
}

function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function killGroup(pid, signal) {
  try {
    process.kill(-pid, signal)
  } catch {
    try {
      process.kill(pid, signal)
    } catch {
      /* already gone */
    }
  }
}

// ── data dir / registry ─────────────────────────────────────────────────────

function resolveHome() {
  const fromEnv = process.env.DSH_HOME
  if (fromEnv && String(fromEnv).trim() !== '') return String(fromEnv)
  return join(homedir(), '.dsh')
}

async function initState() {
  dataDir = join(resolveHome(), PROVIDER_NAME)
  registryFile = join(dataDir, 'registry.json')
  serversFile = join(dataDir, 'servers.json')
  thumbsDir = join(dataDir, 'thumbnails')
  logsDir = join(dataDir, 'logs')
  tmpDir = join(dataDir, 'tmp')
  await Promise.all([
    fsp.mkdir(dataDir, { recursive: true }),
    fsp.mkdir(thumbsDir, { recursive: true }),
    fsp.mkdir(logsDir, { recursive: true }),
    fsp.mkdir(tmpDir, { recursive: true }),
  ])
  const raw = await readJson(registryFile, { version: 1, prototypes: [] })
  registry = {
    version: 1,
    prototypes: Array.isArray(raw && raw.prototypes) ? raw.prototypes.filter(isPrototypeRecord) : [],
  }
}

function isPrototypeRecord(value) {
  return Boolean(value && typeof value === 'object' && typeof value.id === 'string' && typeof value.dir === 'string')
}

function requirePrototype(id) {
  const found = registry.prototypes.find((item) => item.id === id)
  if (!found) fail(404, 'NOT_FOUND', `原型不存在：${id}`)
  return found
}

function thumbnailUrl(prototype) {
  if (!prototype.thumbnail) return null
  const version = encodeURIComponent(prototype.updatedAt || '')
  return `${ROUTE_PREFIX}/prototypes/${prototype.id}/thumbnail?v=${version}`
}

function viewOf(prototype) {
  return { ...prototype, thumbnailUrl: thumbnailUrl(prototype) }
}

function publicRuntime(rt) {
  if (!rt) return null
  return {
    status: rt.status,
    port: rt.port,
    url: rt.url,
    pid: rt.pid ?? null,
    startedAt: rt.startedAt ?? null,
    error: rt.error ?? null,
    installing: Boolean(rt.installing),
    deps: rt.deps ?? null,
  }
}

function projectList() {
  const seen = new Set()
  const result = []
  for (const prototype of registry.prototypes) {
    const project = hasText(prototype.project) ? prototype.project : '未分组'
    if (seen.has(project)) continue
    seen.add(project)
    result.push(project)
  }
  return result
}

// ── directory inspection ────────────────────────────────────────────────────

async function normalizeDirectory(input) {
  if (!hasText(input)) fail(400, 'BAD_PATH', '请填写原型目录的绝对路径')
  let value = input.trim()
  if (value === '~') value = homedir()
  else if (value.startsWith('~/')) value = join(homedir(), value.slice(2))
  if (!value.startsWith('/')) fail(400, 'BAD_PATH', '请填写绝对路径（例如 /Users/you/work/prototype）')
  let stat
  try {
    stat = await fsp.stat(value)
  } catch {
    fail(400, 'BAD_PATH', `目录不存在：${value}`)
  }
  if (!stat.isDirectory()) fail(400, 'BAD_PATH', `不是目录：${value}`)
  let real = value
  try {
    real = await fsp.realpath(value)
  } catch {
    /* keep input */
  }
  return real
}

function parsePortFlag(text) {
  const match = /(?:^|\s)--port(?:=|\s+)(\d{2,5})/.exec(String(text || ''))
  if (!match) return null
  const port = Number(match[1])
  return Number.isInteger(port) && port > 1024 && port < 65536 ? port : null
}

async function inspectDirectory(dir) {
  const packageFile = join(dir, 'package.json')
  let pkg = null
  if (existsSync(packageFile)) {
    try {
      pkg = JSON.parse(await fsp.readFile(packageFile, 'utf8'))
    } catch {
      pkg = null
    }
  }
  const dev = pkg && pkg.scripts && typeof pkg.scripts.dev === 'string' ? pkg.scripts.dev : ''
  const dependencies = { ...(pkg && pkg.dependencies), ...(pkg && pkg.devDependencies) }
  const viteBin = join(dir, 'node_modules', '.bin', 'vite')
  const hasIndex = existsSync(join(dir, 'index.html'))
  const isVite = Boolean(dependencies.vite) || /\bvite\b/.test(dev) || existsSync(viteBin)
  let kind = 'unknown'
  if (dev) kind = isVite ? 'vite' : 'node'
  else if (hasIndex) kind = 'static'

  const hasGit = existsSync(join(dir, '.git'))
  let branch = null
  let repoUrl = ''
  if (hasGit) {
    const branchRes = await execGit(dir, ['symbolic-ref', '--short', '-q', 'HEAD'])
    branch = branchRes.ok ? branchRes.stdout.trim() : null
    const remoteRes = await execGit(dir, ['remote', 'get-url', 'origin'])
    repoUrl = remoteRes.ok ? remoteRes.stdout.trim() : ''
  }

  return {
    path: dir,
    name: (pkg && typeof pkg.name === 'string' && pkg.name) || basename(dir),
    packageName: (pkg && typeof pkg.name === 'string' && pkg.name) || '',
    kind,
    command: dev,
    port: parsePortFlag(dev),
    repoUrl,
    hasGit,
    branch,
    hasIndex,
    images: await findImages(dir),
    gitignoreMissing: !existsSync(join(dir, '.gitignore')),
  }
}

async function findImages(dir) {
  const folders = ['.', 'shots', 'screenshots', 'screenshot', 'preview', 'design', 'docs']
  const found = []
  for (const folder of folders) {
    const target = folder === '.' ? dir : join(dir, folder)
    let entries
    try {
      entries = await fsp.readdir(target, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (!IMAGE_EXT.has(extname(entry.name).toLowerCase())) continue
      const file = join(target, entry.name)
      let stat = null
      try {
        stat = await fsp.stat(file)
      } catch {
        continue
      }
      found.push({
        path: file,
        rel: relative(dir, file),
        name: entry.name,
        size: stat.size,
        mtime: stat.mtimeMs,
      })
    }
  }
  found.sort((a, b) => b.mtime - a.mtime)
  return found.slice(0, 30)
}

async function validateRepoUrl(value) {
  const url = String(value || '').trim()
  if (url === '') return ''
  if (url.length > 600) fail(400, 'BAD_REMOTE', '仓库地址过长')
  if (/[\s"'`]/.test(url) || url.startsWith('-')) fail(400, 'BAD_REMOTE', '仓库地址包含非法字符')
  if (!/^(https?:\/\/|ssh:\/\/|git:\/\/|git@[^\s:]+:)/.test(url)) {
    fail(400, 'BAD_REMOTE', '仓库地址需以 https://、ssh://、git:// 或 git@host:path 开头')
  }
  return url
}

// ── git ─────────────────────────────────────────────────────────────────────

async function execGit(cwd, args, options = {}) {
  const timeout = options.timeout ?? 120000
  try {
    const result = await execFileAsync('git', args, {
      cwd,
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' },
    })
    return { ok: true, code: 0, stdout: result.stdout || '', stderr: result.stderr || '' }
  } catch (error) {
    return {
      ok: false,
      code: typeof error.code === 'number' ? error.code : -1,
      stdout: error.stdout || '',
      stderr: error.stderr || (error instanceof Error ? error.message : String(error)),
      killed: Boolean(error.killed),
    }
  }
}

function parsePorcelain(raw) {
  const parts = String(raw || '').split('\0')
  const changed = []
  let total = 0
  let untracked = 0
  for (let index = 0; index < parts.length; index += 1) {
    const entry = parts[index]
    if (!entry || entry.length < 3) continue
    const code = entry.slice(0, 2)
    let file = entry.slice(3)
    if (code[0] === 'R' || code[0] === 'C') {
      index += 1
      file = `${file} → ${parts[index] || ''}`
    }
    total += 1
    if (code === '??') untracked += 1
    if (changed.length < 40) changed.push({ code, path: file })
  }
  return { changed, total, untracked, tracked: total - untracked }
}

async function gitStatus(dir) {
  if (!existsSync(join(dir, '.git'))) {
    return {
      hasGit: false,
      missing: !existsSync(dir),
      branch: null,
      detached: false,
      hasCommits: false,
      changed: [],
      changedCount: 0,
      dirtyCount: 0,
      untrackedCount: 0,
      ahead: 0,
      behind: 0,
      hasUpstream: false,
      lastCommit: null,
      remoteUrl: '',
      gitignoreMissing: !existsSync(join(dir, '.gitignore')),
    }
  }
  const branchRes = await execGit(dir, ['symbolic-ref', '--short', '-q', 'HEAD'], { timeout: 15000 })
  const branch = branchRes.ok ? branchRes.stdout.trim() || null : null
  const headRes = await execGit(dir, ['rev-parse', '--verify', 'HEAD'], { timeout: 15000 })
  const hasCommits = headRes.ok
  const statusRes = await execGit(dir, ['status', '--porcelain=v1', '-z'], { timeout: 30000 })
  const parsed = parsePorcelain(statusRes.stdout)
  let ahead = 0
  let behind = 0
  let hasUpstream = false
  if (hasCommits && branch) {
    const upstream = await execGit(dir, ['rev-list', '--left-right', '--count', '@{u}...HEAD'], { timeout: 15000 })
    if (upstream.ok) {
      const [left, right] = upstream.stdout.trim().split(/\s+/)
      behind = Number(left) || 0
      ahead = Number(right) || 0
      hasUpstream = true
    }
  }
  let lastCommit = null
  if (hasCommits) {
    const logRes = await execGit(dir, ['log', '-1', '--format=%h%x00%s%x00%cI'], { timeout: 15000 })
    if (logRes.ok) {
      const [hash, subject, date] = logRes.stdout.split('\0')
      lastCommit = {
        hash: (hash || '').trim(),
        subject: (subject || '').trim(),
        date: (date || '').trim(),
      }
    }
  }
  const remoteRes = await execGit(dir, ['remote', 'get-url', 'origin'], { timeout: 15000 })
  return {
    hasGit: true,
    missing: false,
    branch,
    detached: !branch && hasCommits,
    hasCommits,
    changed: parsed.changed,
    changedCount: parsed.total,
    // 只有「已跟踪文件」的改动才算脏；node_modules/.vite 这类未跟踪的构建产物
    // 不应阻止切分支，否则开发时几乎每次都会误报。
    dirtyCount: parsed.tracked,
    untrackedCount: parsed.untracked,
    ahead,
    behind,
    hasUpstream,
    lastCommit,
    remoteUrl: remoteRes.ok ? remoteRes.stdout.trim() : '',
    gitignoreMissing: !existsSync(join(dir, '.gitignore')),
  }
}

// 列表卡片读的是 registry 里缓存的 git 状态，切换分支 / 提交后必须回写，
// 否则列表页会一直显示旧分支（详情页是实时算的，所以只有列表看起来「不刷新」）。
async function applyGitCache(prototype, status) {
  if (!prototype || !status) return prototype
  const next = {
    hasGit: Boolean(status.hasGit),
    branch: status.branch || '',
    changedCount: status.changedCount || 0,
    dirtyCount: status.dirtyCount || 0,
    untrackedCount: status.untrackedCount || 0,
    ahead: status.ahead || 0,
    behind: status.behind || 0,
    lastCommit: status.lastCommit || null,
  }
  const previous = (prototype.cache && prototype.cache.git) || {}
  const same =
    Boolean(previous.hasGit) === next.hasGit &&
    (previous.branch || '') === next.branch &&
    (previous.changedCount || 0) === next.changedCount &&
    (previous.dirtyCount || 0) === next.dirtyCount &&
    (previous.untrackedCount || 0) === next.untrackedCount &&
    (previous.ahead || 0) === next.ahead &&
    (previous.behind || 0) === next.behind
  if (same) return prototype
  prototype.cache = { ...(prototype.cache || {}), git: next }
  prototype.updatedAt = nowIso()
  await saveRegistry()
  return prototype
}

async function refreshGitCache(prototype) {
  if (!prototype || !prototype.dir) return prototype
  try {
    return await applyGitCache(prototype, await gitStatus(prototype.dir))
  } catch {
    return prototype
  }
}

async function gitBranches(dir) {
  if (!existsSync(join(dir, '.git'))) return { local: [], remote: [], current: null }
  const status = await gitStatus(dir)
  const result = await execGit(
    dir,
    ['for-each-ref', '--format=%(refname:short)%00%(refname)%00%(objectname:short)%00%(committerdate:iso8601)', 'refs/heads', 'refs/remotes'],
    { timeout: 30000 },
  )
  const local = []
  const remote = []
  if (result.ok) {
    for (const line of result.stdout.split('\n')) {
      if (!line.trim()) continue
      const [short, full, hash, date] = line.split('\0')
      if (!short || !full) continue
      if (full.startsWith('refs/heads/')) {
        local.push({ name: short, short, hash: hash || '', date: date || '', remote: false, current: short === status.branch })
      } else if (full.startsWith('refs/remotes/')) {
        if (full.endsWith('/HEAD') || short.endsWith('/HEAD')) continue
        remote.push({ name: short, short: short.replace(/^[^/]+\//, ''), hash: hash || '', date: date || '', remote: true, current: false })
      }
    }
  }
  local.sort((a, b) => Number(b.current) - Number(a.current) || a.name.localeCompare(b.name))
  remote.sort((a, b) => a.name.localeCompare(b.name))
  return { local, remote, current: status.branch }
}

async function setRemote(dir, repoUrl) {
  const url = await validateRepoUrl(repoUrl)
  if (!url) return
  const current = await execGit(dir, ['remote', 'get-url', 'origin'], { timeout: 15000 })
  const args = current.ok ? ['remote', 'set-url', 'origin', url] : ['remote', 'add', 'origin', url]
  const result = await execGit(dir, args, { timeout: 30000 })
  if (!result.ok) fail(502, 'REMOTE_FAILED', '设置远程仓库失败', { stderr: truncate(result.stderr, 2000) })
}

// 当前分支把 node_modules 提交进了版本库时，切到不含它的分支会让 git 删掉这些文件。
// 自动改为：把 node_modules 从索引里移除并提交（磁盘文件保留），再继续切换。
async function untrackNodeModules(dir) {
  const preStaged = await execGit(dir, ['diff', '--cached', '--name-only', '-z'], { timeout: 30000 })
  const stagedPaths = preStaged.stdout.split('\0').filter(Boolean)
  if (preStaged.ok && stagedPaths.length > 0) {
    fail(409, 'STAGED_CHANGES', '暂存区还有其他未提交改动，请先提交或撤销后再切换分支')
  }
  const removal = await execGit(dir, ['rm', '-r', '-q', '--cached', 'node_modules'], { timeout: 180000 })
  if (!removal.ok) {
    fail(409, 'DEPS_UNTRACK_FAILED', firstLine(removal.stderr) || '无法把 node_modules 从版本库移除', {
      stderr: truncate(removal.stderr, 2000),
    })
  }
  const commit = await execGit(dir, ['commit', '-q', '--no-verify', '-m', 'chore: 停止跟踪 node_modules'], { timeout: 180000 })
  if (!commit.ok) {
    await execGit(dir, ['reset', '-q'], { timeout: 60000 })
    fail(409, 'DEPS_UNTRACK_FAILED', firstLine(commit.stderr) || '移除 node_modules 后提交失败', {
      stderr: truncate(commit.stderr, 2000),
    })
  }
  return true
}

async function switchBranch(dir, target) {
  const branch = String(target || '').trim()
  if (!branch) fail(400, 'BAD_BRANCH', '请选择分支')
  const status = await gitStatus(dir)
  if (!status.hasGit) fail(409, 'NOT_A_REPO', '该目录还不是 Git 仓库')
  if (status.branch === branch) return { branch, changed: false }
  // 只拦「已跟踪文件被改过」的情况；未跟踪文件（vite 依赖缓存、构建产物）交给 git 自己判断，
  // 目标分支要覆盖它们时 git 会拒绝，再翻译成可读的错误。
  const dirtyChanges = (status.changed || []).filter((item) => String(item.code || '').trim() !== '??')
  if (status.dirtyCount > 0) {
    fail(409, 'DIRTY_WORKTREE', '工作区有未提交改动，请先提交后再切换分支', { changed: dirtyChanges })
  }
  const branches = await gitBranches(dir)
  const local = branches.local.find((item) => item.name === branch)
  const remote = branches.remote.find((item) => item.name === branch)
  let args
  if (local) {
    args = ['switch', branch]
  } else if (remote) {
    const short = remote.short
    args = branches.local.some((item) => item.name === short)
      ? ['switch', short]
      : ['switch', '-c', short, '--track', remote.name]
  } else {
    fail(404, 'BRANCH_NOT_FOUND', `分支不存在：${branch}`)
  }
  // 有些提交把 node_modules 一起提交进了版本库（本地临时分支常见）。这种分支切到
  // 不含 node_modules 的分支时，git 会把这些依赖文件从磁盘删掉，直接把项目搞崩。
  const targetRef = local ? branch : (remote ? remote.name : branch)
  const currentDeps = await execGit(dir, ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'node_modules'], { timeout: 30000 })
  let repaired = null
  if (currentDeps.ok && currentDeps.stdout.trim()) {
    const targetDeps = await execGit(dir, ['ls-tree', '-r', '--name-only', targetRef, '--', 'node_modules'], { timeout: 30000 })
    if (targetDeps.ok && !targetDeps.stdout.trim()) {
      const count = currentDeps.stdout.trim().split('\n').length
      await untrackNodeModules(dir)
      repaired = {
        action: 'untrack-node_modules',
        files: count,
        message: `已停止跟踪 node_modules（${count} 个文件），磁盘上的依赖保持不变`,
      }
    }
  }
  const result = await execGit(dir, args, { timeout: 60000 })
  if (!result.ok) {
    const stderr = result.stderr || ''
    if (/untracked working tree files would be overwritten/i.test(stderr)) {
      fail(409, 'UNTRACKED_CONFLICT', '有未跟踪文件会被目标分支覆盖，请先移走或提交这些文件', {
        stderr: truncate(stderr, 2000),
      })
    }
    if (/local changes to the following files would be overwritten/i.test(stderr)) {
      fail(409, 'DIRTY_WORKTREE', '工作区有未提交改动，请先提交后再切换分支', { stderr: truncate(stderr, 2000) })
    }
    fail(409, 'SWITCH_FAILED', firstLine(stderr) || '切换分支失败', { stderr: truncate(stderr, 2000) })
  }
  return { branch, changed: true, repaired }
}

async function createBranch(dir, name, base) {
  const branch = String(name || '').trim()
  if (!branch) fail(400, 'BAD_BRANCH', '请填写新分支名')
  const status = await gitStatus(dir)
  if (!status.hasGit) fail(409, 'NOT_A_REPO', '该目录还不是 Git 仓库')
  const check = await execGit(dir, ['check-ref-format', '--branch', branch], { timeout: 15000 })
  if (!check.ok) fail(400, 'BAD_BRANCH', '分支名不合法（不能包含空格、~ ^ : ? * 等字符）')
  const exists = await execGit(dir, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], { timeout: 15000 })
  if (exists.ok) fail(409, 'BRANCH_EXISTS', `分支已存在：${branch}`)

  // 基点：不传或等于当前分支时沿用「从当前 HEAD 创建」的旧行为
  const wanted = String(base || '').trim()
  let startPoint = ''
  let tracking = false
  if (wanted && wanted !== status.branch) {
    const local = await execGit(dir, ['rev-parse', '--verify', '--quiet', `refs/heads/${wanted}`], { timeout: 15000 })
    if (local.ok) {
      startPoint = wanted
    } else {
      const remote = await execGit(dir, ['rev-parse', '--verify', '--quiet', `refs/remotes/${wanted}`], { timeout: 15000 })
      if (!remote.ok) fail(400, 'UNKNOWN_BASE', `找不到基点分支：${wanted}`)
      startPoint = wanted
      tracking = true
    }
  }
  const args = startPoint
    ? ['switch', '-c', branch, ...(tracking ? ['--track'] : []), startPoint]
    : ['switch', '-c', branch]
  const result = await execGit(dir, args, { timeout: 60000 })
  if (!result.ok) fail(409, 'CREATE_BRANCH_FAILED', firstLine(result.stderr) || '新建分支失败', { stderr: truncate(result.stderr, 2000) })
  return { branch, base: startPoint || status.branch, tracking }
}

async function fetchRemote(dir) {
  const status = await gitStatus(dir)
  if (!status.hasGit) fail(409, 'NOT_A_REPO', '该目录还不是 Git 仓库')
  const remote = await execGit(dir, ['remote', 'get-url', 'origin'], { timeout: 15000 })
  if (!remote.ok) fail(409, 'NO_REMOTE', '未绑定 origin 远程仓库')
  const result = await execGit(dir, ['fetch', '--prune', 'origin'], { timeout: 180000 })
  if (!result.ok) {
    const text = result.stderr || ''
    if (/Authentication failed|Permission denied|could not read Username|could not read Password/i.test(text)) {
      fail(502, 'AUTH_REQUIRED', '拉取认证失败：请检查 HTTPS 凭据或 SSH key', { stderr: truncate(text, 2000) })
    }
    fail(502, 'FETCH_FAILED', firstLine(text) || '拉取远程分支失败', { stderr: truncate(text, 2000) })
  }
  return gitBranches(dir)
}

async function initRepository(dir, body) {
  if (existsSync(join(dir, '.git'))) fail(409, 'ALREADY_REPO', '该目录已经是 Git 仓库')
  const result = await execGit(dir, ['init', '-b', 'main'], { timeout: 60000 })
  if (!result.ok) fail(500, 'INIT_FAILED', firstLine(result.stderr) || 'git init 失败')
  if (hasText(body.repoUrl)) await setRemote(dir, body.repoUrl)
  if (body.gitignore) {
    const gitignore = join(dir, '.gitignore')
    if (!existsSync(gitignore)) {
      await fsp.writeFile(gitignore, 'node_modules/\ndist/\n.DS_Store\n*.log\n', 'utf8')
    }
  }
  return gitStatus(dir)
}

async function pushInternal(dir) {
  const status = await gitStatus(dir)
  if (!status.hasGit) return { ok: false, code: 'NOT_A_REPO', message: '该目录还不是 Git 仓库' }
  if (!status.branch) return { ok: false, code: 'DETACHED_HEAD', message: '当前处于 detached HEAD，无法推送' }
  const remote = await execGit(dir, ['remote', 'get-url', 'origin'], { timeout: 15000 })
  if (!remote.ok) return { ok: false, code: 'NO_REMOTE', message: '未绑定 origin 远程仓库' }
  const result = await execGit(dir, ['push', '-u', 'origin', status.branch], { timeout: 180000 })
  if (result.ok) return { ok: true, branch: status.branch }
  const text = result.stderr || ''
  if (/Authentication failed|Permission denied|could not read Username|could not read Password|could not read from remote/i.test(text)) {
    return {
      ok: false,
      code: 'AUTH_REQUIRED',
      message: '推送认证失败：请检查 HTTPS 凭据或 SSH key',
      details: truncate(text, 3000),
    }
  }
  if (/\[rejected\]|non-fast-forward|fetch first/i.test(text)) {
    return {
      ok: false,
      code: 'PUSH_REJECTED',
      message: '远程有新的提交，请先拉取（Fetch）后再推送',
      details: truncate(text, 3000),
    }
  }
  return { ok: false, code: 'PUSH_FAILED', message: firstLine(text) || '推送失败', details: truncate(text, 3000) }
}

async function commitChanges(dir, body) {
  const message = String(body.message || '').trim()
  if (!message) fail(400, 'EMPTY_MESSAGE', '请填写提交信息')
  if (message.length > 5000) fail(400, 'MESSAGE_TOO_LONG', '提交信息过长')
  const status = await gitStatus(dir)
  if (!status.hasGit) fail(409, 'NOT_A_REPO', '该目录还不是 Git 仓库')
  const add = await execGit(dir, ['add', '-A'], { timeout: 60000 })
  if (!add.ok) fail(500, 'GIT_ADD_FAILED', firstLine(add.stderr) || 'git add 失败')
  const diff = await execGit(dir, ['diff', '--cached', '--quiet'], { timeout: 30000 })
  if (diff.ok) fail(409, 'NOTHING_TO_COMMIT', '没有可提交的变更')
  const result = await execGit(dir, ['commit', '-m', message], { timeout: 120000 })
  if (!result.ok) {
    const text = result.stderr || ''
    if (/Please tell me who you are|user\.email|user\.name/i.test(text)) {
      fail(409, 'GIT_IDENTITY_MISSING', 'Git 未配置 user.name / user.email，请先在终端配置')
    }
    fail(500, 'COMMIT_FAILED', firstLine(text) || '提交失败', { stderr: truncate(text, 3000) })
  }
  const log = await execGit(dir, ['log', '-1', '--format=%h%x00%s'], { timeout: 15000 })
  const [hash, subject] = log.ok ? log.stdout.split('\0') : ['', '']
  let push = null
  if (body.push) push = await pushInternal(dir)
  return {
    committed: true,
    hash: (hash || '').trim(),
    subject: (subject || '').trim() || message,
    push,
  }
}

// ── runtime: ports, spawn, static server ────────────────────────────────────

function canListen(port) {
  return new Promise((resolveListen) => {
    const probe = createNetServer()
    probe.unref()
    probe.once('error', () => resolveListen(false))
    probe.listen(port, '127.0.0.1', () => probe.close(() => resolveListen(true)))
  })
}

function freePort() {
  return new Promise((resolvePort, rejectPort) => {
    const probe = createNetServer()
    probe.unref()
    probe.once('error', rejectPort)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      const port = typeof address === 'object' && address ? address.port : 0
      probe.close(() => (port ? resolvePort(port) : rejectPort(new Error('无法分配端口'))))
    })
  })
}

async function choosePort(preferred) {
  const wanted = Number(preferred)
  if (Number.isInteger(wanted) && wanted > 1024 && wanted < 65536) {
    if (await canListen(wanted)) return wanted
    fail(409, 'PORT_BUSY', `端口 ${wanted} 已被占用`)
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const port = await freePort()
      if (port) return port
    } catch {
      /* retry */
    }
  }
  fail(503, 'NO_PORT', '无法分配可用端口')
}

async function probe(url, timeout = 1500) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeout), redirect: 'manual' })
    await response.arrayBuffer().catch(() => {})
    return response.status > 0 && response.status < 500
  } catch {
    return false
  }
}

async function tailLog(file, lines = 120) {
  if (!file) return ''
  try {
    const stat = await fsp.stat(file)
    const start = Math.max(0, stat.size - 200 * 1024)
    const handle = await fsp.open(file, 'r')
    try {
      const buffer = Buffer.alloc(Math.max(0, stat.size - start))
      await handle.read(buffer, 0, buffer.length, start)
      return buffer
        .toString('utf8')
        .split('\n')
        .slice(-lines)
        .join('\n')
        .trim()
    } finally {
      await handle.close()
    }
  } catch {
    return ''
  }
}

async function appendLog(file, text) {
  try {
    await fsp.appendFile(file, text)
    const stat = await fsp.stat(file)
    if (stat.size > LOG_LIMIT_BYTES) {
      await fsp.writeFile(file, text.slice(-64 * 1024), 'utf8')
    }
  } catch {
    /* logging must never fail a request */
  }
}

function runtimeFor(id) {
  return runtime.get(id) || null
}

async function waitReady(id, rt) {
  const started = Date.now()
  while (Date.now() - started < START_TIMEOUT_MS) {
    const current = runtimeFor(id)
    if (!current) fail(502, 'START_ABORTED', '启动被中断')
    if (current.status === 'error') {
      fail(502, 'START_FAILED', current.error || '启动失败', { log: await tailLog(rt.logPath, 40) })
    }
    if (await probe(rt.url)) {
      rt.status = 'running'
      return
    }
    await delay(400)
  }
  fail(502, 'START_TIMEOUT', `启动超时（${Math.round(START_TIMEOUT_MS / 1000)} 秒）`, {
    log: await tailLog(rt.logPath, 60),
  })
}

function serveStaticFile(root, request, response) {
  let pathname = '/'
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname)
  } catch {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Bad request')
    return
  }
  if (pathname === '/' || pathname === '') pathname = '/index.html'
  let file = resolve(root, '.' + pathname)
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' })
    response.end('Forbidden')
    return
  }
  const send = (target) => {
    fsp
      .stat(target)
      .then((stat) => {
        if (!stat.isFile()) throw new Error('not a file')
        response.writeHead(200, {
          'content-type': mimeFor(target),
          'content-length': stat.size,
          'cache-control': 'no-store',
        })
        if (request.method === 'HEAD') {
          response.end()
          return
        }
        createReadStream(target).pipe(response)
      })
      .catch(() => {
        if (response.headersSent) {
          response.end()
          return
        }
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        response.end('Not found')
      })
  }
  fsp
    .stat(file)
    .then((stat) => {
      if (stat.isDirectory()) {
        send(join(file, 'index.html'))
        return
      }
      send(file)
    })
    .catch(() => {
      if (!extname(file)) {
        send(join(root, 'index.html'))
        return
      }
      if (!response.headersSent) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        response.end('Not found')
      }
    })
}

async function startStatic(id, prototype, rt) {
  const server = createServer((request, response) => serveStaticFile(prototype.dir, request, response))
  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen)
    server.listen(rt.port, '127.0.0.1', resolveListen)
  })
  if (typeof server.unref === 'function') server.unref()
  rt.staticServer = server
  await appendLog(rt.logPath, `[prototype-library] 静态托管 ${prototype.dir} → ${rt.url}\n`)
}

function spawnLogging(id, command, args, options, logPath, header) {
  return fsp.open(logPath, 'a').then((handle) => {
    const child = spawn(command, args, {
      ...options,
      detached: true,
      stdio: ['ignore', handle.fd, handle.fd],
    })
    handle.close().catch(() => {})
    child.unref()
    appendLog(logPath, header).catch(() => {})
    return child
  })
}

// ── dependencies ────────────────────────────────────────────────────────────
//
// 「启动」前自动做一次依赖预检：
//   - 依赖完好 → 直接启动（秒开）
//   - node_modules 缺失 / 被清空 / 缺包 / lockfile 比安装结果新 → 自动 npm ci
//     （没有 package-lock.json 时退回 npm install）
// 依赖目录由本插件的 Host 进程（用户自己的 DSH）写入，不受外部沙箱限制。

function npmBinary() {
  const candidates = [
    join(dirname(process.execPath), 'npm'),
    '/usr/local/bin/npm',
    '/opt/homebrew/bin/npm',
    '/usr/bin/npm',
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return 'npm'
}

async function readPackageJson(dir) {
  try {
    const raw = await fsp.readFile(join(dir, 'package.json'), 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

async function fileMtime(file) {
  try {
    const stat = await fsp.stat(file)
    return stat.mtimeMs
  } catch {
    return 0
  }
}

function declaredDependencies(pkg) {
  const names = new Set()
  for (const field of ['dependencies', 'devDependencies']) {
    const group = pkg && pkg[field]
    if (!group || typeof group !== 'object') continue
    for (const name of Object.keys(group)) names.add(name)
  }
  return [...names]
}

function hasInstalledPackage(dir, name) {
  return existsSync(join(dir, 'node_modules', ...String(name).split('/')))
}

async function checkDependencies(dir) {
  const pkg = await readPackageJson(dir)
  if (!pkg) return { applicable: false, reason: 'NO_PACKAGE_JSON' }
  const dev = pkg.scripts && typeof pkg.scripts === 'object' ? pkg.scripts.dev : ''
  if (!hasText(dev)) return { applicable: false, reason: 'NO_DEV_SCRIPT' }
  const lockPath = join(dir, 'package-lock.json')
  const markerPath = join(dir, 'node_modules', '.package-lock.json')
  const hasLock = existsSync(lockPath)
  const foreignLock = FOREIGN_LOCKFILES.find((name) => existsSync(join(dir, name)))
  if (!hasLock && foreignLock) {
    return {
      applicable: false,
      reason: 'FOREIGN_LOCKFILE',
      note: `检测到 ${foreignLock}，跳过自动安装：请先用对应包管理器安装依赖`,
    }
  }
  const names = declaredDependencies(pkg)
  const reasons = []
  if (!existsSync(join(dir, 'node_modules'))) {
    reasons.push('node_modules 不存在')
  } else {
    if (!existsSync(markerPath)) reasons.push('node_modules 不完整（缺少 .package-lock.json）')
    const missing = names.filter((name) => !hasInstalledPackage(dir, name))
    if (missing.length > 0) {
      const listed = missing.slice(0, 6).join('、')
      reasons.push(`缺少依赖：${listed}${missing.length > 6 ? ` 等 ${missing.length} 个` : ''}`)
    }
    if (/\bvite\b/.test(String(dev)) && !existsSync(join(dir, 'node_modules', '.bin', 'vite'))) {
      reasons.push('缺少 vite 可执行文件')
    }
    if (hasLock && existsSync(markerPath)) {
      const [lockMtime, markerMtime] = await Promise.all([fileMtime(lockPath), fileMtime(markerPath)])
      if (lockMtime && markerMtime && lockMtime > markerMtime + 1500) reasons.push('package-lock.json 比已安装的依赖更新')
    }
  }
  return { applicable: true, install: reasons.length > 0, reasons, hasLock, packages: names.length }
}

async function installDependencies(id, prototype, rt, check) {
  const dir = prototype.dir
  const bin = npmBinary()
  const env = {
    ...process.env,
    PATH: [dirname(process.execPath), join(dir, 'node_modules', '.bin'), process.env.PATH || ''].filter(Boolean).join(':'),
    BROWSER: 'none',
    NO_COLOR: '1',
    FORCE_COLOR: '0',
    CI: '1',
  }
  // 有 lockfile 时优先 npm ci（可复现、会清掉坏的 node_modules）；失败且是 lock 不一致才退回 npm install。
  const plans = check && check.hasLock ? ['ci', 'install'] : ['install']
  const reasonText = check && check.reasons && check.reasons.length > 0 ? check.reasons.join('；') : '强制重新安装依赖'
  rt.installing = true
  try {
    for (let index = 0; index < plans.length; index += 1) {
      const mode = plans[index]
      const args = mode === 'ci' ? ['ci', '--no-audit', '--no-fund'] : ['install', '--no-audit', '--no-fund']
      await appendLog(rt.logPath, `\n[prototype-library] ${nowIso()} 安装依赖（${reasonText}）：${bin} ${args.join(' ')}\n`)
      const started = Date.now()
      try {
        const result = await execFileAsync(bin, args, {
          cwd: dir,
          env,
          timeout: INSTALL_TIMEOUT_MS,
          maxBuffer: 64 * 1024 * 1024,
        })
        const output = `${result.stdout || ''}${result.stderr || ''}`.trim()
        if (output) await appendLog(rt.logPath, `${truncate(output, 128 * 1024)}\n`)
        const elapsedMs = Date.now() - started
        await appendLog(rt.logPath, `[prototype-library] 依赖安装完成（npm ${mode}），耗时 ${(elapsedMs / 1000).toFixed(1)} 秒\n`)
        return { installed: true, mode, elapsedMs }
      } catch (error) {
        const detail = [error && error.stdout, error && error.stderr, error && error.message].filter(Boolean).join('\n')
        await appendLog(rt.logPath, `${truncate(detail, 128 * 1024)}\n`)
        const outOfSync = /EUSAGE|can only install packages when your package\.json|lock\s*file.*(?:out of sync|不一致)|Missing:.*from lock file/i.test(detail)
        if (mode === 'ci' && outOfSync && index + 1 < plans.length) {
          await appendLog(rt.logPath, '[prototype-library] package-lock.json 与 package.json 不一致，改用 npm install 重试\n')
          continue
        }
        const message = firstLine(String((error && error.message) || 'npm 执行失败'))
        throw new ApiError(500, 'DEPS_INSTALL_FAILED', `依赖安装失败：${message}`, {
          log: await tailLog(rt.logPath, 60),
        })
      }
    }
  } finally {
    rt.installing = false
  }
  fail(500, 'DEPS_INSTALL_FAILED', '依赖安装失败')
}

async function startDev(id, prototype, info, rt) {
  const port = rt.port
  const localBin = join(prototype.dir, 'node_modules', '.bin')
  let command = ''
  let args = []
  if (hasText(prototype.command) && info.kind === 'vite') {
    // package.json 的 dev 脚本通常自带固定端口；去掉后强制使用本次分配的空闲端口，
    // 否则 5190/5191 被占用时启动必然失败。
    const script = prototype.command
      .replace(/(?:^|\s)--port(?:=|\s+)\d+/g, '')
      .replace(/(?:^|\s)--host(?:=|\s+)\S+/g, '')
      .trim()
    command = '/bin/sh'
    args = ['-lc', `${script} --host 127.0.0.1 --port ${port} --strictPort`]
  } else if (hasText(prototype.command)) {
    command = '/bin/sh'
    args = ['-lc', prototype.command]
  } else if (info.kind === 'vite' && existsSync(join(localBin, 'vite'))) {
    command = join(localBin, 'vite')
    args = ['--host', '127.0.0.1', '--port', String(port), '--strictPort']
  } else {
    command = npmBinary()
    args = ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort']
  }
  const header = `\n[prototype-library] ${new Date().toISOString()} ${command} ${args.join(' ')}\n`
  const child = await spawnLogging(
    id,
    command,
    args,
    {
      cwd: prototype.dir,
      env: {
        ...process.env,
        // GUI 进程的 PATH 往往只有系统目录；补上当前 node 所在目录，保证 `env node` 能找到解释器
        PATH: `${dirname(process.execPath)}:${localBin}:${process.env.PATH || ''}`,
        BROWSER: 'none',
        NO_COLOR: '1',
        FORCE_COLOR: '0',
        PORT: String(port),
      },
    },
    rt.logPath,
    header,
  )
  rt.pid = child.pid
  child.on('exit', (code, signal) => {
    const current = runtimeFor(id)
    if (!current || current.pid !== child.pid) return
    current.pid = null
    if (current.status === 'running' || current.status === 'starting') {
      current.status = code === 0 ? 'stopped' : 'error'
      if (code !== 0 && !current.error) current.error = `进程退出（${code ?? signal}）`
    }
    saveServers().catch(() => {})
  })
  await saveServers()
}

async function startPrototype(id, body) {
  return queue(id, async () => {
    const prototype = requirePrototype(id)
    const current = runtimeFor(id)
    if (current && (current.status === 'running' || current.status === 'starting')) return publicRuntime(current)
    if (current) await stopInternal(id)
    const info = await inspectDirectory(prototype.dir)
    if (info.kind === 'unknown') fail(400, 'UNKNOWN_PROJECT', '未能识别启动方式：没有 dev 脚本，也没有 index.html')
    const port = await choosePort(body && body.port)
    prototype.kind = info.kind
    prototype.port = port
    prototype.updatedAt = nowIso()
    const rt = {
      id,
      status: 'starting',
      port,
      url: `http://127.0.0.1:${port}/`,
      pid: null,
      startedAt: nowIso(),
      error: null,
      logPath: join(logsDir, `${id}.log`),
      staticServer: null,
    }
    runtime.set(id, rt)
    await saveRegistry()
    try {
      if (info.kind === 'static' && !hasText(prototype.command)) {
        await startStatic(id, prototype, rt)
      } else {
        const deps = await checkDependencies(prototype.dir)
        const forceReinstall = Boolean(body && body.reinstall === true)
        if (!deps.applicable && info.kind === 'vite' && !existsSync(join(prototype.dir, 'node_modules', '.bin', 'vite'))) {
          fail(400, 'DEPS_MISSING', deps.note || 'node_modules 里没有 vite，请先安装依赖（npm ci）')
        }
        if (deps.applicable && (deps.install || forceReinstall)) {
          rt.deps = { status: 'installing', reasons: deps.reasons }
          rt.deps = await installDependencies(id, prototype, rt, deps)
        } else if (deps.applicable) {
          rt.deps = { status: 'ready', packages: deps.packages }
        } else {
          rt.deps = { status: 'skipped', reason: deps.reason, note: deps.note || null }
        }
        await startDev(id, prototype, info, rt)
      }
      await waitReady(id, rt)
      await saveServers()
      return publicRuntime(rt)
    } catch (error) {
      const apiError = asApiError(error)
      rt.status = 'error'
      rt.error = apiError.message
      await stopInternal(id, { keepError: true })
      runtime.set(id, rt)
      throw apiError
    }
  })
}

async function stopInternal(id, options = {}) {
  const rt = runtime.get(id)
  if (!rt) return null
  if (rt.staticServer) {
    await new Promise((resolveClose) => {
      try {
        rt.staticServer.close(() => resolveClose())
      } catch {
        resolveClose()
      }
    })
    rt.staticServer = null
  }
  if (rt.pid) {
    const pid = rt.pid
    await killGroup(pid, 'SIGTERM')
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (!isAlive(pid)) break
      await delay(200)
    }
    if (isAlive(pid)) await killGroup(pid, 'SIGKILL')
    rt.pid = null
  }
  runtime.delete(id)
  await saveServers()
  if (!options.keepError) await appendLog(rt.logPath, `[prototype-library] 已停止 ${nowIso()}\n`)
  return rt
}

async function stopAll() {
  const ids = [...runtime.keys()]
  for (const id of ids) {
    try {
      await stopInternal(id, { keepError: true })
    } catch (error) {
      console.error('[prototype-library] 停止运行时失败', error)
    }
  }
}

async function cleanupOrphans() {
  const previous = await readJson(serversFile, { items: [] })
  const items = Array.isArray(previous && previous.items) ? previous.items : []
  for (const item of items) {
    if (!item || !Number.isInteger(item.pid) || item.pid <= 1) continue
    try {
      const ps = await execFileAsync('ps', ['-p', String(item.pid), '-o', 'command='], { timeout: 5000 })
      const command = String(ps.stdout || '')
      if (!/vite|npm|node/.test(command)) continue
      await killGroup(item.pid, 'SIGKILL')
    } catch {
      /* process already gone or not ours */
    }
  }
  await writeJsonAtomic(serversFile, { items: [] }).catch(() => {})
}

// ── thumbnails ──────────────────────────────────────────────────────────────

async function findChrome() {
  const candidates = [
    process.env.DSH_CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  try {
    const base = join(homedir(), 'Library', 'Caches', 'ms-playwright')
    const entries = await fsp.readdir(base, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || !/^chromium/.test(entry.name)) continue
      const root = join(base, entry.name)
      for (const relativePath of [
        'chrome-mac/headless_shell',
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        'chrome-linux/headless_shell',
        'chrome-linux/chrome',
      ]) {
        const candidate = join(root, relativePath)
        if (existsSync(candidate)) return candidate
      }
    }
  } catch {
    /* no playwright cache */
  }
  return ''
}

function sniffImage(buffer) {
  if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: 'png', mime: 'image/png' }
  }
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' }
  }
  if (
    buffer.length > 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' }
  }
  return null
}

async function removeStoredThumbnail(prototype) {
  if (!prototype.thumbnail || prototype.thumbnail.kind !== 'store' || !prototype.thumbnail.file) return
  try {
    await fsp.unlink(join(thumbsDir, prototype.thumbnail.file))
  } catch {
    /* already gone */
  }
}

async function setThumbnailFromPath(prototype, inputPath) {
  const value = String(inputPath || '').trim()
  if (!value) fail(400, 'BAD_THUMBNAIL', '请选择图片路径')
  const absolute = value.startsWith('/') ? value : join(prototype.dir, value)
  let real
  try {
    real = await fsp.realpath(absolute)
  } catch {
    fail(400, 'BAD_THUMBNAIL', `图片不存在：${value}`)
  }
  if (real !== prototype.dir && !real.startsWith(prototype.dir + sep)) {
    fail(400, 'BAD_THUMBNAIL', '只能选择原型目录内的图片')
  }
  if (!IMAGE_EXT.has(extname(real).toLowerCase())) fail(400, 'BAD_THUMBNAIL', '仅支持 png / jpg / webp')
  await removeStoredThumbnail(prototype)
  prototype.thumbnail = { kind: 'file', path: real }
  prototype.updatedAt = nowIso()
  await saveRegistry()
  return viewOf(prototype)
}

async function setThumbnailFromDataUrl(prototype, dataUrl) {
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUrl || ''))
  if (!match) fail(400, 'BAD_THUMBNAIL', '图片数据格式不支持')
  const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64')
  if (buffer.length === 0) fail(400, 'BAD_THUMBNAIL', '图片为空')
  if (buffer.length > MAX_THUMB_BYTES) fail(400, 'BAD_THUMBNAIL', '图片不能超过 8MB')
  const sniffed = sniffImage(buffer)
  if (!sniffed) fail(400, 'BAD_THUMBNAIL', '图片内容不是有效的 png / jpeg / webp')
  await removeStoredThumbnail(prototype)
  const file = `${prototype.id}.${sniffed.ext}`
  await fsp.writeFile(join(thumbsDir, file), buffer)
  prototype.thumbnail = { kind: 'store', file }
  prototype.updatedAt = nowIso()
  await saveRegistry()
  return viewOf(prototype)
}

async function captureThumbnail(prototype) {
  const rt = runtimeFor(prototype.id)
  if (!rt || rt.status !== 'running') fail(409, 'NOT_RUNNING', '请先启动预览，再自动截图')
  if (!chromePath) fail(400, 'NO_CHROME', '未找到 Chrome / Chromium，可改用上传图片')
  const workDir = join(tmpDir, `${prototype.id}-${Date.now()}`)
  await fsp.mkdir(workDir, { recursive: true })
  const shot = join(workDir, 'shot.png')
  const profile = join(workDir, 'profile')
  try {
    const child = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--window-size=1440,1000',
        '--force-device-scale-factor=1',
        '--virtual-time-budget=3500',
        `--user-data-dir=${profile}`,
        `--screenshot=${shot}`,
        rt.url,
      ],
      { stdio: 'ignore', detached: false },
    )
    const exitCode = await new Promise((resolveExit) => {
      const timer = setTimeout(() => {
        try {
          child.kill('SIGKILL')
        } catch {
          /* ignore */
        }
        resolveExit(-1)
      }, 30000)
      child.once('exit', (code) => {
        clearTimeout(timer)
        resolveExit(code ?? -1)
      })
      child.once('error', () => {
        clearTimeout(timer)
        resolveExit(-1)
      })
    })
    if (exitCode !== 0) fail(502, 'CAPTURE_FAILED', '截图进程异常退出，请确认预览可正常打开')
    let stat
    try {
      stat = await fsp.stat(shot)
    } catch {
      fail(502, 'CAPTURE_FAILED', '未生成截图文件')
    }
    if (!stat.isFile() || stat.size < 512) fail(502, 'CAPTURE_FAILED', '截图文件为空')
    if (stat.size > MAX_THUMB_BYTES) fail(400, 'BAD_THUMBNAIL', '截图超过 8MB')
    await removeStoredThumbnail(prototype)
    const file = `${prototype.id}.png`
    await fsp.copyFile(shot, join(thumbsDir, file))
    prototype.thumbnail = { kind: 'store', file }
    prototype.updatedAt = nowIso()
    await saveRegistry()
    return viewOf(prototype)
  } finally {
    fsp.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}

function isInsidePath(child, parent) {
  const rel = relative(parent, child)
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !rel.startsWith('../')
}

async function serveInspectedImage(request, response, rawPath) {
  if (!rawPath) fail(400, 'BAD_PATH', '缺少图片路径')
  const file = resolve(String(rawPath))
  const allowed =
    registry.prototypes.some((prototype) => isInsidePath(file, resolve(prototype.dir))) ||
    [...inspectedDirs].some((dir) => isInsidePath(file, dir))
  if (!allowed) fail(403, 'FORBIDDEN', '只允许读取已纳管或正在检查的原型目录内的图片')
  if (!IMAGE_EXT.has(extname(file).toLowerCase())) fail(400, 'BAD_PATH', '不支持的图片格式')
  let stat
  try {
    stat = await fsp.stat(file)
  } catch {
    fail(404, 'NOT_FOUND', '图片不存在')
  }
  if (!stat.isFile()) fail(400, 'BAD_PATH', '目标不是文件')
  const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`
  if (request.headers['if-none-match'] === etag) {
    response.writeHead(304)
    response.end()
    return
  }
  response.writeHead(200, {
    'content-type': mimeFor(file),
    'content-length': stat.size,
    'cache-control': 'no-cache',
    etag,
  })
  createReadStream(file).pipe(response)
}

async function serveThumbnail(request, response, prototype) {  if (!prototype.thumbnail) {
    sendJson(response, 404, { error: '没有缩略图', code: 'NO_THUMBNAIL' })
    return
  }
  const file =
    prototype.thumbnail.kind === 'store'
      ? join(thumbsDir, prototype.thumbnail.file || '')
      : String(prototype.thumbnail.path || '')
  let stat
  try {
    stat = await fsp.stat(file)
  } catch {
    sendJson(response, 404, { error: '缩略图文件不存在', code: 'NO_THUMBNAIL' })
    return
  }
  const etag = `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`
  if (request.headers['if-none-match'] === etag) {
    response.writeHead(304)
    response.end()
    return
  }
  response.writeHead(200, {
    'content-type': mimeFor(file),
    'content-length': stat.size,
    'cache-control': 'no-cache',
    etag,
  })
  createReadStream(file).pipe(response)
}

// ── HTTP payloads ───────────────────────────────────────────────────────────

// 置顶的排前面，其余保持原有顺序（Array.prototype.sort 稳定）
function sortPrototypes(list) {
  return [...list].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
}

async function bootstrapPayload() {
  const runtimeMap = {}
  for (const [id, rt] of runtime) runtimeMap[id] = publicRuntime(rt)
  let directoryPicker = false
  try {
    directoryPicker = Boolean(ctxRef && ctxRef.get && ctxRef.get('directoryPicker'))
  } catch {
    directoryPicker = false
  }
  return {
    prototypes: sortPrototypes(registry.prototypes).map(viewOf),
    projects: projectList(),
    runtime: runtimeMap,
    capabilities: {
      git: Boolean(gitVersion),
      gitVersion,
      chrome: Boolean(chromePath),
      directoryPicker,
      platform: process.platform,
      dataDir,
    },
  }
}

async function detailPayload(prototype, options = {}) {
  const [git, branches] = await Promise.all([gitStatus(prototype.dir), gitBranches(prototype.dir)])
  await applyGitCache(prototype, git)
  const rt = runtimeFor(prototype.id)
  const payload = {
    prototype: viewOf(prototype),
    git,
    branches,
    runtime: publicRuntime(rt),
  }
  if (options.logs) payload.logs = await tailLog(rt ? rt.logPath : join(logsDir, `${prototype.id}.log`), 200)
  return payload
}

async function createPrototype(body) {
  const dir = await normalizeDirectory(body.dir)
  if (registry.prototypes.some((item) => item.dir === dir)) {
    fail(409, 'DUPLICATE', '该目录已经纳管')
  }
  const info = await inspectDirectory(dir)
  const now = nowIso()
  const repoUrl = await validateRepoUrl(body.repoUrl || info.repoUrl || '')
  const name = String(body.name || info.name || basename(dir)).trim().slice(0, 160) || basename(dir)
  const project = String(body.project || '未分组').trim().slice(0, 80) || '未分组'
  let thumbnail = null
  if (hasText(body.thumbnailPath)) {
    const image = await validateImageCandidate(dir, body.thumbnailPath)
    if (image) thumbnail = { kind: 'file', path: image }
  }
  const prototype = {
    id: randomUUID(),
    name,
    project,
    dir,
    repoUrl,
    command: String(body.command || '').trim().slice(0, 500),
    port: info.port ?? null,
    kind: info.kind,
    thumbnail,
    createdAt: now,
    updatedAt: now,
    cache: {
      git: { hasGit: info.hasGit, branch: info.branch, lastCommit: null },
    },
  }
  registry.prototypes.unshift(prototype)
  await saveRegistry()
  if (repoUrl && info.hasGit) await setRemote(dir, repoUrl)
  return viewOf(prototype)
}

async function validateImageCandidate(dir, inputPath) {
  const value = String(inputPath || '').trim()
  if (!value) return ''
  const absolute = value.startsWith('/') ? value : join(dir, value)
  try {
    const real = await fsp.realpath(absolute)
    if (real !== dir && !real.startsWith(dir + sep)) return ''
    if (!IMAGE_EXT.has(extname(real).toLowerCase())) return ''
    const stat = await fsp.stat(real)
    return stat.isFile() ? real : ''
  } catch {
    return ''
  }
}

async function patchPrototype(prototype, body) {
  let touched = false
  if ('name' in body) {
    const name = String(body.name || '').trim()
    if (!name) fail(400, 'BAD_NAME', '名称不能为空')
    prototype.name = name.slice(0, 160)
    touched = true
  }
  if ('project' in body) {
    prototype.project = String(body.project || '').trim().slice(0, 80) || '未分组'
    touched = true
  }
  if ('command' in body) {
    prototype.command = String(body.command || '').trim().slice(0, 500)
    touched = true
  }
  if ('repoUrl' in body) {
    const url = await validateRepoUrl(body.repoUrl || '')
    prototype.repoUrl = url
    if (url && existsSync(join(prototype.dir, '.git'))) {
      await setRemote(prototype.dir, url)
    }
    touched = true
  }
  if ('pinned' in body) {
    const pinned = Boolean(body.pinned)
    if (Boolean(prototype.pinned) !== pinned) {
      prototype.pinned = pinned
      prototype.pinnedAt = pinned ? nowIso() : null
    }
    // 置顶只影响排序，不动 updatedAt，避免卡片时间显示成「刚刚」
  }
  if (touched) prototype.updatedAt = nowIso()
  await saveRegistry()
  return viewOf(prototype)
}

async function removePrototype(prototype) {
  await stopInternal(prototype.id, { keepError: true })
  registry.prototypes = registry.prototypes.filter((item) => item.id !== prototype.id)
  await removeStoredThumbnail(prototype)
  try {
    await fsp.unlink(join(logsDir, `${prototype.id}.log`))
  } catch {
    /* no log */
  }
  await saveRegistry()
}

async function pickDirectory() {
  let picker = null
  try {
    picker = ctxRef && typeof ctxRef.get === 'function' ? ctxRef.get('directoryPicker') : null
  } catch {
    picker = null
  }
  let capability = null
  try {
    capability = picker && typeof picker.capability === 'function' ? picker.capability() : null
  } catch {
    capability = null
  }
  if (!capability || capability.kind !== 'native' || typeof capability.pick !== 'function') {
    return { kind: 'unavailable' }
  }
  try {
    const picked = await capability.pick(new AbortController().signal)
    const value = typeof picked === 'string' ? picked : picked && typeof picked.path === 'string' ? picked.path : ''
    return { kind: 'native', path: value, canceled: !value }
  } catch (error) {
    return { kind: 'error', message: error instanceof Error ? error.message : String(error) }
  }
}

async function revealDirectory(prototype) {
  if (!existsSync(prototype.dir)) fail(400, 'BAD_PATH', '目录不存在')
  try {
    const child = spawn('open', [prototype.dir], { detached: true, stdio: 'ignore' })
    child.unref()
  } catch (error) {
    fail(500, 'REVEAL_FAILED', error instanceof Error ? error.message : String(error))
  }
  return { ok: true }
}

// ── router ──────────────────────────────────────────────────────────────────

async function handleRequest(request, response) {
  if (!isLoopback(request)) {
    sendJson(response, 403, { error: '仅允许本机访问', code: 'FORBIDDEN' })
    return
  }
  const url = new URL(request.url || '/', 'http://127.0.0.1')
  if (!url.pathname.startsWith(ROUTE_PREFIX)) {
    sendJson(response, 404, { error: '接口不存在', code: 'NOT_FOUND' })
    return
  }
  let segments
  try {
    segments = url.pathname
      .slice(ROUTE_PREFIX.length)
      .split('/')
      .filter(Boolean)
      .map((item) => decodeURIComponent(item))
  } catch {
    fail(400, 'BAD_PATH', '路径解码失败')
  }
  const method = request.method || 'GET'
  if (segments.length === 0) {
    sendJson(response, 200, { name: PROVIDER_NAME, ok: true, dataDir })
    return
  }

  if (segments[0] === 'bootstrap' && method === 'GET') {
    sendJson(response, 200, await bootstrapPayload())
    return
  }
  if (segments[0] === 'image' && method === 'GET') {
    await serveInspectedImage(request, response, url.searchParams.get('path'))
    return
  }
  if (segments[0] === 'inspect-dir' && method === 'POST') {
    const body = await readBody(request)
    const dir = await normalizeDirectory(body.path)
    inspectedDirs.add(dir)
    if (inspectedDirs.size > 40) inspectedDirs.delete(inspectedDirs.values().next().value)
    const info = await inspectDirectory(dir)
    sendJson(response, 200, info)
    return
  }
  if (segments[0] === 'dir' && segments[1] === 'pick' && method === 'POST') {
    sendJson(response, 200, await pickDirectory())
    return
  }
  if (segments[0] === 'prototypes') {
    if (segments.length === 1 && method === 'POST') {
      const body = await readBody(request)
      const created = await queue('registry', () => createPrototype(body))
      sendJson(response, 201, created)
      return
    }
    if (segments.length >= 2) {
      const prototype = requirePrototype(segments[1])
      if (segments.length === 2) {
        if (method === 'GET') {
          sendJson(response, 200, await detailPayload(prototype, { logs: url.searchParams.get('logs') === '1' }))
          return
        }
        if (method === 'PATCH') {
          const body = await readBody(request)
          const updated = await queue(prototype.id, () => patchPrototype(prototype, body))
          sendJson(response, 200, updated)
          return
        }
        if (method === 'DELETE') {
          await queue(prototype.id, () => removePrototype(prototype))
          sendJson(response, 200, { ok: true })
          return
        }
      }

      const action = segments[2]
      if (action === 'branches' && method === 'GET') {
        sendJson(response, 200, await gitBranches(prototype.dir))
        return
      }
      if (action === 'start' && method === 'POST') {
        const body = await readBody(request)
        sendJson(response, 200, await startPrototype(prototype.id, body))
        return
      }
      if (action === 'stop' && method === 'POST') {
        await queue(prototype.id, () => stopInternal(prototype.id))
        sendJson(response, 200, { ok: true })
        return
      }
      if (action === 'restart' && method === 'POST') {
        await queue(prototype.id, () => stopInternal(prototype.id, { keepError: true }))
        const body = await readBody(request)
        sendJson(response, 200, await startPrototype(prototype.id, body))
        return
      }
      if (action === 'reveal' && method === 'POST') {
        sendJson(response, 200, await revealDirectory(prototype))
        return
      }
      if (action === 'logs' && method === 'GET') {
        const lines = Math.min(Math.max(Number(url.searchParams.get('lines')) || 200, 10), 1000)
        const rt = runtimeFor(prototype.id)
        sendJson(response, 200, {
          logs: await tailLog(rt ? rt.logPath : join(logsDir, `${prototype.id}.log`), lines),
        })
        return
      }
      if (action === 'deps' && (method === 'GET' || method === 'POST')) {
        const info = await inspectDirectory(prototype.dir)
        const check = await checkDependencies(prototype.dir)
        if (method === 'POST') {
          const body = await readBody(request)
          if (body && body.install === true) {
            const rt = runtimeFor(prototype.id) || { logPath: join(logsDir, `${prototype.id}.log`), installing: false }
            const result = await queue(prototype.id, () => installDependencies(prototype.id, prototype, rt, check))
            sendJson(response, 200, { ...(await checkDependencies(prototype.dir)), kind: info.kind, installResult: result })
            return
          }
        }
        sendJson(response, 200, { ...check, kind: info.kind })
        return
      }
      if (action === 'thumbnail') {
        if (segments.length === 3 && method === 'GET') {
          await serveThumbnail(request, response, prototype)
          return
        }
        if (segments.length === 3 && method === 'POST') {
          const body = await readBody(request, MAX_THUMB_BODY)
          const updated = await queue(prototype.id, () =>
            hasText(body.dataUrl)
              ? setThumbnailFromDataUrl(prototype, body.dataUrl)
              : setThumbnailFromPath(prototype, body.path),
          )
          sendJson(response, 200, updated)
          return
        }
        if (segments.length === 3 && method === 'DELETE') {
          await removeStoredThumbnail(prototype)
          prototype.thumbnail = null
          prototype.updatedAt = nowIso()
          await saveRegistry()
          sendJson(response, 200, viewOf(prototype))
          return
        }
        if (segments.length === 4 && segments[3] === 'capture' && method === 'POST') {
          const updated = await queue(prototype.id, () => captureThumbnail(prototype))
          sendJson(response, 200, updated)
          return
        }
      }
      if (action === 'git' && segments.length >= 4) {
        const gitAction = segments[3]
        if (gitAction === 'init' && method === 'POST') {
          const body = await readBody(request)
          const result = await queue(prototype.id, async () => {
            const created = await initRepository(prototype.dir, body)
            await refreshGitCache(prototype)
            return created
          })
          sendJson(response, 200, result)
          return
        }
        if (gitAction === 'fetch' && method === 'POST') {
          const result = await queue(prototype.id, async () => {
            const branches = await fetchRemote(prototype.dir)
            await refreshGitCache(prototype)
            return branches
          })
          sendJson(response, 200, result)
          return
        }
        if (gitAction === 'branch' && method === 'POST') {
          const body = await readBody(request)
          const result = await queue(prototype.id, async () => {
            const created = await createBranch(prototype.dir, body.name, body.base)
            await refreshGitCache(prototype)
            return { ...created, prototype: viewOf(prototype) }
          })
          sendJson(response, 200, result)
          return
        }
        if (gitAction === 'switch' && method === 'POST') {
          const body = await readBody(request)
          const result = await queue(prototype.id, async () => {
            const switched = await switchBranch(prototype.dir, body.branch)
            await refreshGitCache(prototype)
            return { ...switched, prototype: viewOf(prototype) }
          })
          sendJson(response, 200, result)
          return
        }
        if (gitAction === 'commit' && method === 'POST') {
          const body = await readBody(request)
          const result = await queue(prototype.id, async () => {
            const committed = await commitChanges(prototype.dir, body)
            await refreshGitCache(prototype)
            return committed
          })
          sendJson(response, 200, result)
          return
        }
        if (gitAction === 'push' && method === 'POST') {
          const result = await queue(prototype.id, async () => {
            const pushed = await pushInternal(prototype.dir)
            if (pushed.ok) await refreshGitCache(prototype)
            return pushed
          })
          if (!result.ok) fail(502, result.code || 'PUSH_FAILED', result.message || '推送失败', { stderr: result.details })
          sendJson(response, 200, result)
          return
        }
      }
    }
  }
  fail(404, 'NOT_FOUND', '接口不存在')
}

function handleSafely(request, response) {
  handleRequest(request, response).catch((error) => {
    const apiError = asApiError(error)
    if (response.headersSent) {
      try {
        response.end()
      } catch {
        /* ignore */
      }
      return
    }
    sendJson(response, apiError.status, {
      error: apiError.message,
      code: apiError.code,
      details: apiError.details,
    })
  })
}

// ── plugin lifecycle ────────────────────────────────────────────────────────

export const inject = ['webServer']

export async function apply(ctx) {
  ctxRef = ctx
  await initState()
  await cleanupOrphans()
  // 插件启用时校正一次缓存：目录里的分支可能已被外部切换过（终端 / IDE / 其他工具），
  // registry 里的 cache.git 会因此过期，列表页就会显示旧分支。
  for (const prototype of registry.prototypes) {
    try {
      await refreshGitCache(prototype)
    } catch {
      /* ignore */
    }
  }
  chromePath = await findChrome()
  try {
    const version = await execFileAsync('git', ['--version'], { timeout: 5000 })
    gitVersion = String(version.stdout || '').trim()
  } catch {
    gitVersion = ''
  }
  await saveServers()

  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE_PREFIX,
      handler: (request, response) => handleSafely(request, response),
    })
    return () => {
      try {
        dispose()
      } catch {
        /* ignore */
      }
    }
  }, 'prototype-library: api routes')

  ctx.effect(() => {
    return () => {
      stopAll().catch((error) => console.error('[prototype-library] 清理运行时失败', error))
    }
  }, 'prototype-library: runtime cleanup')
}
