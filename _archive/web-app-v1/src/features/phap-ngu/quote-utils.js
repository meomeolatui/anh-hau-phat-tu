/**
 * Logic thuần cho trang Pháp ngữ: chuẩn hoá tiếng Việt để tìm kiếm, lọc, rút ngẫu nhiên,
 * định dạng khi sao chép và ghi suy ngẫm vào nhật ký. Không phụ thuộc React để dễ kiểm thử.
 */

/** Bỏ dấu, đưa về chữ thường — người dùng hay gõ không dấu ("tam tu bi") nên phải so khớp cả hai kiểu. */
export function normalizeVi(str) {
  return String(str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Chuỗi để tìm kiếm của một câu (gồm cả lược giải, nguồn, chủ đề). */
export function searchText(quote, themeLabel = '') {
  return normalizeVi([quote.text, quote.gloss, quote.source, themeLabel].filter(Boolean).join(' '))
}

/**
 * Lọc pháp ngữ.
 * - query: mọi từ khoá đều phải xuất hiện (không phân biệt dấu, hoa thường).
 * - theme: id chủ đề hoặc 'all'.
 * - favoriteIds + onlyFavorites: chỉ giữ câu đã yêu thích, xếp theo thứ tự yêu thích (mới nhất trước).
 * - getThemeLabel: để tìm được cả theo tên chủ đề ("nhẫn nhục").
 */
export function filterQuotes(quotes, { query = '', theme = 'all', favoriteIds = [], onlyFavorites = false, getThemeLabel } = {}) {
  const tokens = normalizeVi(query).split(' ').filter(Boolean)
  let list = quotes
  if (onlyFavorites) {
    const byId = new Map(quotes.map((q) => [q.id, q]))
    list = favoriteIds.map((id) => byId.get(id)).filter(Boolean)
  }
  if (theme && theme !== 'all') list = list.filter((q) => q.theme === theme)
  if (!tokens.length) return list
  return list.filter((q) => {
    const hay = searchText(q, getThemeLabel?.(q.theme))
    return tokens.every((t) => hay.includes(t))
  })
}

/** Đếm số câu theo chủ đề — hiển thị trên các chip lọc. */
export function countByTheme(quotes) {
  const out = { all: quotes.length }
  for (const q of quotes) out[q.theme] = (out[q.theme] ?? 0) + 1
  return out
}

/**
 * Rút ngẫu nhiên một câu, tránh các câu vừa xem gần đây (recentIds).
 * Nếu đã xem hết thì chỉ tránh câu cuối cùng — để không bao giờ rút trùng ngay câu đang hiện.
 * random: hàm trả về [0, 1) — truyền vào để test ổn định.
 */
export function pickRandomQuote(pool, recentIds = [], random = Math.random) {
  if (!pool.length) return null
  if (pool.length === 1) return pool[0]
  const recent = new Set(recentIds)
  let candidates = pool.filter((q) => !recent.has(q.id))
  if (!candidates.length) {
    const last = recentIds[recentIds.length - 1]
    candidates = pool.filter((q) => q.id !== last)
  }
  const i = Math.min(candidates.length - 1, Math.floor(random() * candidates.length))
  return candidates[i]
}

/** Thêm id vào lịch sử đã xem, giữ tối đa `limit` phần tử gần nhất, không trùng. */
export function pushRecent(recentIds, id, limit = 12) {
  const next = recentIds.filter((x) => x !== id)
  next.push(id)
  return next.slice(-limit)
}

/** Văn bản khi sao chép: câu (kèm lược giải nếu có) + nguồn + tên ứng dụng. */
export function formatQuoteForCopy(quote) {
  const parts = [`“${quote.text}”`]
  if (quote.gloss) parts.push(quote.gloss)
  parts.push(`— ${quote.source}`)
  return `${parts.join('\n')}\n\n(Anh Hậu Phật Tử)`
}

export const NOTE_LIMIT = 2000

/**
 * Ghép suy ngẫm vào ghi chú nhật ký hôm nay.
 * Trả về { ok, note }. ok = false khi rỗng hoặc vượt giới hạn 2000 ký tự của nhật ký
 * (setDayNote sẽ cắt bớt — thà báo người dùng còn hơn âm thầm mất chữ).
 */
export function appendReflection(prevNote, quote, reflection) {
  const body = String(reflection ?? '').trim()
  if (!body) return { ok: false, reason: 'empty', note: prevNote ?? '' }
  const short = quote.text.length > 80 ? `${quote.text.slice(0, 77).trimEnd()}…` : quote.text
  const entry = `[Chiêm nghiệm] “${short}” — ${quote.source}\n${body}`
  const prev = String(prevNote ?? '').trimEnd()
  const note = prev ? `${prev}\n\n${entry}` : entry
  if (note.length > NOTE_LIMIT) return { ok: false, reason: 'too-long', note: prevNote ?? '' }
  return { ok: true, note }
}
