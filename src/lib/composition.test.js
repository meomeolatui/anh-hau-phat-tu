import { describe, expect, it } from 'vitest'
import { BPM, CHORDS, CYCLE_BEATS, NGU_CUNG, ROOT_MIDI, SECTIONS, chimes, degreeToMidi, melody, sectionAt } from './composition'

const inScale = (midi) => NGU_CUNG.includes((((midi - ROOT_MIDI) % 12) + 12) % 12)

describe('Vân Sơn Thiên Khúc — nhạc thiền tự soạn', () => {
  it('nhịp chậm kiểu nhạc thiền', () => {
    expect(BPM).toBeLessThanOrEqual(56)
  })

  it('mọi hợp âm chỉ gồm nốt ngũ cung', () => {
    for (const c of CHORDS) for (const d of c) expect(inScale(degreeToMidi(d))).toBe(true)
  })

  it('giai điệu sáo & đàn tranh: đúng ngũ cung, nằm trong đoạn, không chồng nốt, ổn định theo seed', () => {
    for (const voice of ['flute', 'zither']) {
      const m = melody(4, 36, voice)
      expect(m).toEqual(melody(4, 36, voice))
      expect(m.length).toBeGreaterThan(1)
      let end = 0
      for (const n of m) {
        expect(inScale(degreeToMidi(n.degree))).toBe(true)
        expect(n.beat).toBeGreaterThanOrEqual(end)
        expect(n.beat + n.len).toBeLessThanOrEqual(36)
        end = n.beat + n.len
      }
    }
  })

  it('thưa và có khoảng lặng: tổng thời gian nghỉ ≥ 25% đoạn, mỗi nốt sáo ≥ 3 phách', () => {
    for (let seed = 1; seed < 6; seed++) {
      const m = melody(seed, 36, 'flute')
      const sounding = m.reduce((s, n) => s + n.len, 0)
      expect(sounding / 36).toBeLessThanOrEqual(0.75)
      for (const n of m.slice(0, -1)) expect(n.len).toBeGreaterThanOrEqual(3)
    }
  })

  it('đàn tranh chỉ điểm vài nốt (thưa hơn sáo)', () => {
    expect(melody(9, 24, 'zither').length).toBeLessThanOrEqual(melody(9, 24, 'flute').length + 1)
    expect(melody(9, 24, 'zither').length).toBeLessThanOrEqual(5)
  })

  it('mỗi vòng đổi giai điệu (seed khác → câu khác)', () => {
    expect(melody(1, 36, 'flute')).not.toEqual(melody(2, 36, 'flute'))
  })

  it('chuông gió hiếm hoi, ở quãng cao', () => {
    const c = chimes(3, 36, CHORDS[0])
    expect(c.length).toBeLessThanOrEqual(8)
    for (const s of c) expect(degreeToMidi(s.degree)).toBeGreaterThan(ROOT_MIDI + 12)
  })

  it('bố cục: Tĩnh lặng → Sáo thiền → Đàn tranh → Hơi thở, lặp vòng; hợp âm phủ kín đoạn', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['tinh-lang', 'sao-thien', 'dan-tranh', 'hoi-tho'])
    expect(sectionAt(0).section.id).toBe('tinh-lang')
    expect(sectionAt(24).section.id).toBe('sao-thien')
    expect(sectionAt(CYCLE_BEATS + 70).section.id).toBe('dan-tranh')
    for (const s of SECTIONS) expect(s.chords.length * s.chordBeats).toBe(s.beats)
  })
})
