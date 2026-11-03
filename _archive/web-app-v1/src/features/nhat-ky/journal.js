import { addDaysKey, formatNumber, formatShortDate, fromKey, toKey, todayKey, WEEKDAYS_SHORT_VI } from '../../lib/date'
import { intensity, isActiveDay } from '../../lib/stats'

/**
 * Logic thuần cho trang Nhật ký: chọn gợi ý theo ngày, gom thống kê theo khoảng,
 * dựng lịch nhiệt tuần × ngày. Không phụ thuộc React để dễ test.
 */

/* ---------- Tab & ngày trên URL ---------- */

export const TABS = ['hom-nay', 'thong-ke', 'so-nguyen']

export function normalizeTab(value) {
  return TABS.includes(value) ? value : 'hom-nay'
}

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Ngày từ query ?ngay= — sai định dạng / ngày không tồn tại / ở tương lai đều quy về hôm nay. */
export function normalizeDayKey(value, today = todayKey()) {
  if (typeof value !== 'string' || !KEY_RE.test(value)) return today
  // fromKey('2026-02-31') sẽ tràn sang tháng 3 → so lại để loại ngày không có thật
  if (toKey(fromKey(value)) !== value) return today
  return value > today ? today : value
}

/* ---------- Chọn gợi ý ổn định theo ngày ---------- */

/** FNV-1a 32 bit — đủ để băm khoá ngày thành hạt giống ổn định. */
export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seededShuffle(list, seed) {
  const arr = [...list]
  let s = seed | 0
  // mulberry32: ngẫu nhiên giả nhưng lặp lại được — cùng một ngày luôn ra cùng thứ tự
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Chọn `count` gợi ý cho một ngày. `round` tăng khi người dùng bấm "Đổi gợi ý":
 * các lượt nối tiếp nhau trên cùng một thứ tự xáo nên không lặp lại cho tới khi đi hết danh sách.
 */
export function pickSuggestions(list, dateKey, count = 3, round = 0) {
  if (!list?.length) return []
  const n = Math.min(count, list.length)
  const order = seededShuffle(list, hashString(dateKey))
  const start = (((round * n) % order.length) + order.length) % order.length
  return Array.from({ length: n }, (_, i) => order[(start + i) % order.length])
}

/** Câu tự vấn của ngày, xoay vòng khi bấm "Câu khác". */
export function pickPrompt(list, dateKey, round = 0) {
  if (!list?.length) return ''
  const i = (hashString(`prompt:${dateKey}`) + round) % list.length
  return list[(i + list.length) % list.length]
}

/* ---------- Mô tả ngày ---------- */

/** "02/11: 1.080 câu niệm, 15 phút thiền, 1 thời kinh, 2 việc lành" */
export function describeDay(key, day) {
  const parts = []
  if (day?.niem) parts.push(`${formatNumber(day.niem)} câu niệm`)
  if (day?.thienMin) parts.push(`${formatNumber(day.thienMin)} phút thiền`)
  if (day?.tung) parts.push(`${day.tung} thời kinh`)
  const deeds = day?.thienHanh?.length ?? 0
  if (deeds) parts.push(`${deeds} việc lành`)
  return `${formatShortDate(fromKey(key))}: ${parts.length ? parts.join(', ') : 'chưa ghi nhận'}`
}

/** Ngày có nội dung "nhật ký" (khác với chỉ có số liệu tu tập). */
export function hasJournalContent(day) {
  if (!day) return false
  return Boolean(day.note?.trim()) || Boolean(day.mood) || (day.thienHanh?.length ?? 0) > 0
}

/** Danh sách ngày có ghi chép, mới nhất trước. */
export function journalEntries(logs, endKey = todayKey()) {
  return Object.keys(logs)
    .filter((k) => k <= endKey && hasJournalContent(logs[k]))
    .sort((a, b) => (a < b ? 1 : -1))
    .map((key) => ({ key, day: logs[key] }))
}

/* ---------- Lịch nhiệt ---------- */

/**
 * Ma trận lịch nhiệt: mỗi cột là một tuần (bắt đầu thứ Hai như lịch Việt), 7 hàng T2→CN.
 * Cột cuối chứa endKey; ô sau endKey đánh dấu `future` để ẩn đi.
 * @returns {{ columns: [{ key, cells: [{ key, level, future, day }] }], months: [{ index, label }] }}
 */
export function buildHeatmap(logs, goals, endKey = todayKey(), weeks = 26) {
  const dow = (fromKey(endKey).getDay() + 6) % 7
  const firstMonday = addDaysKey(endKey, -dow - (weeks - 1) * 7)
  const columns = []
  const months = []
  for (let w = 0; w < weeks; w++) {
    const weekStart = addDaysKey(firstMonday, w * 7)
    const cells = []
    for (let d = 0; d < 7; d++) {
      const key = addDaysKey(weekStart, d)
      const future = key > endKey
      const day = logs[key] ?? null
      cells.push({ key, future, day, level: future ? 0 : intensity(day, goals) })
    }
    columns.push({ key: weekStart, cells })
    const firstOfMonth = cells.find((c) => c.key.endsWith('-01'))
    // Tuần đầu chỉ gắn nhãn khi còn đủ chỗ trước nhãn tháng kế tiếp, tránh chữ chồng nhau
    if (firstOfMonth) months.push({ index: w, label: `thg ${fromKey(firstOfMonth.key).getMonth() + 1}` })
    else if (w === 0 && fromKey(weekStart).getDate() <= 17) months.push({ index: 0, label: `thg ${fromKey(weekStart).getMonth() + 1}` })
  }
  return { columns, months }
}

/* ---------- Gom thống kê theo khoảng ---------- */

export const RANGES = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '12m', label: '12 tháng' },
]

