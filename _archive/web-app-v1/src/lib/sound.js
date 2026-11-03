import { getState } from './store'

/**
 * Âm thanh tổng hợp bằng Web Audio API — không cần file mp3, chạy offline.
 * Mọi hàm tự kiểm tra cài đặt `settings.sound` / `settings.haptics`.
 */

let ctx = null

function audio() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  // Trình duyệt chặn âm thanh cho tới khi có thao tác người dùng — resume trong handler click là đủ.
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

const soundOn = () => getState().settings.sound

/** Tiếng mõ gỗ: xung ngắn, cộng hưởng ở ~800Hz. */
export function playMo({ volume = 0.6 } = {}) {
  if (!soundOn()) return
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const filter = ac.createBiquadFilter()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(820, t)
  osc.frequency.exponentialRampToValueAtTime(560, t + 0.12)
  filter.type = 'bandpass'
  filter.frequency.value = 900
  filter.Q.value = 4
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  osc.connect(filter).connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.2)
}

/** Tiếng hạt chuỗi chạm nhau: rất nhẹ. */
export function playBead() {
  if (!soundOn()) return
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(2400, t)
  osc.frequency.exponentialRampToValueAtTime(1600, t + 0.04)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.003)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.08)
}

/**
 * Tiếng chuông (khánh/chuông gia trì): tổng các hoạ âm không điều hoà, ngân dài.
 * @param {{ strong?: boolean, pitch?: number }} opts
 */
export function playBell({ strong = false, pitch = 196 } = {}) {
  if (!soundOn()) return
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const master = ac.createGain()
  master.gain.value = strong ? 0.5 : 0.32
  master.connect(ac.destination)
  const partials = [
    [1, 1, 7],
    [2.0, 0.5, 5],
    [2.76, 0.42, 4.2],
    [5.4, 0.22, 2.6],
    [8.93, 0.12, 1.6],
  ]
  const ring = strong ? 1.4 : 1
  for (const [ratio, amp, decay] of partials) {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = pitch * ratio
    // Lệch nhẹ tần số tạo hiệu ứng "ngân" (beating)
    osc.detune.value = (ratio * 7) % 5
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(amp, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay * ring)
    osc.connect(g).connect(master)
    osc.start(t)
    osc.stop(t + decay * ring + 0.1)
  }
}

/** Rung nhẹ trên thiết bị di động (nếu hỗ trợ và được bật). */
export function haptic(pattern = 12) {
  if (!getState().settings.haptics) return
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}
