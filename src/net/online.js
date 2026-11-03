import { useSyncExternalStore } from 'react'
import { EMOTES, TICK_HZ } from './protocol'
import { addRemote, applySnap, removeRemote, resetRemotes, setRemoteBubble, setRemoteEmote, setRemoteLook } from './remotes'
import { clearMessages, pushMessage } from './chatStore'
import { emit, on, runtime } from '../game/runtime'
import { enterServerSave, getGame, leaveServerSave, replaceSave } from '../game/state'

/**
 * Kết nối chơi online (một kết nối cho cả game).
 *  - goOnline({ token, username, save }): dùng bản lưu máy chủ, mở WebSocket, tự nối lại khi rớt mạng
 *  - Gửi trạng thái nhân vật TICK_HZ lần/giây (chỉ khi thay đổi + nhắc lại mỗi giây), gửi bản lưu khi có thay đổi
 *  - Nhận người khác (remotes.js), chat (chatStore.js), biểu cảm, sự kiện chung (chuông, hương)
 *  - goOffline(): ngắt kết nối, quay lại bản lưu chơi một mình
 */

/** Phần tử DOM bong bóng chat của chính mình (OnlineHud vẽ, RemotePlayers đặt vị trí theo đầu nhân vật) */
export const SELF_BUBBLE_ID = 'bong-bong-cua-toi'

const SAVE_EVERY_MS = 2500
const KEEPALIVE_MS = 1000
const RETRY_MS = [1000, 2000, 5000, 10000]

/** status: 'offline' | 'connecting' | 'online' | 'lost' | 'kicked' */
let status = { mode: 'offline', username: null, myId: null, notice: null, selfBubble: null }
const listeners = new Set()
function setStatus(patch) {
  status = { ...status, ...patch }
  listeners.forEach((l) => l())
}
export const getOnline = () => status
export const subscribeOnline = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const useOnline = (selector = (s) => s) => useSyncExternalStore(subscribeOnline, () => selector(status), () => selector(status))
export const isOnline = () => status.mode !== 'offline'

let ws = null
let token = null
let retry = 0
let retryTimer = null
let loops = []
let welcomed = false
let lastSentSave = null
let lastState = null
let lastStateAt = 0

function send(msg) {
  if (ws?.readyState === 1) ws.send(JSON.stringify(msg))
}

export function goOnline({ token: t, username, save }) {
  goOfflineQuiet()
  token = t
  welcomed = false
  enterServerSave(save)
  lastSentSave = getGame().save
  setStatus({ mode: 'connecting', username, myId: null, notice: null })
  startLoops()
  connect()
}

/** Ngắt kết nối & quay lại chơi một mình */
export function goOffline() {
  goOfflineQuiet()
  leaveServerSave()
  setStatus({ mode: 'offline', username: null, myId: null, notice: null, selfBubble: null })
}

function goOfflineQuiet() {
  clearTimeout(retryTimer)
  loops.forEach((off) => off())
  loops = []
  if (ws) {
    ws.onclose = null
    ws.close()
    ws = null
  }
  resetRemotes()
  clearMessages()
}

function connect() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const sock = new WebSocket(`${proto}//${location.host}/ws?token=${encodeURIComponent(token)}`)
  ws = sock
  sock.onmessage = (e) => {
    let msg
    try {
      msg = JSON.parse(e.data)
    } catch {
      return
    }
    handle(msg)
  }
  sock.onclose = () => {
    if (ws !== sock) return
    ws = null
    resetRemotes()
    if (status.mode === 'kicked') return
    setStatus({ mode: 'lost' })
    retryTimer = setTimeout(connect, RETRY_MS[Math.min(retry++, RETRY_MS.length - 1)])
  }
}

