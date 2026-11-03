import { getAudioContext } from './sound'
import { getState, subscribe } from '../game/state'
import { BEAT, CHORDS, ROOT_MIDI, SECTIONS, chimes, degreeToMidi, melody, sectionAt } from './composition'

/**
 * Nhạc nền.
 * 1) Ưu tiên phát file người dùng đặt tại public/nhac/khuc-nhac-thien-dinh.mp3 (lặp vô tận).
 *    Lưu ý bản quyền: chỉ đặt file mà bạn có quyền sử dụng.
 * 2) Nếu không có file: phát "Vân Sơn Thiên Khúc" — bản NHẠC THIỀN tự soạn (composition.js) tổng hợp bằng Web Audio:
 *    nền pad ấm, chuông xoay ngân rung, sáo trúc thưa, đàn tranh điểm nốt, chuông gió, cồng khẽ, vang dài.
 * Tôn trọng settings.sound / settings.bgm / settings.bgmVolume; "hạ nhạc" (duck) khi thiền, tụng kinh.
 */

export const MUSIC_FILE = '/nhac/khuc-nhac-thien-dinh.mp3'
export { NGU_CUNG, ROOT_MIDI } from './composition'

export const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12)
/** Giữ tên cũ cho mã khác dùng */
export const nguCungMidi = (degree, root = ROOT_MIDI) => degreeToMidi(degree, root)

/** Có được phát nhạc nền (file mp3 của bạn hoặc bản tự soạn) không */
export function musicEnabled(settings) {
  return Boolean(settings) && settings.sound !== false && settings.bgm !== false
}

/* ------------------------------------------------------------------ */
/* Các "nhạc cụ" tổng hợp                                             */
/* ------------------------------------------------------------------ */

/** Vang rộng như điện thờ: xung đáp ứng nhiễu tắt dần ~6 giây, hai kênh lệch nhau */
function makeReverb(ac, seconds = 6) {
  const len = Math.floor(ac.sampleRate * seconds)
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.8
  }
  const conv = ac.createConvolver()
  conv.buffer = buf
  return conv
}

/** Tiếng vọng trái – phải (ping-pong) cho chuông và sáo */
function makeEcho(ac, time = BEAT * 0.75, feedback = 0.38) {
  const input = ac.createGain()
  const out = ac.createGain()
  const dl = ac.createDelay(2)
  const dr = ac.createDelay(2)
  dl.delayTime.value = time
  dr.delayTime.value = time
  const fb = ac.createGain()
  fb.gain.value = feedback
  const tone = ac.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 3200
  const panL = ac.createStereoPanner()
  const panR = ac.createStereoPanner()
  panL.pan.value = -0.7
  panR.pan.value = 0.7
  input.connect(dl)
  dl.connect(panL).connect(out)
  dl.connect(dr)
  dr.connect(panR).connect(out)
  dr.connect(tone).connect(fb).connect(dl)
  return { input, out }
}

/**
 * Nền pad ấm (giọng "u…" rất mềm): sóng tam giác + sin lệch nhẹ, lọc thấp, một formant nhẹ,
 * vào–ra cực chậm để không có cạnh — nghe như hơi thở dài.
 */
function warmPad(s, when, degrees, len) {
  const { ac } = s
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, when)
  env.gain.linearRampToValueAtTime(0.045, when + Math.min(5, len * 0.45))
  env.gain.setValueAtTime(0.045, when + len - 1)
  env.gain.linearRampToValueAtTime(0.0001, when + len + 5)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1100
  const bp = ac.createBiquadFilter()
  bp.type = 'peaking'
  bp.frequency.value = 520 // formant "u" mềm
  bp.Q.value = 1.2
  bp.gain.value = 5
  bp.connect(lp).connect(env).connect(s.pad)
  for (const d of degrees) {
    const f = midiToHz(degreeToMidi(d, ROOT_MIDI - 12))
    for (const [type, det] of [
      ['triangle', -7],
      ['sine', 0],
      ['triangle', 7],
    ]) {
      const o = ac.createOscillator()
      o.type = type
      o.frequency.value = f
      o.detune.value = det
      const lfo = ac.createOscillator()
      const lg = ac.createGain()
      lfo.frequency.value = 0.15 + Math.random() * 0.1 // trôi rất chậm như sóng
      lg.gain.value = 5
      lfo.connect(lg).connect(o.detune)
      o.connect(bp)
      o.start(when)
      o.stop(when + len + 5.2)
      lfo.start(when)
      lfo.stop(when + len + 5.2)
    }
  }
}

