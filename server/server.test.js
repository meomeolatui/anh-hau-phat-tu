// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import WebSocket from 'ws'
import { PGlite } from '@electric-sql/pglite'
import { startServer } from './server.js'

let app
let base

const post = (path, body, token) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json() }))

/** Kết nối WS và gom tin nhắn; waitFor(t) chờ tới khi có tin loại t */
function connect(token) {
  const ws = new WebSocket(`ws://localhost:${app.port}/ws?token=${token}`)
  const inbox = []
  const waiters = []
  ws.on('message', (d) => {
    const msg = JSON.parse(d.toString())
    inbox.push(msg)
    for (const w of [...waiters]) if (w.test(msg)) {
      waiters.splice(waiters.indexOf(w), 1)
      w.ok(msg)
    }
  })
  const waitFor = (t, pred = () => true) =>
    new Promise((ok, fail) => {
      const hit = inbox.find((m) => m.t === t && pred(m))
      if (hit) return ok(hit)
      const timer = setTimeout(() => fail(new Error(`không nhận được ${t}`)), 3000)
      waiters.push({ test: (m) => m.t === t && pred(m), ok: (m) => (clearTimeout(timer), ok(m)) })
    })
  const send = (msg) => ws.send(JSON.stringify(msg))
  return { ws, inbox, waitFor, send }
}

describe.each([
  ['SQLite', () => ({})],
  ['Postgres (PGlite)', () => ({ dbClient: new PGlite() })],
])('máy chủ online · %s', (_, dbOpts) => {
  beforeAll(async () => {
    app = await startServer({ port: 0, ...dbOpts() })
    base = `http://localhost:${app.port}`
  })
  afterAll(async () => app.close())

  let tokenA
  let tokenB

  it('đăng ký, đăng nhập, chặn sai mật khẩu / tên trùng / dữ liệu xấu', async () => {
    const reg = await post('/api/register', { username: 'an_tu', password: 'namo123' })
    expect(reg.status).toBe(200)
    expect(reg.body.token).toMatch(/^\w{64}$/)
    tokenA = reg.body.token
    expect((await post('/api/register', { username: 'AN_TU', password: 'khac123' })).status).toBe(409)
    expect((await post('/api/login', { username: 'an_tu', password: 'sai-mat-khau' })).status).toBe(401)
    expect((await post('/api/register', { username: 'a', password: '1' })).status).toBe(400)
    const login = await post('/api/login', { username: 'an_tu', password: 'namo123' })
    expect(login.status).toBe(200)
    tokenA = login.body.token
    const me = await fetch(`${base}/api/me`, { headers: { authorization: `Bearer ${tokenA}` } }).then((r) => r.json())
    expect(me.username).toBe('an_tu')

    const regB = await post('/api/register', {
      username: 'binh_an',
      password: 'namo456',
      local: { profile: { name: 'Bình An', role: 'phat-tu' }, merit: 99_999, xu: 50 },
    })
    tokenB = regB.body.token
    expect(regB.body.save.merit).toBe(3000) // mang tiến trình cũ theo nhưng có giới hạn
  })

  it('hai người cùng khu thấy nhau đi lại, chat, nghe chuông', async () => {
    const a = connect(tokenA)
    const b = connect(tokenB)
    const wa = await a.waitFor('welcome')
    const wb = await b.waitFor('welcome')
    a.send({ t: 'st', z: 'chua-ba', p: [0, 26, -150, 0], a: 'idle', s: 0 })
    await a.waitFor('roster')
    b.send({ t: 'st', z: 'chua-ba', p: [4, 26, -150, 1], a: 'walk', s: 1.6 })
    const join = await a.waitFor('join')
    expect(join).toMatchObject({ id: wb.id, name: 'Bình An' })
    const snap = await a.waitFor('snap', (m) => m.ps.some((r) => r[0] === wb.id))
    expect(snap.ps.find((r) => r[0] === wb.id)[5]).toBe('walk')

    b.send({ t: 'chat', scope: 'near', text: 'A Di Đà Phật 🙏' })
    expect((await a.waitFor('chat')).text).toBe('A Di Đà Phật 🙏')
    b.send({ t: 'ev', kind: 'bell', spot: 'chua-ba-gac-chuong', power: 0.9 })
    expect(await a.waitFor('ev')).toMatchObject({ id: wb.id, kind: 'bell' })
    b.send({ t: 'emote', id: 'binh-an' })
    expect(await a.waitFor('emote')).toMatchObject({ id: wb.id, emote: 'binh-an' })
    expect(wa.id).not.toBe(wb.id)
    a.ws.close()
    b.ws.close()
  })

  it('bản lưu gửi lên bị máy chủ sửa khi gian lận xu', async () => {
    const a = connect(tokenA)
    const w = await a.waitFor('welcome')
    a.send({ t: 'save', save: { ...w.save, xu: 999_999, wardrobe: { owned: ['te-thien'], costume: 'te-thien', hat: null } } })
    const fix = await a.waitFor('save')
    expect(fix.fixed.length).toBeGreaterThan(0)
    expect(fix.save.xu).toBeLessThan(100)
    a.ws.close()
  })

  it('đăng nhập nơi khác thì kết nối cũ bị đẩy ra; token sai bị từ chối', async () => {
    const a1 = connect(tokenA)
    await a1.waitFor('welcome')
    const a2 = connect(tokenA)
    await a2.waitFor('welcome')
    expect((await a1.waitFor('kicked')).reason).toMatch(/nơi khác/)
    a2.ws.close()
    const bad = connect('khong-hop-le')
    expect((await bad.waitFor('kicked')).reason).toMatch(/đăng nhập/)
  })

  it('bản lưu giữ trong bộ nhớ được ghi xuống CSDL khi rời game (đăng nhập lại vẫn còn)', async () => {
    const a = connect(tokenB)
    const w = await a.waitFor('welcome')
    a.send({ t: 'save', save: { ...w.save, merit: w.save.merit + 25 } })
    await new Promise((ok) => setTimeout(ok, 150))
    a.ws.close()
    await new Promise((ok) => setTimeout(ok, 300))
    const me = await fetch(`${base}/api/me`, { headers: { authorization: `Bearer ${tokenB}` } }).then((r) => r.json())
    expect(me.save.merit).toBe(w.save.merit + 25)
  })
})
