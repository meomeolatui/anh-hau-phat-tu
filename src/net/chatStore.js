import { useSyncExternalStore } from 'react'

/** Tin chat đã nhận (tối đa MAX_MESSAGES) + danh sách tên đã tắt tiếng (lưu trên máy) */

const MAX_MESSAGES = 60
const MUTE_KEY = 'ahpt-muted'

let messages = []
let muted = loadMuted()
const listeners = new Set()
const notify = () => listeners.forEach((l) => l())

function loadMuted() {
  try {
    return new Set(JSON.parse(localStorage.getItem(MUTE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function subscribeChat(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** { key, id, name, scope, text, at, self?, system? } */
export function pushMessage(msg) {
  if (!msg.system && muted.has(msg.name)) return
  messages = [...messages.slice(-(MAX_MESSAGES - 1)), { key: `${msg.at}-${Math.random()}`, ...msg }]
  notify()
}

export function clearMessages() {
  messages = []
  notify()
}

export const useMessages = () => useSyncExternalStore(subscribeChat, () => messages, () => messages)
export const isMuted = (name) => muted.has(name)

export function toggleMute(name) {
  muted = new Set(muted)
  if (muted.has(name)) muted.delete(name)
  else {
    muted.add(name)
    messages = messages.filter((m) => m.name !== name || m.system)
  }
  localStorage.setItem(MUTE_KEY, JSON.stringify([...muted]))
  notify()
}

export const useMuted = () => useSyncExternalStore(subscribeChat, () => muted, () => muted)
