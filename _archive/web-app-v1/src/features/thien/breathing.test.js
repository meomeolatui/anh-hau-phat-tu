import { describe, expect, it } from 'vitest'
import { BREATH_PATTERNS, SCALE_EMPTY, SCALE_FULL, breathsPerMinute, cycleMs, getBreathPhase, getPattern, scaleAt } from './breathing'

const p = (id) => getPattern(id)

describe('getPattern', () => {
  it('trả về kiểu mặc định khi id không tồn tại', () => {
    expect(getPattern('khong-co').id).toBe('deu-4-4')
  })

  it('có đủ 5 kiểu thở theo đặc tả', () => {
    expect(BREATH_PATTERNS.map((x) => x.label)).toEqual(['Tự nhiên', 'Thở đều 4–4', 'Thư giãn 4–7–8', 'Hộp 4–4–4–4', 'Thở chậm 5–5'])
  })
})

describe('cycleMs', () => {
  it('tính đúng độ dài chu kỳ', () => {
    expect(cycleMs(p('deu-4-4'))).toBe(8000)
    expect(cycleMs(p('thu-gian-4-7-8'))).toBe(19000)
    expect(cycleMs(p('hop-4-4-4-4'))).toBe(16000)
    expect(cycleMs(p('cham-5-5'))).toBe(10000)
    expect(cycleMs(p('tu-nhien'))).toBe(0)
  })
})

describe('getBreathPhase', () => {
  it('kiểu tự nhiên không có pha', () => {
    expect(getBreathPhase(p('tu-nhien'), 5000)).toBeNull()
  })

  it('bắt đầu bằng hít vào, đếm ngược từ 4', () => {
    const ph = getBreathPhase(p('deu-4-4'), 0)
    expect(ph.kind).toBe('in')
    expect(ph.label).toBe('Hít vào…')
    expect(ph.remainingSec).toBe(4)
    expect(ph.cycle).toBe(0)
  })

  it('chuyển pha đúng mốc và đếm ngược không về 0', () => {
    const pat = p('deu-4-4')
    expect(getBreathPhase(pat, 3999).kind).toBe('in')
    expect(getBreathPhase(pat, 3999).remainingSec).toBe(1)
    expect(getBreathPhase(pat, 4000).kind).toBe('out')
    expect(getBreathPhase(pat, 4000).label).toBe('Thở ra…')
  })

  it('4–7–8: hít 4, giữ 7, thở 8 rồi lặp lại', () => {
    const pat = p('thu-gian-4-7-8')
    expect(getBreathPhase(pat, 2000).kind).toBe('in')
    expect(getBreathPhase(pat, 4000).kind).toBe('holdIn')
    expect(getBreathPhase(pat, 4000).label).toBe('Giữ…')
    expect(getBreathPhase(pat, 4000).remainingSec).toBe(7)
    expect(getBreathPhase(pat, 11000).kind).toBe('out')
    expect(getBreathPhase(pat, 11000).remainingSec).toBe(8)
    const next = getBreathPhase(pat, 19000)
    expect(next.kind).toBe('in')
    expect(next.cycle).toBe(1)
  })

  it('kiểu hộp có pha giữ sau khi thở ra', () => {
    const pat = p('hop-4-4-4-4')
    expect(getBreathPhase(pat, 12500).kind).toBe('holdOut')
    expect(getBreathPhase(pat, 12500).index).toBe(3)
  })

  it('đúng cả khi thời gian rất dài (tab ẩn lâu)', () => {
    const pat = p('cham-5-5')
    const ph = getBreathPhase(pat, 3600 * 1000 + 6000)
    expect(ph.kind).toBe('out')
    expect(ph.cycle).toBe(360)
  })

  it('chịu được giá trị âm/không hợp lệ', () => {
    expect(getBreathPhase(p('deu-4-4'), -50).kind).toBe('in')
    expect(getBreathPhase(p('deu-4-4'), Number.NaN).kind).toBe('in')
  })
})

describe('scaleAt', () => {
  it('nội suy từ nhỏ đến lớn khi hít vào', () => {
    const pat = p('deu-4-4')
    expect(scaleAt(getBreathPhase(pat, 0))).toBeCloseTo(SCALE_EMPTY)
    expect(scaleAt(getBreathPhase(pat, 2000))).toBeCloseTo((SCALE_EMPTY + SCALE_FULL) / 2)
    expect(scaleAt(getBreathPhase(pat, 4000))).toBeCloseTo(SCALE_FULL)
  })

  it('giữ nguyên kích thước khi giữ hơi', () => {
    const pat = p('hop-4-4-4-4')
    expect(scaleAt(getBreathPhase(pat, 6000))).toBe(SCALE_FULL)
    expect(scaleAt(getBreathPhase(pat, 14000))).toBe(SCALE_EMPTY)
  })

  it('không có pha thì trả kích thước đầy', () => {
    expect(scaleAt(null)).toBe(SCALE_FULL)
  })
})

describe('breathsPerMinute', () => {
  it('tính số hơi thở mỗi phút', () => {
    expect(breathsPerMinute(p('cham-5-5'))).toBe(6)
    expect(breathsPerMinute(p('deu-4-4'))).toBe(7.5)
    expect(breathsPerMinute(p('tu-nhien'))).toBeNull()
  })
})
