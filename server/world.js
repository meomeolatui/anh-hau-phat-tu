import { ANIM_RE, CHAT_GAP_MS, CHAT_MAX, EMOTE_GAP_MS, EMOTES, MAX_VIEW, NEAR_RADIUS, SHARED_EVENTS, VIEW_RADIUS, ZONE_RE } from '../src/net/protocol.js'
import { cleanChat } from './chatFilter.js'

/**
 * Thế giới chung: người chơi chia theo khu (zone) — chỉ nhận tin của người cùng khu.
 * Mỗi nhịp (TICK_HZ) gửi cho từng người vị trí của tối đa MAX_VIEW người gần nhất trong VIEW_RADIUS.
 * Không phụ thuộc socket: gửi qua hàm send(id, msg) để test được.
 */
export class World {
  constructor({ send, now = () => Date.now() }) {
    this.send = send
    this.now = now
    /** id → { id, userId, name, look, zone, p:[x,y,z,r], a, s, h, dirty, lastChat, lastEmote } */
    this.players = new Map()
    /** zone → Set(id) */
    this.zones = new Map()
  }

  get count() {
    return this.players.size
  }

  join(id, { userId, look }) {
    // seen: id người khác → lúc gửi vị trí họ cho người này gần nhất
    const pl = { id, userId, name: look.name, look, zone: null, p: null, a: 'idle', s: 0, h: null, dirty: false, lastChat: 0, lastEmote: 0, seen: new Map() }
    this.players.set(id, pl)
    return pl
  }

  leave(id) {
    const pl = this.players.get(id)
    if (!pl) return
    this.#leaveZone(pl)
    this.players.delete(id)
  }

