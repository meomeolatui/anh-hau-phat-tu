/**
 * "Vân Sơn Thiên Khúc" — bản nhạc nền tự soạn cho game, phong cách NHẠC THIỀN
 * (thuần dữ liệu, test được; music.js phát).
 * Chậm, thưa, nhiều khoảng lặng: nền pad ấm, chuông xoay (singing bowl) ngân rung,
 * sáo trúc thở dài, đàn tranh điểm vài nốt, chuông gió hiếm hoi — trên thang ngũ cung Việt.
 *
 * Đơn vị thời gian: phách (beat). Nhịp rất chậm 50 phách/phút.
 */

export const BPM = 50
export const BEAT = 60 / BPM

/** Ngũ cung trên chủ âm Rê: Rê – Mi – Sol – La – Si (bậc 0..4; bậc 5 = Rê quãng tám trên) */
export const NGU_CUNG = [0, 2, 5, 7, 9]
export const ROOT_MIDI = 62

export function degreeToMidi(degree, root = ROOT_MIDI) {
  const n = NGU_CUNG.length
  const oct = Math.floor(degree / n)
  const idx = ((degree % n) + n) % n
  return root + oct * 12 + NGU_CUNG[idx]
}

/**
 * Hợp âm "treo" mở rộng (quãng 4, quãng 5 — không có quãng ba) — rỗng, tĩnh, không kéo cảm xúc.
 */
export const CHORDS = [
  [0, 3, 5], // Rê – La – Rê
  [2, 5, 7], // Sol – Rê – Sol
  [0, 2, 5], // Rê – Sol – Rê
  [3, 5, 8], // La – Rê – La
]

/**
 * Các đoạn (lặp vòng). voices: bè trong đoạn; mỗi hợp âm ngân `chordBeats` phách.
 *  pad      nền ấm ngân dài          drone  nền trầm Rê–La
 *  bowl     chuông xoay ở đầu đoạn    chime  chuông gió (hiếm)
 *  flute    sáo trúc (thưa)          zither đàn tranh (điểm vài nốt)
 *  gong     cồng rất khẽ
 */
export const SECTIONS = [
  { id: 'tinh-lang', beats: 24, chordBeats: 12, chords: [0, 2], voices: ['drone', 'pad', 'bowl'] },
  { id: 'sao-thien', beats: 36, chordBeats: 12, chords: [0, 1, 2], voices: ['drone', 'pad', 'flute', 'bowl', 'chime'] },
  { id: 'dan-tranh', beats: 24, chordBeats: 12, chords: [1, 3], voices: ['drone', 'pad', 'zither', 'chime'] },
  { id: 'hoi-tho', beats: 24, chordBeats: 12, chords: [2, 0], voices: ['drone', 'pad', 'bowl', 'gong'] },
]

export const CYCLE_BEATS = SECTIONS.reduce((s, x) => s + x.beats, 0)

/** Sinh số giả ngẫu nhiên xác định */
export function rng(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

/**
 * Giai điệu thiền: nốt dài, đi bậc liền kề, NGHỈ NHIỀU giữa các nốt (khoảng lặng là một phần của nhạc).
 * Sáo: nốt 3–6 phách; đàn tranh: chỉ vài nốt gảy cách xa nhau. Kết đoạn về Rê hoặc La.
 * @param {'flute'|'zither'} voice
 * @returns [{ beat (bắt đầu, tính từ đầu đoạn), len (phách), degree, bend, vibrato }]
 */
export function melody(seed, beats, voice = 'flute') {
  const r = rng(seed * 31 + (voice === 'flute' ? 7 : 13))
  const lens = voice === 'flute' ? [3, 4, 4, 5, 6] : [2, 3, 3, 4]
  const rests = voice === 'flute' ? [1, 2, 2, 3] : [3, 4, 5, 6]
  const out = []
  let beat = voice === 'flute' ? 3 : 2
  let deg = 3 + Math.floor(r() * 2)
  while (beat < beats - 3) {
    const len = lens[Math.floor(r() * lens.length)]
    const step = [-1, -1, 0, 1, 1, 2, -2][Math.floor(r() * 7)]
    deg = Math.max(2, Math.min(7, deg + step))
    out.push({ beat, len: Math.min(len, beats - 1 - beat), degree: deg, bend: r() < 0.4, vibrato: len >= 4 || r() < 0.3 })
    beat += len + rests[Math.floor(r() * rests.length)]
  }
  if (out.length) out[out.length - 1].degree = r() < 0.5 ? 5 : 3
  return out
}

/** Chuông gió: rất hiếm, vài tiếng lác đác ở quãng cao */
export function chimes(seed, beats, chord) {
  const r = rng(seed * 17 + 5)
  const out = []
  for (let b = 0; b < beats; b += 1) {
    if (r() < 0.07) out.push({ beat: b + r() * 0.5, degree: chord[Math.floor(r() * chord.length)] + 10 })
  }
  return out
}

/** Đoạn & vị trí trong vòng tại phách thứ `beat` (tính từ đầu bản) */
export function sectionAt(beat) {
  let b = ((beat % CYCLE_BEATS) + CYCLE_BEATS) % CYCLE_BEATS
  for (let i = 0; i < SECTIONS.length; i++) {
    if (b < SECTIONS[i].beats) return { index: i, section: SECTIONS[i], beatInSection: b }
    b -= SECTIONS[i].beats
  }
  return { index: 0, section: SECTIONS[0], beatInSection: 0 }
}
