import { describe, expect, it } from 'vitest'
import { QUOTES, QUOTE_THEMES, findQuote, quoteOfDay, themeLabel } from '../../data/quotes'

describe('dữ liệu pháp ngữ', () => {
  it('có từ 60 đến 80 câu, id không trùng', () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(60)
    expect(QUOTES.length).toBeLessThanOrEqual(80)
    expect(new Set(QUOTES.map((q) => q.id)).size).toBe(QUOTES.length)
  })

  it('mỗi câu đủ trường và thuộc một chủ đề hợp lệ', () => {
    const themes = new Set(QUOTE_THEMES.map((t) => t.id))
    for (const q of QUOTES) {
      expect(q.text.trim().length, q.id).toBeGreaterThan(10)
      expect(q.source.trim().length, q.id).toBeGreaterThan(2)
      expect(themes.has(q.theme), q.id).toBe(true)
    }
  })

  it('mỗi chủ đề có ít nhất 6 câu', () => {
    for (const t of QUOTE_THEMES) {
      expect(QUOTES.filter((q) => q.theme === t.id).length, t.id).toBeGreaterThanOrEqual(6)
    }
  })

  it('giữ các id cũ để mục yêu thích đã lưu không bị mất', () => {
    for (const id of ['pc-1', 'pc-5', 'pc-183']) expect(findQuote(id)).not.toBeNull()
  })

  it('kệ chữ Hán luôn kèm lược giải', () => {
    for (const q of QUOTES.filter((x) => x.gloss)) expect(q.gloss.startsWith('Lược giải:')).toBe(true)
  })

  it('findQuote / themeLabel xử lý giá trị lạ', () => {
    expect(findQuote('khong-co')).toBeNull()
    expect(findQuote(null)).toBeNull()
    expect(themeLabel('tam')).toBe('Tâm')
    expect(themeLabel('xyz')).toBe('')
  })
})

describe('quoteOfDay', () => {
  it('ổn định trong cùng một ngày', () => {
    const a = quoteOfDay(new Date(2026, 10, 2, 0, 5))
    const b = quoteOfDay(new Date(2026, 10, 2, 23, 55))
    expect(a.id).toBe(b.id)
  })

  it('đổi câu khi sang ngày mới, liên tiếp nhiều ngày', () => {
    let prev = quoteOfDay(new Date(2026, 0, 1))
    for (let d = 2; d <= 60; d++) {
      const cur = quoteOfDay(new Date(2026, 0, d))
      expect(cur.id).not.toBe(prev.id)
      prev = cur
    }
  })

  it('đi qua đủ mọi câu trước khi lặp lại', () => {
    const seen = new Set()
    for (let d = 0; d < QUOTES.length; d++) seen.add(quoteOfDay(new Date(2026, 0, 1 + d)).id)
    expect(seen.size).toBe(QUOTES.length)
  })

  it('hoạt động với ngày trước 1970', () => {
    expect(QUOTES).toContain(quoteOfDay(new Date(1960, 5, 1)))
  })
})
