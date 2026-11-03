import { REGIONS } from '../../data/temples'
import { matchesQuery } from './search'

/**
 * Logic thuần cho tính năng Hành hương: lọc, sắp xếp, thống kê theo miền, gợi ý chuyến đi.
 * `pilgrimage` là state.pilgrimage = { visited: { [id]: { date, note } }, wishlist: [id] }.
 */

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'visited', label: 'Đã viếng' },
  { value: 'wishlist', label: 'Muốn đến' },
  { value: 'none', label: 'Chưa đến' },
]

export const SORT_OPTIONS = [
  { value: 'region', label: 'Theo miền Bắc → Nam' },
  { value: 'name', label: 'Theo tên A → Z' },
  { value: 'recent', label: 'Viếng gần đây trước' },
]

export const EMPTY_FILTERS = Object.freeze({ query: '', region: 'all', status: 'all', province: 'all', sort: 'region' })

const REGION_ORDER = Object.fromEntries(REGIONS.map((r, i) => [r.id, i]))
const collator = new Intl.Collator('vi', { sensitivity: 'base' })

/** 'visited' | 'wishlist' | 'none' — đã viếng được ưu tiên hơn muốn đến. */
export function statusOf(id, pilgrimage) {
  if (pilgrimage?.visited?.[id]) return 'visited'
  if (pilgrimage?.wishlist?.includes(id)) return 'wishlist'
  return 'none'
}

export function filterTemples(temples, filters, pilgrimage) {
  const f = { ...EMPTY_FILTERS, ...filters }
  return temples.filter((t) => {
    if (f.region !== 'all' && t.region !== f.region) return false
    if (f.province !== 'all' && t.province !== f.province) return false
    if (f.status !== 'all' && statusOf(t.id, pilgrimage) !== f.status) return false
    return matchesQuery(t, f.query)
  })
}

/** Trả về mảng mới, không đổi mảng gốc. */
export function sortTemples(temples, sort, pilgrimage) {
  const list = [...temples]
  if (sort === 'name') return list.sort((a, b) => collator.compare(a.name, b.name))
  if (sort === 'recent') {
    // Chùa đã viếng (ngày mới nhất trước) đứng đầu, phần còn lại giữ thứ tự theo miền
    const dateOf = (t) => pilgrimage?.visited?.[t.id]?.date ?? ''
    return list.sort((a, b) => dateOf(b).localeCompare(dateOf(a)) || REGION_ORDER[a.region] - REGION_ORDER[b.region])
  }
  // Sắp xếp ổn định: giữ thứ tự biên soạn trong cùng một miền
  return list.sort((a, b) => REGION_ORDER[a.region] - REGION_ORDER[b.region])
}