/**
 * Chuông xoay (singing bowl): hoạ âm không điều hoà, hai dao động lệch 1–2 Hz tạo tiếng "ngân rung"
 * (wah–wah), tắt dần rất lâu.
 */
function singingBowl(s, when, midi) {
  const { ac } = s
  const f = midiToHz(midi)
  for (const [ratio, amp, decay] of [
    [1, 0.09, 14],
    [2.71, 0.035, 9],
    [5.15, 0.012, 5],
  ]) {
    for (const beat of [0, 1.4]) {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.type = 'sine'
      o.frequency.value = f * ratio + beat
      g.gain.setValueAtTime(0.0001, when)
      g.gain.exponentialRampToValueAtTime(amp / 2, when + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, when + decay)
      o.connect(g).connect(s.pad)
      o.start(when)
      o.stop(when + decay + 0.1)
    }
  }
}

/** Nền trầm: Rê + La rất thấp, nhịp thở chậm */
function drone(s, when, len) {
  const { ac } = s
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, when)
  env.gain.linearRampToValueAtTime(0.06, when + 4)
  env.gain.setValueAtTime(0.06, when + len - 1)
  env.gain.linearRampToValueAtTime(0.0001, when + len + 2)
  env.connect(s.pad)
  for (const m of [ROOT_MIDI - 24, ROOT_MIDI - 17]) {
    const o = ac.createOscillator()
    o.type = 'sine'
    o.frequency.value = midiToHz(m)
    o.connect(env)
    o.start(when)
    o.stop(when + len + 2.2)
  }
}

/** Sáo trúc: sóng sin trong + hơi thổi (nhiễu lọc), luyến từ dưới lên, rung cuối nốt */
function flute(s, when, midi, len, { bend, vibrato }) {
  const { ac } = s
  const f = midiToHz(midi + 12)
  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, when)
  env.gain.linearRampToValueAtTime(0.11, when + 0.12)
  env.gain.setValueAtTime(0.1, when + Math.max(0.15, len - 0.25))
  env.gain.linearRampToValueAtTime(0.0001, when + len + 0.35)
  env.connect(s.lead)
  const o = ac.createOscillator()
  o.type = 'sine'
  if (bend) {
    o.frequency.setValueAtTime(f * 0.94, when)
    o.frequency.exponentialRampToValueAtTime(f, when + 0.18)
  } else o.frequency.setValueAtTime(f, when)
  const h2 = ac.createOscillator()
  h2.type = 'sine'
  h2.frequency.value = f * 2
  const h2g = ac.createGain()
  h2g.gain.value = 0.12
  h2.connect(h2g).connect(env)
  if (vibrato) {
    const lfo = ac.createOscillator()
    const depth = ac.createGain()
    lfo.frequency.value = 5.3
    depth.gain.setValueAtTime(0, when)
    depth.gain.linearRampToValueAtTime(f * 0.014, when + Math.min(1.2, len * 0.6))
    lfo.connect(depth).connect(o.frequency)
    lfo.start(when)
    lfo.stop(when + len + 0.5)
  }
  o.connect(env)
  // Hơi thổi
  const noise = ac.createBufferSource()
  noise.buffer = s.noise
  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = f * 1.5
  bp.Q.value = 3
  const ng = ac.createGain()
  ng.gain.value = 0.18
  noise.connect(bp).connect(ng).connect(env)
  for (const n of [o, h2, noise]) {
    n.start(when)
    n.stop(when + len + 0.5)
  }
}

