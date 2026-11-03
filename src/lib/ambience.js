import { getState, subscribe } from '../game/state'
import { getAudioContext } from './sound'

/**
 * Âm thanh nền núi rừng tổng hợp bằng Web Audio — không cần file âm thanh:
 *  - gió nhẹ: nhiễu trắng lọc thông thấp, cường độ/tần số dao động chậm
 *  - chim hót: chuỗi tiếng líu lo ngẫu nhiên ban ngày
 *  - dế kêu: chuỗi xung cao ban đêm
 * Bật khi settings.sound VÀ settings.music đều bật; tự tắt khi tab ẩn.
 *
 * API: startAmbience(), stopAmbience(), setAmbienceTime(hour)
 */

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Mức các lớp âm (0..1) theo giờ trong ngày */
export function ambienceMix(hour) {
  const h = ((Number(hour) % 24) + 24) % 24
  const day = smoothstep(5, 6.5, h) * (1 - smoothstep(17.6, 19, h))
  // Chim hót rộn ràng nhất buổi sáng sớm, thưa dần trưa chiều
  const morning = 1 - smoothstep(9, 11, h)
  const birds = day * (0.55 + 0.45 * morning)
  const crickets = 1 - smoothstep(4.8, 6.2, h) * (1 - smoothstep(18.2, 19.6, h))
  const wind = 0.55 + 0.3 * (1 - day)
  return { wind, birds, crickets }
}

/** Âm thanh nền chỉ bật khi cả âm thanh lẫn nhạc nền đều bật */
export function ambienceEnabled(settings) {
  return Boolean(settings) && settings.sound !== false && settings.music !== false
}

/** Khoảng nghỉ (ms) trước lượt chim hót / dế kêu tiếp theo; rand() trong [0,1) */
export function nextCallDelay(kind, rand = Math.random) {
  return kind === 'bird' ? 2200 + rand() * 6000 : 700 + rand() * 900
}

/* ---------------- Bộ máy âm thanh ---------------- */

let engine = null // { unsub, onVisibility, onGesture, nodes }
let hour = 12

function noiseBuffer(ac, seconds = 2) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate)
  const data = buf.getChannelData(0)
  // Nhiễu hồng gần đúng (lọc Paul Kellet rút gọn) — dịu tai hơn nhiễu trắng
  let b0 = 0
  let b1 = 0
  let b2 = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + white * 0.099046
    b1 = 0.963 * b1 + white * 0.2965164
    b2 = 0.57 * b2 + white * 1.0526913
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12
  }
  return buf
}

function build(ac) {
  const t = ac.currentTime
  const master = ac.createGain()
  master.gain.setValueAtTime(0.0001, t)
  master.gain.exponentialRampToValueAtTime(1, t + 2.5)
  master.connect(ac.destination)

  // Gió
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  src.loop = true
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 420
  filter.Q.value = 0.6
  const windGain = ac.createGain()
  windGain.gain.value = 0.05
  const lfo = ac.createOscillator()
  lfo.frequency.value = 0.07
  const lfoDepth = ac.createGain()
  lfoDepth.gain.value = 220
  lfo.connect(lfoDepth).connect(filter.frequency)
  const lfo2 = ac.createOscillator()
  lfo2.frequency.value = 0.045
  const lfo2Depth = ac.createGain()
  lfo2Depth.gain.value = 0.025
  lfo2.connect(lfo2Depth).connect(windGain.gain)
  src.connect(filter).connect(windGain).connect(master)
  src.start(t)
  lfo.start(t)
  lfo2.start(t)

  const nodes = { ac, master, windGain, sources: [src, lfo, lfo2], timers: new Set() }
  applyMix(nodes)
  schedule(nodes, 'bird', 1500)
  schedule(nodes, 'cricket', 800)
  return nodes
}

function applyMix(nodes) {
  const mix = ambienceMix(hour)
  nodes.windGain.gain.setTargetAtTime(0.045 * mix.wind, nodes.ac.currentTime, 1.5)
}

function schedule(nodes, kind, delay) {
  const id = setTimeout(() => {
    nodes.timers.delete(id)
    const mix = ambienceMix(hour)
    const level = kind === 'bird' ? mix.birds : mix.crickets
    if (level > 0.05 && Math.random() < 0.35 + level * 0.65) {
      if (kind === 'bird') chirp(nodes, level)
      else cricket(nodes, level)
    }
    schedule(nodes, kind, nextCallDelay(kind))
  }, delay)
  nodes.timers.add(id)
}