  #members(zone) {
    let set = this.zones.get(zone)
    if (!set) this.zones.set(zone, (set = new Set()))
    return set
  }

  #broadcastZone(zone, msg, exceptId = null) {
    const set = this.zones.get(zone)
    if (!set) return
    for (const id of set) if (id !== exceptId) this.send(id, msg)
  }

  #leaveZone(pl) {
    if (!pl.zone) return
    const set = this.zones.get(pl.zone)
    set?.delete(pl.id)
    if (set && !set.size) this.zones.delete(pl.zone)
    this.#broadcastZone(pl.zone, { t: 'leave', id: pl.id })
    pl.zone = null
  }

  /** Cập nhật trạng thái (vị trí, hoạt ảnh…) — đổi khu thì gửi danh sách người ở khu mới */
  state(id, msg) {
    const pl = this.players.get(id)
    if (!pl) return
    const p = Array.isArray(msg.p) && msg.p.length === 4 && msg.p.every(Number.isFinite) ? msg.p.map((v) => Math.round(v * 100) / 100) : null
    if (!p) return
    const zone = typeof msg.z === 'string' && ZONE_RE.test(msg.z) ? msg.z : null
    if (zone && zone !== pl.zone) {
      this.#leaveZone(pl)
      pl.zone = zone
      const set = this.#members(zone)
      this.send(id, { t: 'roster', z: zone, players: [...set].map((o) => this.#info(this.players.get(o))) })
      this.#broadcastZone(zone, { t: 'join', ...this.#info(pl) })
      set.add(id)
    }
    pl.p = p
    pl.a = typeof msg.a === 'string' && ANIM_RE.test(msg.a) ? msg.a : 'idle'
    pl.s = Number.isFinite(msg.s) ? Math.min(20, Math.max(0, Math.round(msg.s * 10) / 10)) : 0
    pl.h = msg.h === 'broom' || msg.h === 'tea' || msg.h === 'beads' ? msg.h : null
    pl.dirty = true
  }

  #info(pl) {
    return { id: pl.id, name: pl.name, look: pl.look }
  }

  setLook(id, look) {
    const pl = this.players.get(id)
    if (!pl) return
    pl.look = look
    pl.name = look.name
    if (pl.zone) this.#broadcastZone(pl.zone, { t: 'look', id, look }, id)
  }

  /** Người cùng khu trong bán kính r quanh pl (gồm cả chính mình nếu self) */
  #near(pl, r, self = true) {
    const out = []
    const set = this.zones.get(pl.zone)
    if (!set || !pl.p) return out
    for (const oid of set) {
      if (!self && oid === pl.id) continue
      const o = this.players.get(oid)
      if (!o?.p) continue
      const dx = o.p[0] - pl.p[0]
      const dz = o.p[2] - pl.p[2]
      if (dx * dx + dz * dz <= r * r) out.push(o)
    }
    return out
  }

  /** Chat: scope 'near' (NEAR_RADIUS) hoặc 'zone'; giới hạn tốc độ, làm sạch lời lẽ */
  chat(id, { scope, text }) {
    const pl = this.players.get(id)
    if (!pl?.zone) return 'Bạn chưa vào khu nào.'
    const now = this.now()
    if (now - pl.lastChat < CHAT_GAP_MS) return 'Bạn nhắn nhanh quá, chậm lại một chút nhé.'
    const clean = cleanChat(text, CHAT_MAX)
    if (!clean) return null
    pl.lastChat = now
    const msg = { t: 'chat', id, name: pl.name, scope: scope === 'zone' ? 'zone' : 'near', text: clean, at: now }
    if (msg.scope === 'zone') this.#broadcastZone(pl.zone, msg)
    else for (const o of this.#near(pl, NEAR_RADIUS)) this.send(o.id, msg)
    return null
  }

  emote(id, emoteId) {
    const pl = this.players.get(id)
    if (!pl?.zone || !EMOTES[emoteId]) return
    const now = this.now()
    if (now - pl.lastEmote < EMOTE_GAP_MS) return
    pl.lastEmote = now
    for (const o of this.#near(pl, VIEW_RADIUS, false)) this.send(o.id, { t: 'emote', id, emote: emoteId })
  }

  /** Sự kiện chung (thỉnh chuông, thắp hương) — người gần nghe/thấy */
  event(id, { kind, spot, power }) {
    const pl = this.players.get(id)
    if (!pl?.zone || !SHARED_EVENTS.includes(kind) || typeof spot !== 'string' || spot.length > 48) return
    const msg = { t: 'ev', id, kind, spot, power: Number.isFinite(power) ? Math.min(1, Math.max(0, power)) : undefined }
    // Chuông vang xa: cả khu nghe; thắp hương: người gần
    const targets = kind === 'bell' ? [...(this.zones.get(pl.zone) ?? [])].map((o) => this.players.get(o)) : this.#near(pl, VIEW_RADIUS)
    for (const o of targets) if (o && o.id !== id) this.send(o.id, msg)
  }

  /**
   * Một nhịp: gửi vị trí người gần — người vừa thay đổi, người mới vào tầm nhìn, và nhắc lại
   * mỗi KEEPALIVE_MS cho người đứng yên (game ẩn người không có tin quá vài giây).
   */
  tick() {
    const now = this.now()
    for (const pl of this.players.values()) {
      if (!pl.zone || !pl.p) continue
      const near = this.#near(pl, VIEW_RADIUS, false)
      if (!near.length) continue
      if (near.length > MAX_VIEW) {
        near.sort((a, b) => dist2(a.p, pl.p) - dist2(b.p, pl.p))
        near.length = MAX_VIEW
      }
      const ps = []
      for (const o of near) {
        const last = pl.seen.get(o.id)
        if (!o.dirty && last !== undefined && now - last < KEEPALIVE_MS) continue
        pl.seen.set(o.id, now)
        ps.push([o.id, o.p[0], o.p[1], o.p[2], o.p[3], o.a, o.s, o.h])
      }
      if (ps.length) this.send(pl.id, { t: 'snap', ps })
      // Dọn người đã rời tầm nhìn khỏi bảng "đã gửi"
      if (pl.seen.size > MAX_VIEW * 2) for (const k of pl.seen.keys()) if (!near.some((o) => o.id === k)) pl.seen.delete(k)
    }
    for (const pl of this.players.values()) pl.dirty = false
  }
}

const KEEPALIVE_MS = 1000
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2