/** Đàn tranh / đàn hạc: gảy sáng, tắt dần; có luyến và rung */
function pluck(s, when, midi, { bend = false, vibrato = false, bright = 1, gain = 0.26 } = {}) {
  const { ac } = s
  const f = midiToHz(midi)
  const out = ac.createGain()
  out.gain.setValueAtTime(0.0001, when)
  out.gain.exponentialRampToValueAtTime(gain, when + 0.005)
  out.gain.exponentialRampToValueAtTime(0.0001, when + 3)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(f * 7 * bright, when)
  lp.frequency.exponentialRampToValueAtTime(f * 2, when + 1.3)
  lp.connect(out).connect(s.lead)
  for (const [type, mul, amp] of [
    ['triangle', 1, 1],
    ['sine', 2, 0.35],
    ['sine', 3, 0.12],
  ]) {
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = type
    const base = f * mul
    if (bend) {
      o.frequency.setValueAtTime(base * 0.9, when)
      o.frequency.exponentialRampToValueAtTime(base, when + 0.12)
    } else o.frequency.setValueAtTime(base, when)
    if (vibrato) {
      const lfo = ac.createOscillator()
      const depth = ac.createGain()
      lfo.frequency.value = 5.2
      depth.gain.setValueAtTime(0, when)
      depth.gain.linearRampToValueAtTime(base * 0.012, when + 0.6)
      lfo.connect(depth).connect(o.frequency)
      lfo.start(when + 0.25)
      lfo.stop(when + 3.1)
    }
    g.gain.value = amp
    o.connect(g).connect(lp)
    o.start(when)
    o.stop(when + 3.1)
  }
}

/** Chuông lấp lánh (celesta): nốt cao, hoạ âm chuông, ngắn, đi qua tiếng vọng */
function sparkle(s, when, midi) {
  const { ac } = s
  const f = midiToHz(midi)
  for (const [ratio, amp, decay] of [
    [1, 0.05, 1.6],
    [2.76, 0.018, 0.9],
    [4.07, 0.008, 0.5],
  ]) {
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = 'sine'
    o.frequency.value = f * ratio
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(amp, when + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay)
    o.connect(g).connect(s.shine)
    o.start(when)
    o.stop(when + decay + 0.05)
  }
}

/** Cồng trầm ngân xa */
function gong(s, when) {
  const { ac } = s
  const base = midiToHz(ROOT_MIDI - 26)
  for (const [ratio, amp, decay] of [
    [1, 0.08, 10],
    [1.48, 0.035, 8],
    [2.1, 0.022, 6],
    [2.94, 0.012, 4],
  ]) {
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(base * ratio * 1.01, when)
    o.frequency.exponentialRampToValueAtTime(base * ratio, when + 1.5)
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(amp, when + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay)
    o.connect(g).connect(s.pad)
    o.start(when)
    o.stop(when + decay + 0.1)
  }
}

/* ------------------------------------------------------------------ */
/* Bộ phát: lập lịch từng đoạn của bản nhạc                           */
/* ------------------------------------------------------------------ */

function scheduleSection(s, when, index, cycle) {
  const sec = SECTIONS[index]
  const v = new Set(sec.voices)
  const seed = cycle * 10 + index + 1
  const t = (beat) => when + beat * BEAT
  sec.chords.forEach((ci, k) => {
    const start = t(k * sec.chordBeats)
    const len = sec.chordBeats * BEAT
    if (v.has('pad')) warmPad(s, start, CHORDS[ci], len)
    if (v.has('chime')) for (const n of chimes(seed * 7 + k, sec.chordBeats, CHORDS[ci])) sparkle(s, start + n.beat * BEAT, degreeToMidi(n.degree))
  })
  if (v.has('drone')) drone(s, when, sec.beats * BEAT)
  // Chuông xoay mở đầu đoạn (Rê hoặc La thấp), có khi gõ thêm một tiếng giữa đoạn
  if (v.has('bowl')) {
    singingBowl(s, when + 0.2, degreeToMidi(cycle % 2 ? 3 : 0, ROOT_MIDI - 12))
    if (sec.beats >= 30) singingBowl(s, t(sec.beats / 2), degreeToMidi(5, ROOT_MIDI - 12))
  }
  if (v.has('gong')) gong(s, t(sec.beats - 8))
  if (v.has('flute')) for (const n of melody(seed, sec.beats, 'flute')) flute(s, t(n.beat), degreeToMidi(n.degree), n.len * BEAT, n)
  if (v.has('zither')) for (const n of melody(seed + 100, sec.beats, 'zither')) pluck(s, t(n.beat), degreeToMidi(n.degree), { ...n, gain: 0.2 })
}

let audioEl = null
let mode = null // 'file' | 'synth' | 'paused' | null
let synth = null
let duck = 1
let unsub = null

const volumeOf = (settings) => Math.max(0, Math.min(1, settings.bgmVolume ?? 0.5))

function applyVolume() {
  const settings = getState().settings
  const v = volumeOf(settings) * duck
  if (audioEl) audioEl.volume = Math.min(1, v * 0.9)
  if (synth) synth.master.gain.setTargetAtTime(v * 0.8, synth.ac.currentTime, 0.8)
}

