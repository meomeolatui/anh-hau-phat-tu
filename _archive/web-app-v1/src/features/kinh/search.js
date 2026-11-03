import { flattenSutra } from './reader'

/**
 * Tìm kiếm kinh không phân biệt dấu: người lớn tuổi hay gõ "tam kinh", "chu vang sanh"
 * trên bàn phím không bộ gõ — vẫn phải ra đúng bài.
 */

/** Bỏ dấu tiếng Việt, chữ thường, gộp khoảng trắng. "Đà" → "da". */
export function removeDiacritics(str) {
  return String(str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export function normalizeVi(str) {
  return removeDiacritics(str)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(query) {
  const q = normalizeVi(query)
  return q ? q.split(' ') : []
}

const containsAll = (hay, tokens) => tokens.every((t) => hay.includes(t))

/**
 * Chỉ mục tìm kiếm dựng sẵn một lần cho mỗi bài (tránh bỏ dấu lại mỗi lần gõ phím).
 * @returns {Array<{ sutra, title, meta, lines: string[], rawLines: string[] }>}
 */
export function buildIndex(sutras, resolve) {
  return sutras.map((sutra) => {
    const flat = flattenSutra(sutra, resolve)
    return {
      sutra,
      title: normalizeVi(sutra.title),
      meta: normalizeVi([sutra.subtitle, sutra.description, sutra.tradition].filter(Boolean).join(' ')),
      lines: flat.lines.map((l) => normalizeVi(l.text)),
      rawLines: flat.lines.map((l) => l.text),
    }
  })
}

/**
 * Tìm trong chỉ mục. Mọi từ khoá phải xuất hiện (AND). Ưu tiên khớp tiêu đề > mô tả > kinh văn.
 * Khi khớp trong kinh văn, trả kèm dòng khớp đầu tiên để hiển thị trích đoạn và nhảy thẳng tới dòng đó.
 * @returns {Array<{ sutra, score, lineIndex: number|null, snippet: string|null }>}
 */
export function searchIndex(index, query) {
  const tokens = tokenize(query)
  if (!tokens.length) return index.map((e) => ({ sutra: e.sutra, score: 0, lineIndex: null, snippet: null }))

  const phrase = tokens.join(' ')
  const results = []
  for (const e of index) {
    const all = `${e.title} ${e.meta} ${e.lines.join(' ')}`
    if (!containsAll(all, tokens)) continue

    let score = 0
    if (containsAll(e.title, tokens)) score += 10
    if (e.title.startsWith(phrase)) score += 5
    if (e.title.includes(phrase)) score += 3
    if (containsAll(e.meta, tokens)) score += 4

    let lineIndex = e.lines.findIndex((l) => l.includes(phrase))
    if (lineIndex < 0) lineIndex = e.lines.findIndex((l) => containsAll(l, tokens))
    if (lineIndex >= 0) score += 2

    // Chỉ hiện trích đoạn khi tiêu đề không tự giải thích được kết quả
    const showSnippet = lineIndex >= 0 && score < 10
    results.push({
      sutra: e.sutra,
      score,
      lineIndex: showSnippet ? lineIndex : null,
      snippet: showSnippet ? e.rawLines[lineIndex] : null,
    })
  }
  return results.sort((a, b) => b.score - a.score)
}

export function searchSutras(sutras, query, resolve) {
  return searchIndex(buildIndex(sutras, resolve), query)
}
