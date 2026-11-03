import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFS, PREFS_KEY, clampMinutes, loadPrefs, sanitizePrefs, savePrefs } from './prefs'

describe('clampMinutes', () => {
  it('giới hạn trong 1–180 và làm tròn', () => {
    expect(clampMinutes(0)).toBe(1)
    expect(clampMinutes(-5)).toBe(1)
    expect(clampMinutes(500)).toBe(180)
    expect(clampMinutes('25')).toBe(25)
    expect(clampMinutes(12.6)).toBe(13)
  })

  it('không phải số thì trả null', () => {
    expect(clampMinutes('abc')).toBeNull()
    expect(clampMinutes('')).toBeNull()
    expect(clampMinutes(undefined)).toBeNull()
  })
})

describe('sanitizePrefs', () => {
  it('dữ liệu rỗng → mặc định', () => {
    expect(sanitizePrefs(null)).toEqual(DEFAULT_PREFS)
  })

  it('loại bỏ giá trị không hợp lệ, giữ giá trị hợp lệ', () => {
    const out = sanitizePrefs({ minutes: 999, pattern: 'la', bells: 'x', intervalMin: 5, prepSec: 7, prompts: false })
    expect(out).toEqual({ ...DEFAULT_PREFS, minutes: 180, intervalMin: 5, prompts: false })
  })
})

describe('loadPrefs / savePrefs', () => {
  it('lưu rồi đọc lại đúng', () => {
    savePrefs({ ...DEFAULT_PREFS, minutes: 45, pattern: 'cham-5-5', prepSec: 30 })
    expect(loadPrefs()).toMatchObject({ minutes: 45, pattern: 'cham-5-5', prepSec: 30 })
  })

  it('JSON hỏng thì dùng mặc định', () => {
    localStorage.setItem(PREFS_KEY, '{hỏng')
    expect(loadPrefs()).toEqual(DEFAULT_PREFS)
  })

  it('bộ nhớ bị chặn thì không ném lỗi', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    expect(loadPrefs(blocked)).toEqual(DEFAULT_PREFS)
    expect(savePrefs(DEFAULT_PREFS, blocked)).toBe(false)
  })
})
