/**
 * Lọc lời lẽ thô tục trong chat & tên hiển thị (game cảnh chùa, mọi lứa tuổi).
 *
 * Tiếng Việt bỏ dấu rất dễ trùng từ thường ("lớn"/"lon", "các"/"cac", "buổi"/"buoi", "đeo"/"deo"),
 * nên chia hai danh sách:
 *  - ACCENTED: từ thô tục khớp ĐÚNG DẤU (không phân biệt hoa thường)
 *  - FOLDED: viết tắt / teencode không trùng từ thường → khớp sau khi bỏ dấu
 * Cả hai cho phép lặp chữ ("đéoooo") và chèn dấu chấm/gạch/khoảng trắng giữa các chữ ("đ.ị.t").
 */

const ACCENTED = ['lồn', 'cặc', 'buồi', 'đéo', 'địt', 'đĩ', 'đụ', 'đù má', 'đụ má', 'mẹ mày', 'má mày', 'chó chết', 'óc chó', 'con đĩ', 'đồ chó']
const FOLDED = [
  'dm', 'dmm', 'dcm', 'dkm', 'dmvl', 'vl', 'vcl', 'vkl', 'vlz', 'clm', 'cmm', 'djt', 'dit me', 'loz', 'cak', 'dek',
  'fuck', 'fck', 'shit', 'bitch', 'dick', 'pussy', 'cunt', 'nigger', 'nigga',
]

// Hai hàm chuẩn hoá dưới đây trả về đúng MỘT code unit cho mỗi ký tự gốc (emoji → khoảng trắng)
// để vị trí khớp regex trùng chỉ số ký tự của câu gốc.

/** Bỏ dấu tiếng Việt, đ→d, chữ thường */
export function fold(text) {
  return [...String(text).normalize('NFC')]
    .map((ch) => {
      if (ch.length > 1) return ' '
      const f = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
      return f.length === 1 ? f : ' '
    })
    .join('')
}

const lower = (text) =>
  [...String(text).normalize('NFC')]
    .map((ch) => {
      if (ch.length > 1) return ' '
      const l = ch.toLowerCase()
      return l.length === 1 ? l : ch
    })
    .join('')

const esc = (c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function pattern(word) {
  // Gộp chữ lặp trong TỪNG từ ("dmm" → "dm"), không gộp qua ranh giới từ ("óc chó" giữ hai chữ c)
  const letters = word.split(' ').flatMap((part) => [...part].filter((c, i, a) => c !== a[i - 1]))
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${letters.map((c) => `${esc(c)}+`).join('[\\s._*-]*')})(?=$|[^\\p{L}\\p{N}])`, 'gu')
}
const ACCENTED_RE = ACCENTED.map((w) => pattern(w.normalize('NFC')))
const FOLDED_RE = FOLDED.map(pattern)

/** Đánh dấu vị trí (theo ký tự) cần che */
function maskOf(chars) {
  const mask = new Array(chars.length).fill(false)
  const apply = (str, list) => {
    for (const re of list) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(str))) {
        const start = m.index + m[1].length
        for (let i = start; i < start + m[2].length; i++) mask[i] = true
        if (re.lastIndex === m.index) re.lastIndex++
      }
    }
  }
  apply(lower(chars.join('')), ACCENTED_RE)
  apply(fold(chars.join('')), FOLDED_RE)
  return mask
}

export function isProfane(text) {
  return maskOf([...String(text).normalize('NFC')]).some(Boolean)
}

/** Thay phần thô tục bằng dấu * (giữ nguyên phần còn lại của câu) */
export function cleanText(text) {
  const chars = [...String(text).normalize('NFC')]
  const mask = maskOf(chars)
  return chars.map((ch, i) => (mask[i] ? '*' : ch)).join('')
}

/** Làm sạch tin nhắn: bỏ ký tự điều khiển, gộp khoảng trắng, cắt độ dài, che từ thô tục */
export function cleanChat(text, max = 140) {
  // Ký tự điều khiển (mã < 32 và 127) → khoảng trắng
  const visible = [...String(text ?? '').normalize('NFC')]
    .map((ch) => {
      const code = ch.charCodeAt(0)
      return code < 32 || code === 127 ? ' ' : ch
    })
    .join('')
  const plain = [...visible.replace(/\s+/g, ' ').trim()].slice(0, max).join('')
  return cleanText(plain)
}