function emptyMetrics() {
  return { niem: 0, thienMin: 0, tung: 0, thienHanh: 0, activeDays: 0 }
}

function addDay(m, day) {
  if (!day) return m
  m.niem += day.niem || 0
  m.thienMin += day.thienMin || 0
  m.tung += day.tung || 0
  m.thienHanh += day.thienHanh?.length || 0
  if (isActiveDay(day)) m.activeDays++
  return m
}

function dayBuckets(logs, days, endKey) {
  return Array.from({ length: days }, (_, i) => {
    const key = addDaysKey(endKey, i - days + 1)
    const date = fromKey(key)
    return {
      key,
      start: key,
      end: key,
      days: 1,
      label: days <= 7 ? WEEKDAYS_SHORT_VI[date.getDay()] : formatShortDate(date),
      fullLabel: formatShortDate(date, true),
      ...addDay(emptyMetrics(), logs[key]),
    }
  })
}

function monthBuckets(logs, months, endKey) {
  const end = fromKey(endKey)
  const buckets = []
  const byPrefix = new Map()
  for (let i = months - 1; i >= 0; i--) {
    const first = new Date(end.getFullYear(), end.getMonth() - i, 1)
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
    const start = toKey(first)
    const stop = i === 0 ? endKey : toKey(last)
    const bucket = {
      key: start.slice(0, 7),
      start,
      end: stop,
      days: i === 0 ? end.getDate() : last.getDate(),
      label: `T${first.getMonth() + 1}`,
      fullLabel: `Tháng ${first.getMonth() + 1}/${first.getFullYear()}`,
      ...emptyMetrics(),
    }
    buckets.push(bucket)
    byPrefix.set(bucket.key, bucket)
  }
  // Duyệt logs một lần thay vì lặp ~365 ngày
  for (const [key, day] of Object.entries(logs)) {
    if (key > endKey) continue
    const bucket = byPrefix.get(key.slice(0, 7))
    if (bucket) addDay(bucket, day)
  }
  return buckets
}

