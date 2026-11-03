/** Các câu niệm phổ biến trong truyền thống Phật giáo Việt Nam. */
export const MANTRAS = [
  { id: 'a-di-da', text: 'Nam mô A Di Đà Phật', note: 'Hồng danh Đức Phật A Di Đà — pháp môn Tịnh độ' },
  { id: 'thich-ca', text: 'Nam mô Bổn Sư Thích Ca Mâu Ni Phật', note: 'Đức Bổn Sư, bậc Thầy của cõi Ta-bà' },
  { id: 'quan-am', text: 'Nam mô Đại Từ Đại Bi Quán Thế Âm Bồ Tát', note: 'Bồ Tát lắng nghe tiếng khổ, biểu trưng lòng đại bi' },
  { id: 'duoc-su', text: 'Nam mô Dược Sư Lưu Ly Quang Vương Phật', note: 'Đức Phật Dược Sư — thường niệm khi cầu an' },
  { id: 'dia-tang', text: 'Nam mô Địa Tạng Vương Bồ Tát', note: 'Bồ Tát của đại nguyện, gắn với đạo hiếu' },
  { id: 'luc-tu', text: 'Án Ma Ni Bát Di Hồng', note: 'Lục tự đại minh chân ngôn của Bồ Tát Quán Thế Âm' },
]

export const DEFAULT_MANTRA = MANTRAS[0].text
export const MAX_MANTRA_LENGTH = 80

/** Chuẩn hoá câu niệm tự nhập: gọn khoảng trắng, giới hạn độ dài. Trả '' nếu rỗng. */
export function cleanMantra(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_MANTRA_LENGTH)
}

/** Tìm câu niệm có sẵn khớp với chuỗi (không phân biệt hoa thường). */
export function findMantra(text) {
  const clean = cleanMantra(text).toLowerCase()
  if (!clean) return null
  return MANTRAS.find((m) => m.text.toLowerCase() === clean) ?? null
}
