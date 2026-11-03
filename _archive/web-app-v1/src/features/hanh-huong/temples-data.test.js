import { describe, expect, it } from 'vitest'
import { REGIONS, TEMPLES, getTemple, regionLabel } from '../../data/temples'
import { ART_KINDS } from './art'

// Kiểm tra toàn vẹn dữ liệu danh bạ — tránh lỗi khi thêm chùa mới
describe('dữ liệu TEMPLES', () => {
  it('có khoảng 30 ngôi chùa, phủ cả ba miền', () => {
    expect(TEMPLES.length).toBeGreaterThanOrEqual(30)
    for (const r of REGIONS) expect(TEMPLES.some((t) => t.region === r.id)).toBe(true)
  })

  it('id là slug duy nhất', () => {
    const ids = TEMPLES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('mỗi chùa đủ trường bắt buộc', () => {
    const regionIds = REGIONS.map((r) => r.id)
    for (const t of TEMPLES) {
      expect(t.name, t.id).toBeTruthy()
      expect(t.province, t.id).toBeTruthy()
      expect(t.address, t.id).toBeTruthy()
      expect(t.mapQuery, t.id).toBeTruthy()
      expect(regionIds, t.id).toContain(t.region)
      expect(ART_KINDS, t.id).toContain(t.art)
      expect(t.summary.length, t.id).toBeGreaterThan(60)
      expect(Array.isArray(t.highlights) && t.highlights.length >= 2, t.id).toBe(true)
      if (t.etiquette) expect(Array.isArray(t.etiquette), t.id).toBe(true)
    }
  })

  it('getTemple và regionLabel', () => {
    expect(getTemple('chua-thien-mu')?.name).toBe('Chùa Thiên Mụ')
    expect(getTemple('khong-co')).toBeNull()
    expect(regionLabel('nam')).toBe('Miền Nam')
    expect(regionLabel('xyz')).toBe('')
  })
})
