import { describe, expect, it } from 'vitest'
import { QUOTE_THEMES } from '../../data/quotes'
import { REFLECTIONS, hashString, reflectionsFor } from './reflection'

describe('reflectionsFor', () => {
  it('mọi chủ đề đều có câu tự vấn', () => {
    for (const t of QUOTE_THEMES) expect(REFLECTIONS[t.id]?.length, t.id).toBeGreaterThanOrEqual(3)
  })

  it('trả về 3 câu khác nhau, cùng chủ đề, ổn định theo id', () => {
    const q = { id: 'pc-5', theme: 'tu-bi' }
    const a = reflectionsFor(q)
    expect(a).toHaveLength(3)
    expect(new Set(a).size).toBe(3)
    for (const x of a) expect(REFLECTIONS['tu-bi']).toContain(x)
    expect(reflectionsFor(q)).toEqual(a)
  })

  it('dùng bộ mặc định khi chủ đề lạ hoặc thiếu câu', () => {
    expect(reflectionsFor({ id: 'x', theme: 'khong-co' })).toHaveLength(3)
    expect(reflectionsFor(null)).toHaveLength(3)
  })

  it('hashString xác định và không âm', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
    expect(hashString('abc')).toBeGreaterThanOrEqual(0)
  })
})