function panned(ac, dest) {
  if (!ac.createStereoPanner) return dest
  const p = ac.createStereoPanner()
  p.pan.value = Math.random() * 1.6 - 0.8
  p.connect(dest)
  return p
}

/** Một chuỗi 2–5 tiếng líu lo, tần số quét nhanh */
function chirp(nodes, level) {
  const { ac, master } = nodes
  const out = panned(ac, master)
  const base = 2600 + Math.random() * 1800
  const notes = 2 + Math.floor(Math.random() * 4)
  let t = ac.currentTime + 0.05
  for (let i = 0; i < notes; i++) {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    const f = base * (0.9 + Math.random() * 0.25)
    const dur = 0.06 + Math.random() * 0.08
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.exponentialRampToValueAtTime(f * (1.15 + Math.random() * 0.35), t + dur * 0.7)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.022 * level, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.02)
    t += dur + 0.04 + Math.random() * 0.08
  }
}

/** Dế kêu: 3–4 xung ngắn ~4.6 kHz */
function cricket(nodes, level) {
  const { ac, master } = nodes
  const out = panned(ac, master)
  const f = 4300 + Math.random() * 700
  let t = ac.currentTime + 0.03
  const pulses = 3 + Math.floor(Math.random() * 2)
  for (let i = 0; i < pulses; i++) {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.012 * level, t + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 0.04)
    t += 0.055
  }
}

function teardown(nodes) {
  nodes.timers.forEach((id) => clearTimeout(id))
  nodes.timers.clear()
  const { ac, master } = nodes
  const t = ac.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t)
  master.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
  for (const s of nodes.sources) {
    try {
      s.stop(t + 0.7)
    } catch {
      // nguồn đã dừng trước đó — không cần làm gì
    }
  }
  setTimeout(() => master.disconnect(), 800)
}

function shouldPlay() {
  const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
  return ambienceEnabled(getState().settings) && !hidden
}

function sync() {
  if (!engine) return
  const on = shouldPlay()
  if (on && !engine.nodes) {
    const ac = getAudioContext()
    if (ac) engine.nodes = build(ac)
  } else if (!on && engine.nodes) {
    teardown(engine.nodes)
    engine.nodes = null
  }
}

/** Bắt đầu phát âm thanh nền (gọi một lần khi vào game). An toàn khi gọi lặp lại. */
export function startAmbience() {
  if (engine || typeof window === 'undefined') return
  engine = { nodes: null }
  // Theo dõi cài đặt (bật/tắt âm thanh, nhạc nền) — sync() rất nhẹ khi không có gì thay đổi
  engine.unsub = subscribe(sync)
  engine.onVisibility = () => sync()
  document.addEventListener('visibilitychange', engine.onVisibility)
  // Trình duyệt chặn âm thanh tới khi người dùng thao tác: thử resume ở lần chạm/phím đầu tiên
  engine.onGesture = () => {
    if (!shouldPlay()) return
    const ac = getAudioContext()
    if (ac && ac.state === 'running') {
      window.removeEventListener('pointerdown', engine.onGesture)
      window.removeEventListener('keydown', engine.onGesture)
    }
    sync()
  }
  window.addEventListener('pointerdown', engine.onGesture)
  window.addEventListener('keydown', engine.onGesture)
  sync()
}

/** Dừng hẳn âm thanh nền và gỡ mọi bộ lắng nghe */
export function stopAmbience() {
  if (!engine) return
  engine.unsub?.()
  document.removeEventListener('visibilitychange', engine.onVisibility)
  window.removeEventListener('pointerdown', engine.onGesture)
  window.removeEventListener('keydown', engine.onGesture)
  if (engine.nodes) teardown(engine.nodes)
  engine = null
}

/** Cập nhật giờ trong ngày (0..24) để pha trộn chim hót / dế kêu / gió */
export function setAmbienceTime(h) {
  if (!Number.isFinite(h)) return
  hour = h
  if (engine?.nodes) applyMix(engine.nodes)
}

/** Chỉ dùng trong test */
export function __ambienceRunning() {
  return Boolean(engine)
}
