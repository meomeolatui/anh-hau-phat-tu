/**
 * Thông số minh hoạ cho mỗi ngôi chùa — sinh tất định từ id để cùng một chùa luôn có
 * cùng một bức tranh (không dùng ảnh internet: app chạy offline và tránh vấn đề bản quyền).
 */

export const ART_KINDS = ['chua', 'thap', 'nui', 'nuoc', 'tuong', 'khmer']

/** Bảng màu bầu trời: [trời trên, trời dưới, mặt trời, núi xa, núi gần, mặt đất, mái, tường] */
export const PALETTES = [
  { name: 'binh-minh', sky: ['#fde9d9', '#fbcfe0'], sun: '#f9b324', far: '#f2a7bf', near: '#d97a9a', ground: '#7f1a37', roof: '#7f1a37', wall: '#fff7ef' },
  { name: 'ngoc-bich', sky: ['#d7f2e8', '#b1e4d3'], sun: '#fef0c7', far: '#7fcfb8', near: '#2a967f', ground: '#163f3a', roof: '#184d45', wall: '#f3eee5' },
  { name: 'hoang-hon', sky: ['#fef0c7', '#fbc94d'], sun: '#fffaeb', far: '#f0920c', near: '#b04b0a', ground: '#763010', roof: '#763010', wall: '#fffaeb' },
  { name: 'suong-som', sky: ['#e7eef3', '#cfe1e4'], sun: '#ffffff', far: '#a9c3c6', near: '#5e8a8a', ground: '#2f4f4f', roof: '#1a6055', wall: '#faf7f2' },
  { name: 'hoa-sen', sky: ['#fdf2f6', '#fce7ef'], sun: '#f8a8c5', far: '#b1e4d3', near: '#4bb399', ground: '#1a6055', roof: '#98193d', wall: '#ffffff' },
  { name: 'dem-trang', sky: ['#12201d', '#1a6055'], sun: '#fef0c7', far: '#184d45', near: '#0a2421', ground: '#0a2421', roof: '#0c1614', wall: '#fde08a' },
]

/** Hash FNV-1a 32-bit — nhỏ gọn, đủ phân tán cho vài chục id. */
export function hashString(str) {
  let h = 0x811c9dc5
  for (const ch of String(str)) {
    h ^= ch.codePointAt(0)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * @param {{ id: string, art?: string }} temple
 * @returns {{ kind, palette, sunX, sunY, tiers, ridgeShift, birds }}
 */
export function templeArt(temple) {
  const h = hashString(temple?.id ?? '')
  const kind = ART_KINDS.includes(temple?.art) ? temple.art : ART_KINDS[h % ART_KINDS.length]
  return {
    kind,
    palette: PALETTES[h % PALETTES.length],
    // Mặt trời lệch trái/phải để các thẻ cạnh nhau không giống hệt
    sunX: 70 + ((h >>> 3) % 260),
    sunY: 48 + ((h >>> 7) % 30),
    tiers: 5 + ((h >>> 11) % 3),
    ridgeShift: ((h >>> 13) % 60) - 30,
    birds: (h >>> 17) % 3,
  }
}
