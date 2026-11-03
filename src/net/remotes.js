import { useSyncExternalStore } from 'react'

/**
 * Người chơi khác cùng khu (dữ liệu "nóng" ngoài React như runtime.js).
 * Vị trí nhận ~10 lần/giây → lưu đệm và vẽ trễ INTERP_MS để nội suy mượt giữa hai mẫu.
 * React chỉ theo dõi danh sách (vào/ra/đổi ngoại hình) qua useRemoteList().
 */

export const INTERP_MS = 150
/** Quá lâu không có tin (ra khỏi tầm nhìn / mất kết nối) → ẩn */
export const STALE_MS = 3000
const MAX_SAMPLES = 24

/**
 * id → { id, name, look, buf:[{t,x,y,z,r,a,s,h}], last, bubble:{text,until}|null, emote:{anim,until}|null, source }
 * source: nguồn động tác cho <Avatar> (anim, speed, holding) — RemotePlayers cập nhật tại chỗ mỗi khung hình
 */
const players = new Map()
const listeners = new Set()
let list = []

function changed() {
  list = [...players.values()]
  listeners.forEach((l) => l())
}

export function subscribeRemotes(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Danh sách người khác (đổi tham chiếu khi có người vào/ra/đổi ngoại hình) */
export function useRemoteList() {
  return useSyncExternalStore(subscribeRemotes, () => list, () => list)
}

export const remoteCount = () => players.size
export const getRemote = (id) => players.get(id)

export function resetRemotes() {
  players.clear()
  changed()
}

export function addRemote({ id, name, look }) {
  const old = players.get(id)
  const source = old?.source ?? { anim: 'idle', speed: 0, holding: null, tiredness: 0.5 }
  players.set(id, { id, name, look, buf: old?.buf ?? [], last: old?.last ?? null, bubble: old?.bubble ?? null, emote: null, source })
  changed()
}

export function removeRemote(id) {
  if (players.delete(id)) changed()
}

export function setRemoteLook(id, look) {
  const p = players.get(id)
  if (!p) return
  players.set(id, { ...p, look, name: look.name })
  changed()
}

/** Gói 'snap': [[id, x, y, z, rotY, anim, speed, holding], …] */
export function applySnap(rows, now = performance.now()) {
  for (const [id, x, y, z, r, a, s, h] of rows) {
    const p = players.get(id)
    if (!p) continue
    p.buf.push({ t: now, x, y, z, r, a, s, h })
    if (p.buf.length > MAX_SAMPLES) p.buf.shift()
    p.last = now
  }
}

const lerpAngle = (a, b, k) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * k
}

/**
 * Trạng thái nội suy tại thời điểm now (vẽ trễ INTERP_MS).
 * @returns {{ x, y, z, r, a, s, h } | null}
 */
export function sampleRemote(p, now = performance.now()) {
  const buf = p.buf
  if (!buf.length) return null
  const t = now - INTERP_MS
  if (t <= buf[0].t) return buf[0]
  for (let i = buf.length - 1; i >= 0; i--) {
    const a = buf[i]
    if (a.t > t) continue
    const b = buf[i + 1]
    if (!b) return a
    const k = (t - a.t) / Math.max(1, b.t - a.t)
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k, r: lerpAngle(a.r, b.r, k), a: a.a, s: a.s, h: a.h }
  }
  return buf[buf.length - 1]
}

export const isStale = (p, now = performance.now()) => p.last == null || now - p.last > STALE_MS

export function setRemoteBubble(id, text, ms = 6000) {
  const p = players.get(id)
  if (p) p.bubble = { text, until: performance.now() + ms }
}

export function setRemoteEmote(id, emote, now = performance.now()) {
  const p = players.get(id)
  if (p) p.emote = { anim: emote.anim, until: now + emote.ms }
}
