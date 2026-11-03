import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, PREFS_KEY, SESSION_KEY, clearSession, loadPrefs, loadSession, sanitizePrefs, sanitizeSession, savePrefs, saveSession } from './storage'
import { cleanMantra, findMantra, MANTRAS, MAX_MANTRA_LENGTH } from './mantras'
import { shouldCountKey } from './keyboard'

describe('tuỳ chọn tràng hạt', () => {
  it('trả về mặc định khi chưa có hoặc dữ liệu hỏng', () => {
    expect(loadPrefs()).toEqual({ ...DEFAULT_PREFS })
    localStorage.setItem(PREFS_KEY, '{hỏng')
    expect(loadPrefs()).toEqual({ ...DEFAULT_PREFS })
  })

  it('loại bỏ giá trị không hợp lệ', () => {
    expect(sanitizePrefs({ size: 99, mo: 'yes', mode: 'xyz', bpm: 999, celebrated: 5 })).toEqual({ ...DEFAULT_PREFS, bpm: 120 })
  })

  it('lưu và đọc lại', () => {
    savePrefs({ size: 27, mo: true, mode: 'mo', bpm: 80, celebrated: '2026-11-02' })
    expect(loadPrefs()).toEqual({ size: 27, mo: true, mode: 'mo', bpm: 80, celebrated: '2026-11-02' })
  })
})

describe('phiên đang dở', () => {
  it('khôi phục phiên đã lưu', () => {
    const s = { total: 40, bead: 13, rounds: 1, pending: 2, activeMs: 50_000, startedAt: 1, lastAt: 2 }
    saveSession(s)
    expect(loadSession(27)).toEqual(s)
    clearSession()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
    expect(loadSession().total).toBe(0)
  })

  it('làm sạch số âm, NaN và vị trí hạt vượt quá chuỗi', () => {
    const s = sanitizeSession({ total: -3, bead: 50, rounds: 'a', pending: 2.7, activeMs: NaN, startedAt: -1 }, 21)
    expect(s).toEqual({ total: 0, bead: 0, rounds: 0, pending: 2, activeMs: 0, startedAt: null, lastAt: null })
  })
})

describe('câu niệm', () => {
  it('chuẩn hoá khoảng trắng và giới hạn độ dài', () => {
    expect(cleanMantra('  Nam   mô  Quán Thế Âm  ')).toBe('Nam mô Quán Thế Âm')
    expect(cleanMantra('a'.repeat(200))).toHaveLength(MAX_MANTRA_LENGTH)
    expect(cleanMantra(null)).toBe('')
  })

  it('nhận ra câu niệm có sẵn, không phân biệt hoa thường', () => {
    expect(findMantra('nam mô a di đà phật')?.id).toBe('a-di-da')
    expect(findMantra('Câu tự nhập')).toBeNull()
    expect(findMantra('')).toBeNull()
  })

  it('danh sách có đủ 6 câu với id không trùng', () => {
    expect(MANTRAS).toHaveLength(6)
    expect(new Set(MANTRAS.map((m) => m.id)).size).toBe(6)
  })
})

describe('shouldCountKey', () => {
  const pad = document.createElement('button')
  const ev = (key, target = document.body, extra = {}) => ({ key, target, ...extra })

  it('đếm Space/Enter/↓ khi không focus vào điều khiển nào', () => {
    expect(shouldCountKey(ev(' '), pad)).toBe(true)
    expect(shouldCountKey(ev('Enter'), pad)).toBe(true)
    expect(shouldCountKey(ev('ArrowDown'), pad)).toBe(true)
    expect(shouldCountKey(ev('a'), pad)).toBe(false)
  })

  it('không cướp phím của ô nhập, nút khác, tổ hợp phím hay khi có hộp thoại', () => {
    const input = document.createElement('input')
    const other = document.createElement('button')
    expect(shouldCountKey(ev(' ', input), pad)).toBe(false)
    expect(shouldCountKey(ev('Enter', other), pad)).toBe(false)
    expect(shouldCountKey(ev(' ', document.body, { ctrlKey: true }), pad)).toBe(false)
    expect(shouldCountKey(ev(' '), pad, { dialogOpen: true })).toBe(false)
  })

  it('trên vùng chạm chỉ xử lý ↓ (Space/Enter đã tự sinh click)', () => {
    expect(shouldCountKey(ev(' ', pad), pad)).toBe(false)
    expect(shouldCountKey(ev('ArrowDown', pad), pad)).toBe(true)
  })
})