function startSynth() {
  const ac = getAudioContext()
  if (!ac) return null
  const master = ac.createGain()
  master.gain.value = 0
  const comp = ac.createDynamicsCompressor()
  comp.threshold.value = -18
  comp.ratio.value = 3
  master.connect(comp).connect(ac.destination)

  // Ba nhóm: pad (hợp xướng, nền, cồng) · lead (sáo, đàn) · shine (chuông) — vang & vọng khác nhau
  const reverb = makeReverb(ac, 8)
  const wet = ac.createGain()
  wet.gain.value = 0.85
  reverb.connect(wet).connect(master)
  const echo = makeEcho(ac)
  echo.out.connect(master)
  echo.out.connect(reverb)

  const pad = ac.createGain()
  pad.connect(master)
  pad.connect(reverb)
  const lead = ac.createGain()
  lead.connect(master)
  lead.connect(reverb)
  const leadEcho = ac.createGain()
  leadEcho.gain.value = 0.18
  lead.connect(leadEcho).connect(echo.input)
  const shine = ac.createGain()
  shine.connect(master)
  shine.connect(echo.input)

  // Nhiễu trắng dùng chung cho hơi sáo
  const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
  const nd = noise.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1

  const s = { ac, master, pad, lead, shine, noise, timers: [], start: ac.currentTime + 0.4, scheduledBeat: 0 }

  // Lập lịch từng đoạn trước khi tới (~3 giây), kiểm tra mỗi 500 ms
  const tick = () => {
    const now = ac.currentTime
    while (s.start + s.scheduledBeat * BEAT < now + 3) {
      const { index } = sectionAt(s.scheduledBeat)
      const cycle = Math.floor(s.scheduledBeat / SECTIONS.reduce((a, x) => a + x.beats, 0))
      scheduleSection(s, s.start + s.scheduledBeat * BEAT, index, cycle)
      s.scheduledBeat += SECTIONS[index].beats
    }
  }
  tick()
  s.timers.push(setInterval(tick, 500))
  return s
}

function stopSynth() {
  if (!synth) return
  synth.timers.forEach(clearInterval)
  const { master, ac } = synth
  master.gain.setTargetAtTime(0, ac.currentTime, 0.4)
  setTimeout(() => master.disconnect(), 1500)
  synth = null
}

function startFile() {
  audioEl = new Audio(MUSIC_FILE)
  audioEl.loop = true
  audioEl.preload = 'auto'
  audioEl.addEventListener('error', () => {
    // Không có file nhạc (hoặc không phát được) → dùng bản tự soạn
    audioEl = null
    if (mode === 'file') {
      mode = 'synth'
      synth = startSynth()
      applyVolume()
    }
  })
  applyVolume()
  // play() trả về Promise ở trình duyệt hiện đại; một số môi trường cũ trả về undefined
  const tryPlay = () => {
    const p = audioEl?.play()
    return p && typeof p.catch === 'function' ? p : Promise.resolve()
  }
  tryPlay().catch(() => {
    // Trình duyệt chặn tự phát: thử lại ở lần chạm/bấm phím đầu tiên
    const resume = () => tryPlay().catch(() => {})
    window.addEventListener('pointerdown', resume, { once: true })
    window.addEventListener('keydown', resume, { once: true })
  })
}

function syncWithSettings() {
  const enabled = musicEnabled(getState().settings)
  if (!enabled && mode && mode !== 'paused') {
    stopMusicNow()
    mode = 'paused'
  } else if (enabled && mode === 'paused') {
    mode = null
    startMusic()
  } else applyVolume()
}

function stopMusicNow() {
  if (audioEl) {
    audioEl.pause()
    audioEl = null
  }
  stopSynth()
}

/** Bắt đầu nhạc nền (gọi khi vào game, sau một thao tác của người dùng) */
export function startMusic() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return
  if (!unsub) unsub = subscribe(syncWithSettings)
  if (mode && mode !== 'paused') return
  if (!musicEnabled(getState().settings)) {
    mode = 'paused'
    return
  }
  mode = 'file'
  startFile()
}

export function stopMusic() {
  stopMusicNow()
  mode = null
  unsub?.()
  unsub = null
}

/** Hạ nhỏ nhạc (0..1) — vd. 0.35 khi đang thiền/tụng kinh */
export function setMusicDuck(factor) {
  duck = Math.max(0, Math.min(1, factor))
  applyVolume()
}
