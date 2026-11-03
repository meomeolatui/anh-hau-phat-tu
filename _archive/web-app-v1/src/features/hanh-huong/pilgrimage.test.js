import { describe, expect, it } from 'vitest'
import {
  activeFilterCount,
  filterTemples,
  groupByYear,
  mapsUrl,
  nearbyTemples,
  pilgrimageStats,
  provincesOf,
  sortTemples,
  statusOf,
  suggestNext,
  validateVisitDate,
  visitedTimeline,
} from './pilgrimage'

const T = [
  { id: 'a', name: 'Chùa Bình An', province: 'Hà Nội', region: 'bac', mapQuery: 'Chùa Bình An, Hà Nội' },
  { id: 'b', name: 'Chùa An Lạc', province: 'Hà Nội', region: 'bac' },
  { id: 'c', name: 'Chùa Cổ Lễ', province: 'Ninh Bình', region: 'bac' },
  { id: 'd', name: 'Chùa Diệu Đế', province: 'Huế', region: 'trung' },
  { id: 'e', name: 'Chùa Đông Phước', province: 'Cần Thơ', region: 'nam' },
]

const EMPTY = { visited: {}, wishlist: [] }

describe('statusOf', () => {
  it('đã viếng được ưu tiên hơn muốn đến', () => {
    const p = { visited: { a: { date: '2026-01-01', note: '' } }, wishlist: ['a', 'b'] }
    expect(statusOf('a', p)).toBe('visited')
    expect(statusOf('b', p)).toBe('wishlist')
    expect(statusOf('c', p)).toBe('none')
  })

  it('không lỗi khi thiếu dữ liệu', () => {
    expect(statusOf('a', undefined)).toBe('none')
  })
})