/**
 * Chia khoảng thời gian thành các cột cho biểu đồ.
 * '7d' / '30d' → mỗi cột một ngày; '12m' → mỗi cột một tháng (tháng hiện tại tính tới endKey).
 */
export function buildBuckets(logs, range, endKey = todayKey()) {
  if (range === '12m') return monthBuckets(logs, 12, endKey)
  return dayBuckets(logs, range === '30d' ? 30 : 7, endKey)
}

/** Tổng hợp các cột: tổng, số ngày có tu tập, trung bình mỗi ngày. */
export function summarize(buckets) {
  const sum = emptyMetrics()
  let days = 0
  for (const b of buckets) {
    sum.niem += b.niem
    sum.thienMin += b.thienMin
    sum.tung += b.tung
    sum.thienHanh += b.thienHanh
    sum.activeDays += b.activeDays
    days += b.days
  }
  return {
    ...sum,
    days,
    avgNiem: days ? Math.round(sum.niem / days) : 0,
    avgThienMin: days ? Math.round((sum.thienMin / days) * 10) / 10 : 0,
    start: buckets[0]?.start ?? null,
    end: buckets.at(-1)?.end ?? null,
  }
}

/**
 * Đếm thiện hạnh theo nhóm trong [startKey, endKey].
 * @param categories danh sách nhóm (giữ thứ tự khi bằng nhau); nhóm lạ quy về 'khac'
 * @returns {{ total, items: [{ id, count, share }] }} — chỉ gồm nhóm có ít nhất 1 việc, nhiều nhất trước
 */
export function deedsByCategory(logs, startKey, endKey, categories) {
  const ids = categories.map((c) => c.id)
  const counts = new Map(ids.map((id) => [id, 0]))
  let total = 0
  for (const [key, day] of Object.entries(logs)) {
    if (key < startKey || key > endKey) continue
    for (const deed of day.thienHanh ?? []) {
      const id = counts.has(deed.category) ? deed.category : 'khac'
      counts.set(id, (counts.get(id) ?? 0) + 1)
      total++
    }
  }
  const items = [...counts.entries()]
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({ id, count, share: count / total }))
    .sort((a, b) => b.count - a.count || ids.indexOf(a.id) - ids.indexOf(b.id))
  return { total, items }
}

/* ---------- Trục biểu đồ ---------- */

/** Thang "đẹp" cho trục tung: bước 1/2/5 × 10^n, luôn là số nguyên. */
export function niceScale(maxValue, count = 4) {
  if (!(maxValue > 0)) return { max: count, step: 1, ticks: Array.from({ length: count + 1 }, (_, i) => i) }
  const rough = maxValue / count
  const mag = 10 ** Math.floor(Math.log10(rough))
  const norm = rough / mag
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  const step = Math.max(1, nice * mag)
  const max = Math.ceil(maxValue / step) * step
  const ticks = []
  for (let v = 0; v <= max; v += step) ticks.push(v)
  return { max, step, ticks }
}

/** Số gọn cho nhãn trục: 1500 → "1,5k". */
export function compactNumber(n) {
  if (Math.abs(n) < 1000) return formatNumber(n)
  if (Math.abs(n) < 1_000_000) return `${(n / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}k`
  return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`
}

/* ---------- Sổ nguyện ---------- */

/** Gom lời nguyện theo tháng, giữ thứ tự sẵn có (mới nhất trước). */
export function groupVowsByMonth(vows) {
  const groups = []
  const byKey = new Map()
  for (const vow of vows) {
    const d = new Date(vow.at)
    const valid = !Number.isNaN(d.getTime())
    const key = valid ? toKey(d).slice(0, 7) : 'khac'
    let group = byKey.get(key)
    if (!group) {
      group = { key, label: valid ? `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` : 'Không rõ thời gian', items: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.items.push(vow)
  }
  return groups
}