/** Danh sách tỉnh/thành (đã sắp theo bảng chữ cái) kèm số chùa, tuỳ chọn giới hạn theo miền. */
export function provincesOf(temples, region = 'all') {
  const counts = new Map()
  for (const t of temples) {
    if (region !== 'all' && t.region !== region) continue
    counts.set(t.province, (counts.get(t.province) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => collator.compare(a.name, b.name))
}

/** Số bộ lọc đang bật (không tính sắp xếp) — để hiện nút "Xoá bộ lọc". */
export function activeFilterCount(filters) {
  const f = { ...EMPTY_FILTERS, ...filters }
  return [f.query.trim() !== '', f.region !== 'all', f.status !== 'all', f.province !== 'all'].filter(Boolean).length
}

/**
 * Thống kê hành trình. Chỉ tính các id có trong danh bạ — dữ liệu sao lưu cũ
 * có thể chứa id không còn tồn tại.
 */
export function pilgrimageStats(temples, pilgrimage) {
  const visitedIds = new Set(temples.filter((t) => pilgrimage?.visited?.[t.id]).map((t) => t.id))
  const wishlist = temples.filter((t) => statusOf(t.id, pilgrimage) === 'wishlist')
  const byRegion = REGIONS.map((r) => {
    const inRegion = temples.filter((t) => t.region === r.id)
    const visited = inRegion.filter((t) => visitedIds.has(t.id)).length
    return { ...r, total: inRegion.length, visited, ratio: inRegion.length ? visited / inRegion.length : 0 }
  })
  const provinces = new Set(temples.filter((t) => visitedIds.has(t.id)).map((t) => t.province))
  const timeline = visitedTimeline(temples, pilgrimage)
  return {
    total: temples.length,
    visited: visitedIds.size,
    ratio: temples.length ? visitedIds.size / temples.length : 0,
    wishlist,
    byRegion,
    provinces: provinces.size,
    lastVisit: timeline[0] ?? null,
    timeline,
  }
}

/** Các chuyến đã ghi dấu, mới nhất trước. */
export function visitedTimeline(temples, pilgrimage) {
  const visited = pilgrimage?.visited ?? {}
  return temples
    .filter((t) => visited[t.id])
    .map((t) => ({ temple: t, date: visited[t.id].date ?? '', note: visited[t.id].note ?? '' }))
    .sort((a, b) => b.date.localeCompare(a.date) || collator.compare(a.temple.name, b.temple.name))
}

/** Gom timeline theo năm: [{ year: '2026', items: [...] }] */
export function groupByYear(timeline) {
  const groups = []
  for (const item of timeline) {
    const year = item.date.slice(0, 4) || 'Khác'
    const last = groups[groups.length - 1]
    if (last?.year === year) last.items.push(item)
    else groups.push({ year, items: [item] })
  }
  return groups
}

/** Chùa gần đó: cùng tỉnh trước, rồi cùng miền; không gồm chính nó. */
export function nearbyTemples(temple, temples, limit = 3) {
  if (!temple) return []
  const others = temples.filter((t) => t.id !== temple.id)
  const sameProvince = others.filter((t) => t.province === temple.province)
  const sameRegion = others.filter((t) => t.province !== temple.province && t.region === temple.region)
  return [...sameProvince, ...sameRegion].slice(0, limit)
}

/**
 * Gợi ý chuyến đi tiếp theo:
 * 1. Ưu tiên chùa trong danh sách "Muốn đến" (theo thứ tự người dùng thêm).
 * 2. Nếu chưa có, chọn chùa chưa viếng ở miền mà người dùng đã đi nhiều nhất — thường là gần nhà.
 * 3. Người mới: chọn theo `seed` (vd. số ngày) để gợi ý thay đổi mỗi ngày nhưng ổn định trong ngày.
 * Trả về null khi đã viếng hết.
 */
export function suggestNext(temples, pilgrimage, seed = 0) {
  const visited = pilgrimage?.visited ?? {}
  const unvisited = temples.filter((t) => !visited[t.id])
  if (!unvisited.length) return null

  const wished = (pilgrimage?.wishlist ?? []).map((id) => unvisited.find((t) => t.id === id)).filter(Boolean)
  if (wished.length) return { temple: wished[0], reason: 'wishlist' }

  const pick = (list) => list[Math.abs(Math.trunc(seed)) % list.length]
  const regionCounts = {}
  for (const t of temples) if (visited[t.id]) regionCounts[t.region] = (regionCounts[t.region] ?? 0) + 1
  const favRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const inFav = favRegion ? unvisited.filter((t) => t.region === favRegion) : []
  if (inFav.length) return { temple: pick(inFav), reason: 'region' }

  return { temple: pick(unvisited), reason: 'daily' }
}

/**
 * Kiểm tra ngày ghi dấu: bắt buộc, đúng định dạng YYYY-MM-DD, không ở tương lai.
 * Trả về chuỗi lỗi hoặc null.
 */
export function validateVisitDate(date, today) {
  if (!date) return 'Vui lòng chọn ngày bạn đã đến.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date).getTime())) return 'Ngày không hợp lệ.'
  if (date > today) return 'Ngày viếng không thể ở tương lai.'
  if (date < '1900-01-01') return 'Ngày không hợp lệ.'
  return null
}

/** Liên kết chỉ đường Google Maps (mở ngoài ứng dụng). */
export function mapsUrl(temple) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(temple.mapQuery || temple.name)}`
}
