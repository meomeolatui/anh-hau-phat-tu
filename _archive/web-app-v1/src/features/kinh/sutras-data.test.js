import { describe, expect, it } from 'vitest'
import { SUTRAS, SUTRA_CATEGORIES, getSutra } from '../../data/sutras'
import { flattenSutra } from './reader'

// Kiểm tra toàn vẹn dữ liệu: lỗi gõ id/ref ở đây sẽ làm vỡ trình đọc nên chặn sớm bằng test.
describe('dữ liệu kinh', () => {
  const categoryIds = SUTRA_CATEGORIES.map((c) => c.id)

  it('id là slug duy nhất', () => {
    const ids = SUTRAS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it.each(SUTRAS.map((s) => [s.id, s]))('%s có đủ trường bắt buộc', (_, s) => {
    expect(s.title).toBeTruthy()
    expect(s.subtitle).toBeTruthy()
    expect(s.description).toBeTruthy()
    expect(categoryIds).toContain(s.category)
    expect(s.minutes).toBeGreaterThan(0)
    expect(Array.isArray(s.sections) && s.sections.length > 0).toBe(true)
    if (s.meaning) expect(s.meaning.every((p) => typeof p === 'string' && p.length > 0)).toBe(true)
  })

  it('mọi dẫn chiếu trỏ tới bài có thật và không tự trỏ chính nó', () => {
    for (const s of SUTRAS) {
      for (const sec of s.sections) {
        if (!sec.ref) continue
        expect(getSutra(sec.ref), `${s.id} → ${sec.ref}`).toBeTruthy()
        expect(sec.ref).not.toBe(s.id)
      }
    }
  })

  it('mỗi bài có ít nhất một dòng để tụng, không có dòng rỗng', () => {
    for (const s of SUTRAS) {
      const { lines } = flattenSutra(s, getSutra)
      expect(lines.length, s.id).toBeGreaterThan(0)
      expect(lines.every((l) => l.text.trim().length > 0), s.id).toBe(true)
    }
  })

  it('mỗi loại đều có bài', () => {
    for (const c of categoryIds) expect(SUTRAS.some((s) => s.category === c)).toBe(true)
  })

  it('getSutra trả undefined với id lạ', () => {
    expect(getSutra('khong-ton-tai')).toBeUndefined()
  })
})
