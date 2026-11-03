/**
 * Tìm kiếm tiếng Việt không dấu: người dùng thường gõ "chua huong", "tran quoc"
 * (nhất là trên bàn phím không bật bộ gõ), nên so khớp trên chuỗi đã bỏ dấu.
 */

/** "Chùa Đồng – Yên Tử" → "chua dong yen tu" */
export function normalizeVi(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Gộp các trường đáng tìm của một ngôi chùa thành một chuỗi đã chuẩn hoá. */
export function searchText(temple) {
  return normalizeVi(
    [temple.name, temple.alias, temple.province, temple.address, temple.tradition, ...(temple.highlights ?? [])]
      .filter(Boolean)
      .join(' '),
  )
}

/**
 * Mọi từ trong truy vấn đều phải xuất hiện (thứ tự tuỳ ý) — "yen tu dong" vẫn ra chùa Đồng.
 * Truy vấn rỗng khớp tất cả.
 */
export function matchesQuery(temple, query) {
  const words = normalizeVi(query).split(' ').filter(Boolean)
  if (!words.length) return true
  const haystack = searchText(temple)
  return words.every((w) => haystack.includes(w))
}