function handle(msg) {
  switch (msg.t) {
    case 'welcome':
      retry = 0
      setStatus({ mode: 'online', myId: msg.id })
      if (!welcomed) {
        welcomed = true
        replaceSave(msg.save)
        lastSentSave = getGame().save
      } else {
        // Nối lại sau khi rớt mạng: gửi ngay bản đang chơi (máy chủ kiểm tra), không lùi về bản cũ
        lastSentSave = null
      }
      lastState = null
      break
    case 'roster':
      resetRemotes()
      for (const p of msg.players) addRemote(p)
      break
    case 'join':
      addRemote(msg)
      break
    case 'leave':
      removeRemote(msg.id)
      break
    case 'look':
      setRemoteLook(msg.id, msg.look)
      break
    case 'snap':
      applySnap(msg.ps)
      break
    case 'chat':
      pushMessage({ id: msg.id, name: msg.name, scope: msg.scope, text: msg.text, at: msg.at, self: msg.id === status.myId })
      if (msg.id === status.myId) setStatus({ selfBubble: { text: msg.text, until: performance.now() + 6000 } })
      else setRemoteBubble(msg.id, msg.text)
      break
    case 'emote': {
      const em = EMOTES[msg.emote]
      if (!em) break
      setRemoteEmote(msg.id, em)
      setRemoteBubble(msg.id, em.label, em.ms + 1000)
      break
    }
    case 'ev':
      // Sự kiện của người khác: phát lại như sự kiện trong game, đánh dấu remote để không gửi ngược lên
      if (msg.kind === 'bell') emit('bell-ring', { towerId: msg.spot, power: msg.power ?? 0.7, remote: true })
      if (msg.kind === 'incense') emit('incense-lit', { spotId: msg.spot, remote: true })
      break
    case 'save':
      replaceSave(msg.save)
      lastSentSave = getGame().save
      emit('toast', { title: 'Máy chủ đã điều chỉnh tiến trình', description: 'Một số công đức/xu vượt mức cho phép nên không được ghi nhận.' })
      break
    case 'notice':
      pushMessage({ system: true, name: 'Hệ thống', text: msg.text, at: Date.now() })
      break
    case 'kicked':
      setStatus({ mode: 'kicked', notice: msg.reason })
      break
    default:
  }
}

function startLoops() {
  // Trạng thái nhân vật
  const stateTimer = setInterval(() => {
    if (status.mode !== 'online') return
    const p = runtime.player
    const st = {
      t: 'st',
      z: runtime.zoneId,
      p: [p.position.x, p.position.y + (p.jump?.h ?? 0), p.position.z, p.rotY],
      a: p.anim,
      s: p.speed,
      h: p.holding,
    }
    const now = performance.now()
    const same =
      lastState &&
      lastState.z === st.z &&
      lastState.a === st.a &&
      lastState.h === st.h &&
      Math.abs(lastState.p[0] - st.p[0]) < 0.02 &&
      Math.abs(lastState.p[1] - st.p[1]) < 0.02 &&
      Math.abs(lastState.p[2] - st.p[2]) < 0.02 &&
      Math.abs(lastState.p[3] - st.p[3]) < 0.02
    if (!st.z || (same && now - lastStateAt < KEEPALIVE_MS)) return
    lastState = st
    lastStateAt = now
    send(st)
  }, 1000 / TICK_HZ)

  // Bản lưu: gửi khi có thay đổi
  const pushSave = () => {
    if (status.mode !== 'online') return
    const save = getGame().save
    if (save === lastSentSave) return
    lastSentSave = save
    send({ t: 'save', save })
  }
  const saveTimer = setInterval(pushSave, SAVE_EVERY_MS)
  window.addEventListener('pagehide', pushSave)

  // Sự kiện của mình → gửi cho người khác
  const offBell = on('bell-ring', (e) => !e.remote && send({ t: 'ev', kind: 'bell', spot: e.towerId, power: e.power }))
  const offIncense = on('incense-lit', (e) => !e.remote && send({ t: 'ev', kind: 'incense', spot: e.spotId }))

  loops = [
    () => clearInterval(stateTimer),
    () => clearInterval(saveTimer),
    () => window.removeEventListener('pagehide', pushSave),
    offBell,
    offIncense,
  ]
}

/** Chat chữ: scope 'near' (người gần) | 'zone' (cả khu) */
export function sendChat(text, scope = 'near') {
  const clean = String(text ?? '').trim()
  if (!clean || status.mode !== 'online') return
  send({ t: 'chat', scope, text: clean })
}

/** Biểu cảm: nhân vật mình làm động tác + bong bóng chữ; online thì người xung quanh cũng thấy */
export function sendEmote(id) {
  const em = EMOTES[id]
  if (!em) return
  runtime.player.emote = { anim: em.anim, until: performance.now() + em.ms }
  setStatus({ selfBubble: { text: em.label, until: performance.now() + em.ms + 1000 } })
  if (status.mode === 'online') send({ t: 'emote', id })
}

export function reportPlayer(id, reason) {
  send({ t: 'report', id, reason })
}