describe('filterTemples', () => {
  const p = { visited: { a: { date: '2026-01-01' } }, wishlist: ['d'] }

  it('lọc theo miền và tỉnh', () => {
    expect(filterTemples(T, { region: 'bac' }, p).map((t) => t.id)).toEqual(['a', 'b', 'c'])
    expect(filterTemples(T, { region: 'bac', province: 'Hà Nội' }, p).map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('lọc theo trạng thái', () => {
    expect(filterTemples(T, { status: 'visited' }, p).map((t) => t.id)).toEqual(['a'])
    expect(filterTemples(T, { status: 'wishlist' }, p).map((t) => t.id)).toEqual(['d'])
    expect(filterTemples(T, { status: 'none' }, p).map((t) => t.id)).toEqual(['b', 'c', 'e'])
  })

  it('tìm không dấu kết hợp với bộ lọc khác', () => {
    expect(filterTemples(T, { query: 'ha noi' }, p).map((t) => t.id)).toEqual(['a', 'b'])
    expect(filterTemples(T, { query: 'dong phuoc', region: 'bac' }, p)).toEqual([])
    expect(filterTemples(T, { query: 'dong phuoc' }, p).map((t) => t.id)).toEqual(['e'])
  })
})

describe('sortTemples', () => {
  it('theo tên dùng thứ tự tiếng Việt và không đổi mảng gốc', () => {
    const copy = [...T]
    const names = sortTemples(T, 'name', EMPTY).map((t) => t.id)
    expect(names).toEqual(['b', 'a', 'c', 'd', 'e'])
    expect(T).toEqual(copy)
  })

  it('viếng gần đây đứng trước', () => {
    const p = { visited: { c: { date: '2025-05-01' }, e: { date: '2026-02-01' } }, wishlist: [] }
    expect(sortTemples(T, 'recent', p).map((t) => t.id).slice(0, 2)).toEqual(['e', 'c'])
  })

  it('mặc định giữ thứ tự Bắc → Trung → Nam', () => {
    const shuffled = [T[4], T[3], T[0]]
    expect(sortTemples(shuffled, 'region', EMPTY).map((t) => t.id)).toEqual(['a', 'd', 'e'])
  })
})

describe('provincesOf', () => {
  it('đếm số chùa mỗi tỉnh, sắp theo bảng chữ cái', () => {
    expect(provincesOf(T)).toEqual([
      { name: 'Cần Thơ', count: 1 },
      { name: 'Hà Nội', count: 2 },
      { name: 'Huế', count: 1 },
      { name: 'Ninh Bình', count: 1 },
    ])
    expect(provincesOf(T, 'trung')).toEqual([{ name: 'Huế', count: 1 }])
  })
})

describe('activeFilterCount', () => {
  it('không tính sắp xếp và từ khoá chỉ có khoảng trắng', () => {
    expect(activeFilterCount({ query: '  ', sort: 'name' })).toBe(0)
    expect(activeFilterCount({ query: 'hue', region: 'trung', status: 'visited', province: 'Huế' })).toBe(4)
  })
})

describe('pilgrimageStats', () => {
  it('thống kê theo miền và bỏ qua id không có trong danh bạ', () => {
    const p = {
      visited: { a: { date: '2025-03-01' }, d: { date: '2026-04-08', note: 'An lạc' }, ghost: { date: '2026-05-01' } },
      wishlist: ['b', 'a', 'ghost'],
    }
    const s = pilgrimageStats(T, p)
    expect(s.total).toBe(5)
    expect(s.visited).toBe(2)
    expect(s.ratio).toBeCloseTo(0.4)
    expect(s.wishlist.map((t) => t.id)).toEqual(['b'])
    expect(s.provinces).toBe(2)
    expect(s.lastVisit.temple.id).toBe('d')
    expect(s.byRegion.find((r) => r.id === 'bac')).toMatchObject({ total: 3, visited: 1 })
    expect(s.byRegion.find((r) => r.id === 'trung').ratio).toBe(1)
    expect(s.byRegion.find((r) => r.id === 'nam').ratio).toBe(0)
  })

  it('người mới chưa có dữ liệu', () => {
    const s = pilgrimageStats(T, EMPTY)
    expect(s.visited).toBe(0)
    expect(s.lastVisit).toBeNull()
    expect(s.timeline).toEqual([])
  })
})

describe('visitedTimeline & groupByYear', () => {
  it('sắp mới nhất trước và gom theo năm', () => {
    const p = { visited: { a: { date: '2025-03-01' }, c: { date: '2026-01-02' }, e: { date: '2026-06-01', note: 'x' } }, wishlist: [] }
    const tl = visitedTimeline(T, p)
    expect(tl.map((x) => x.temple.id)).toEqual(['e', 'c', 'a'])
    expect(tl[0].note).toBe('x')
    const groups = groupByYear(tl)
    expect(groups.map((g) => g.year)).toEqual(['2026', '2025'])
    expect(groups[0].items).toHaveLength(2)
  })
})

describe('nearbyTemples', () => {
  it('ưu tiên cùng tỉnh, rồi cùng miền, không gồm chính nó', () => {
    expect(nearbyTemples(T[0], T, 3).map((t) => t.id)).toEqual(['b', 'c'])
    expect(nearbyTemples(T[3], T)).toEqual([])
    expect(nearbyTemples(null, T)).toEqual([])
  })

  it('tôn trọng giới hạn', () => {
    expect(nearbyTemples(T[0], T, 1).map((t) => t.id)).toEqual(['b'])
  })
})

describe('suggestNext', () => {
  it('ưu tiên danh sách muốn đến (bỏ qua chùa đã viếng)', () => {
    const p = { visited: { c: { date: '2026-01-01' } }, wishlist: ['c', 'e', 'd'] }
    expect(suggestNext(T, p)).toEqual({ temple: T[4], reason: 'wishlist' })
  })

  it('gợi ý cùng miền đã đi nhiều nhất', () => {
    const p = { visited: { a: { date: '2026-01-01' }, b: { date: '2026-01-02' }, d: { date: '2026-01-03' } }, wishlist: [] }
    expect(suggestNext(T, p, 7)).toEqual({ temple: T[2], reason: 'region' })
  })

  it('người mới: chọn theo seed, ổn định với cùng seed', () => {
    const first = suggestNext(T, EMPTY, 3)
    expect(first.reason).toBe('daily')
    expect(suggestNext(T, EMPTY, 3)).toEqual(first)
    expect(suggestNext(T, EMPTY, -3).temple).toBe(first.temple)
  })

  it('trả null khi đã viếng hết', () => {
    const visited = Object.fromEntries(T.map((t) => [t.id, { date: '2026-01-01' }]))
    expect(suggestNext(T, { visited, wishlist: [] })).toBeNull()
  })
})

describe('validateVisitDate', () => {
  const today = '2026-11-02'
  it('chấp nhận hôm nay và quá khứ', () => {
    expect(validateVisitDate('2026-11-02', today)).toBeNull()
    expect(validateVisitDate('2001-05-20', today)).toBeNull()
  })

  it('báo lỗi khi trống, sai định dạng hoặc ở tương lai', () => {
    expect(validateVisitDate('', today)).toMatch(/chọn ngày/)
    expect(validateVisitDate('02/11/2026', today)).toMatch(/không hợp lệ/)
    expect(validateVisitDate('2026-11-03', today)).toMatch(/tương lai/)
    expect(validateVisitDate('1800-01-01', today)).toMatch(/không hợp lệ/)
  })
})

describe('mapsUrl', () => {
  it('mã hoá chuỗi tìm kiếm Google Maps', () => {
    expect(mapsUrl(T[0])).toBe(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Chùa Bình An, Hà Nội')}`)
    expect(mapsUrl(T[1])).toContain(encodeURIComponent('Chùa An Lạc'))
  })
})
