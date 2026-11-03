import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { WebSocketServer } from 'ws'
import { DEFAULT_SAVE } from '../src/game/saveDefaults.js'
import { TICK_HZ, lookFromProfile } from '../src/net/protocol.js'
import { checkCredentials, hashPassword, newToken, rateLimiter, verifyPassword } from './auth.js'
import { cleanText } from './chatFilter.js'
import { openDb } from './db.js'
import { fullBuckets, importLocal, saveTooBig, validateSave } from './saveRules.js'
import { World } from './world.js'

/**
 * Máy chủ online của Anh Hậu Phật Tử.
 *  HTTP  /api/register · /api/login · /api/logout · /api/me · /api/health
 *  WS    /ws?token=…   (giao thức: src/net/protocol.js)
 *  Tĩnh  phục vụ thư mục dist/ (bản build của game) nếu có → triển khai một máy chủ duy nhất
 */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
}
const MAX_BODY = 80 * 1024
const MSGS_PER_SEC = 40

function readJson(req) {
  return new Promise((ok, fail) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        fail(new Error('too-big'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        ok(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch (err) {
        fail(err)
      }
    })
    req.on('error', fail)
  })
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

const bearer = (req) => /^Bearer (\w+)$/.exec(req.headers.authorization ?? '')?.[1] ?? null
const clientIp = (req) => req.socket.remoteAddress ?? '?'

/** Ngoại hình công khai dựng từ bản lưu trên máy chủ (tên đã lọc lời thô tục) */
function lookOf(save) {
  const look = lookFromProfile(save.profile, save.wardrobe)
  look.name = cleanText(look.name)
  return look
}

/** Bản lưu giữ trong bộ nhớ, ghi xuống cơ sở dữ liệu định kỳ (giảm tải cho DB miễn phí) */
const FLUSH_MS = 15_000

export async function startServer({ port = 0, dbFile = ':memory:', dbUrl = null, dbClient = null, staticDir = null, log = () => {} } = {}) {
  const db = await openDb({ file: dbFile, url: dbUrl, client: dbClient })
  const authLimit = rateLimiter(10, 60_000)
  /** userId → ctx { ws, pid, user, session } — mỗi tài khoản một kết nối */
  const online = new Map()
  /** pid → kết nối */
  const sockets = new Map()
  let nextPid = 1

  const world = new World({
    send: (pid, msg) => {
      const ws = sockets.get(pid)
      if (ws && ws.readyState === 1) ws.send(JSON.stringify(msg))
    },
  })

  /* ---------------- HTTP ---------------- */

  async function api(req, res, path) {
    if (path === '/api/health') return sendJson(res, 200, { ok: true, online: world.count })
    if (req.method === 'GET' && path === '/api/me') {
      const user = await db.userForToken(bearer(req))
      if (!user) return sendJson(res, 401, { error: 'Phiên đăng nhập đã hết hạn.' })
      return sendJson(res, 200, { username: user.username, save: await currentSave(user.id) })
    }
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Phương thức không hỗ trợ' })
    if (path === '/api/logout') {
      const token = bearer(req)
      if (token) await db.deleteSession(token)
      return sendJson(res, 200, { ok: true })
    }
    if (path !== '/api/register' && path !== '/api/login') return sendJson(res, 404, { error: 'Không có' })
    if (!authLimit(clientIp(req))) return sendJson(res, 429, { error: 'Thử quá nhiều lần, đợi một phút rồi thử lại.' })
    let body
    try {
      body = await readJson(req)
    } catch {
      return sendJson(res, 400, { error: 'Dữ liệu không hợp lệ' })
    }
    const { username, password } = body
    const bad = checkCredentials(username, password)
    if (bad) return sendJson(res, 400, { error: bad })

    if (path === '/api/register') {
      if (await db.userByName(username)) return sendJson(res, 409, { error: 'Tên đăng nhập đã có người dùng.' })
      const id = await db.createUser(username, await hashPassword(password))
      // Mang theo tiến trình chơi một mình (có giới hạn) nếu người chơi muốn
      const save = body.local ? importLocal(body.local) : structuredClone(DEFAULT_SAVE)
      await db.storeSave(id, save, fullBuckets(Date.now()))
      const token = newToken()
      await db.createSession(id, token)
      log(`[tai-khoan] mới: ${username}`)
      return sendJson(res, 200, { token, username, save })
    }
    const user = await db.userByName(username)
    if (!user || !(await verifyPassword(password, user.pass))) return sendJson(res, 401, { error: 'Sai tên đăng nhập hoặc mật khẩu.' })
    const token = newToken()
    await db.createSession(user.id, token)
    return sendJson(res, 200, { token, username: user.username, save: await currentSave(user.id) })
  }

  function serveStatic(req, res, path) {
    if (!staticDir) return sendJson(res, 404, { error: 'Không có' })
    const root = resolve(staticDir)
    let file = normalize(join(root, decodeURIComponent(path)))
    if (!file.startsWith(root)) return sendJson(res, 403, { error: 'Cấm' })
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html') // SPA
    if (!existsSync(file)) return sendJson(res, 404, { error: 'Không có' })
    const type = MIME[extname(file)] ?? 'application/octet-stream'
    const cache = file.includes(`${join(root, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache'
    res.writeHead(200, { 'content-type': type, 'cache-control': cache })
    res.end(readFileSync(file))
  }

  const http = createServer((req, res) => {
    const path = new URL(req.url, 'http://x').pathname
    if (path.startsWith('/api/')) {
      api(req, res, path).catch((err) => {
        log(`[api] lỗi ${path}: ${err.message}`)
        sendJson(res, 500, { error: 'Máy chủ gặp lỗi.' })
      })
    } else serveStatic(req, res, path)
  })

  /* ---------------- WebSocket ---------------- */

  const wss = new WebSocketServer({ server: http, path: '/ws', maxPayload: MAX_BODY })
  /** Bản lưu mới nhất: đang chơi thì lấy trong bộ nhớ (chưa kịp ghi DB), không thì đọc DB */
  async function currentSave(userId) {
    return online.get(userId)?.session.save ?? (await db.loadSave(userId))?.save ?? null
  }

  wss.on('connection', (ws, req) => {
    // Gắn xử lý tin ngay (tin tới trong lúc đang đọc DB sẽ đợi tới khi sẵn sàng)
    let ready
    const setup = new Promise((ok) => (ready = ok))
    ws.on('message', async (data) => {
      const ctx = await setup
      if (ctx) onMessage(ctx, data)
    })
    ws.on('close', async () => {
      const ctx = await setup
      if (ctx) await onClose(ctx)
    })
    accept(ws, req)
      .then(ready)
      .catch((err) => {
        log(`[ws] lỗi khi vào: ${err.message}`)
        ready(null)
        ws.close(1011)
      })
  })

  async function accept(ws, req) {
    const token = new URL(req.url, 'http://x').searchParams.get('token')
    const user = await db.userForToken(token)
    if (!user) {
      ws.send(JSON.stringify({ t: 'kicked', reason: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' }))
      ws.close(4001)
      return null
    }
    // Một tài khoản chỉ chơi ở một nơi: đẩy kết nối cũ ra và ghi bản lưu của nó trước khi đọc lại
    const prev = online.get(user.id)
    if (prev) {
      prev.ws.send(JSON.stringify({ t: 'kicked', reason: 'Tài khoản vừa đăng nhập ở nơi khác.' }))
      prev.ws.close(4002)
      prev.closed = true
      await flush(prev)
    }
    const stored = (await db.loadSave(user.id)) ?? { save: structuredClone(DEFAULT_SAVE), buckets: fullBuckets(Date.now()) }
    const pid = nextPid++
    const ctx = {
      ws,
      pid,
      user,
      session: { save: stored.save, buckets: stored.buckets, dirty: false },
      closed: false,
      window: { start: Date.now(), count: 0 },
    }
    sockets.set(pid, ws)
    online.set(user.id, ctx)
    world.join(pid, { userId: user.id, look: lookOf(ctx.session.save) })
    ws.send(JSON.stringify({ t: 'welcome', id: pid, name: user.username, save: ctx.session.save }))
    log(`[ket-noi] ${user.username} (#${pid}) · đang online ${world.count}`)
    return ctx
  }

  async function flush(ctx) {
    if (!ctx.session.dirty) return
    ctx.session.dirty = false
    try {
      await db.storeSave(ctx.user.id, ctx.session.save, ctx.session.buckets)
    } catch (err) {
      ctx.session.dirty = true
      log(`[db] không ghi được bản lưu ${ctx.user.username}: ${err.message}`)
    }
  }

  function onMessage(ctx, data) {
    // Kết nối cũ đã bị thay: bỏ qua mọi tin còn sót
    if (ctx.closed) return
    const { ws, pid, user, session } = ctx
    const now = Date.now()
    if (now - ctx.window.start > 1000) ctx.window = { start: now, count: 0 }
    if (++ctx.window.count > MSGS_PER_SEC) return
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch {
      return
    }
    switch (msg?.t) {
      case 'st':
        world.state(pid, msg)
        break
      case 'chat': {
        const err = world.chat(pid, msg)
        if (err) ws.send(JSON.stringify({ t: 'notice', text: err }))
        break
      }
      case 'emote':
        world.emote(pid, msg.id)
        break
      case 'ev':
        world.event(pid, msg)
        break
      case 'save': {
        if (saveTooBig(msg.save)) return
        const r = validateSave(session.save, msg.save, session.buckets, now)
        const before = JSON.stringify(lookOf(session.save))
        session.save = r.save
        session.buckets = r.buckets
        session.dirty = true
        if (r.fixed.length) ws.send(JSON.stringify({ t: 'save', save: r.save, fixed: r.fixed }))
        const look = lookOf(r.save)
        if (JSON.stringify(look) !== before) world.setLook(pid, look)
        break
      }
      case 'report': {
        const target = world.players.get(Number(msg.id))
        if (target) db.addReport(user.id, target.userId, msg.reason).catch((err) => log(`[db] báo cáo lỗi: ${err.message}`))
        break
      }
      default:
    }
  }

  async function onClose(ctx) {
    world.leave(ctx.pid)
    sockets.delete(ctx.pid)
    if (online.get(ctx.user.id) === ctx) online.delete(ctx.user.id)
    if (!ctx.closed) {
      ctx.closed = true
      await flush(ctx)
    }
    log(`[roi] ${ctx.user.username} (#${ctx.pid}) · đang online ${world.count}`)
  }

  const flushTimer = setInterval(() => {
    for (const ctx of online.values()) flush(ctx)
  }, FLUSH_MS)

  const timer = setInterval(() => world.tick(), 1000 / TICK_HZ)

  await new Promise((ok) => http.listen(port, ok))
  return {
    port: http.address().port,
    dbKind: db.kind,
    world,
    db,
    async close() {
      clearInterval(timer)
      clearInterval(flushTimer)
      // Ghi hết bản lưu đang giữ trong bộ nhớ trước khi tắt
      await Promise.all([...online.values()].map(flush))
      for (const ws of wss.clients) ws.terminate()
      await new Promise((ok) => wss.close(ok))
      await new Promise((ok) => http.close(ok))
      await db.close()
    },
  }
}
