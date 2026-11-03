import { describe, expect, it } from 'vitest'
import { ART_KINDS, PALETTES, hashString, templeArt } from './art'

describe('hashString', () => {
  it('tất định và là số nguyên không âm 32-bit', () => {
    expect(hashString('chua-huong')).toBe(hashString('chua-huong'))
    expect(hashString('chua-huong')).not.toBe(hashString('chua-thay'))
    const h = hashString('chùa đồng')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(2 ** 32)
  })
})

describe('templeArt', () => {
  it('dùng kiểu minh hoạ khai báo trong dữ liệu', () => {
    expect(templeArt({ id: 'x', art: 'khmer' }).kind).toBe('khmer')
  })

  it('kiểu lạ hoặc thiếu → chọn theo hash, luôn hợp lệ', () => {
    expect(ART_KINDS).toContain(templeArt({ id: 'x', art: 'la' }).kind)
    expect(ART_KINDS).toContain(templeArt({ id: 'y' }).kind)
    expect(ART_KINDS).toContain(templeArt(null).kind)
  })

  it('cùng id cho cùng bức tranh; thông số nằm trong khung', () => {
    const a = templeArt({ id: 'chua-tran-quoc', art: 'thap' })
    expect(templeArt({ id: 'chua-tran-quoc', art: 'thap' })).toEqual(a)
    expect(PALETTES).toContain(a.palette)
    expect(a.sunX).toBeGreaterThanOrEqual(70)
    expect(a.sunX).toBeLessThan(330)
    expect(a.tiers).toBeGreaterThanOrEqual(5)
    expect(a.tiers).toBeLessThanOrEqual(7)
  })
})
