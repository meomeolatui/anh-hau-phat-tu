/**
 * Tạo tệp iCalendar (RFC 5545) để người dùng nhập ngày vía/ngày chay vào lịch điện thoại.
 * Viết tay thay vì dùng thư viện vì chỉ cần sự kiện cả ngày, và app không được cài thêm gói.
 */

const CRLF = '\r\n'
const MAX_OCTETS = 75

const pad = (n, len = 2) => String(n).padStart(len, '0')

/** Ngày cả ngày dạng YYYYMMDD theo lịch địa phương (giá trị DATE không có múi giờ). */
export function formatIcsDate(date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
}

/** Thời điểm UTC dạng YYYYMMDDTHHMMSSZ (dùng cho DTSTAMP). */
export function formatIcsDateTime(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

/** Escape giá trị TEXT theo RFC 5545 §3.3.11: \ ; , và xuống dòng. */
export function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

function utf8Length(char) {
  const cp = char.codePointAt(0)
  if (cp < 0x80) return 1
  if (cp < 0x800) return 2
  if (cp < 0x10000) return 3
  return 4
}

/**
 * Gập dòng dài theo RFC 5545 §3.1: mỗi dòng tối đa 75 octet (tính theo UTF-8, không kể CRLF),
 * dòng tiếp theo bắt đầu bằng một dấu cách. Không cắt đôi ký tự nhiều byte — tiếng Việt có dấu
 * chiếm 2–3 byte nên cắt theo số ký tự sẽ làm hỏng chữ.
 */
export function foldLine(line) {
  const out = []
  let current = ''
  let size = 0
  for (const char of line) {
    const len = utf8Length(char)
    // Dòng tiếp nối đã có sẵn 1 octet cho dấu cách đầu dòng
    const limit = out.length ? MAX_OCTETS - 1 : MAX_OCTETS
    if (size + len > limit) {
      out.push(current)
      current = ''
      size = 0
    }
    current += char
    size += len
  }
  out.push(current)
  return out.join(`${CRLF} `)
}

/** Ngày kế tiếp — DTEND của sự kiện cả ngày là ngày sau (không bao gồm). */
function nextDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
}

/**
 * @param {object} event
 * @param {string} event.uid định danh duy nhất, ổn định (nhập lại sẽ cập nhật thay vì nhân đôi)
 * @param {Date} event.date ngày diễn ra (cả ngày)
 * @param {string} event.summary
 * @param {string} [event.description]
 * @param {string[]} [event.categories]
 * @param {number|null} [event.alarmHoursBefore] nhắc trước bao nhiêu giờ tính từ 0h ngày đó
 */
function eventLines(event, stamp) {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${formatIcsDate(event.date)}`,
    `DTEND;VALUE=DATE:${formatIcsDate(nextDay(event.date))}`,
    `SUMMARY:${escapeText(event.summary)}`,
  ]
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  if (event.categories?.length) lines.push(`CATEGORIES:${event.categories.map(escapeText).join(',')}`)
  // Sự kiện cả ngày không nên chiếm chỗ "bận" trong lịch làm việc
  lines.push('TRANSP:TRANSPARENT')
  if (Number.isFinite(event.alarmHoursBefore) && event.alarmHoursBefore > 0) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(event.summary)}`,
      `TRIGGER:-PT${Math.round(event.alarmHoursBefore)}H`,
      'END:VALARM',
    )
  }
  lines.push('END:VEVENT')
  return lines
}

/**
 * Dựng toàn bộ nội dung tệp .ics.
 * @param {object[]} events xem eventLines
 * @param {{ name?: string, now?: Date }} options
 * @returns {string} văn bản có CRLF, kết thúc bằng CRLF
 */
export function buildIcs(events, { name = 'Ngày vía & ngày chay', now = new Date() } = {}) {
  const stamp = formatIcsDateTime(now)
  const seen = new Set()
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Anh Hau Phat Tu//Lich am Phat giao//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ]
  for (const event of events) {
    // UID trùng sẽ khiến ứng dụng lịch ghi đè sự kiện — bỏ qua bản lặp
    if (seen.has(event.uid)) continue
    seen.add(event.uid)
    lines.push(...eventLines(event, stamp))
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join(CRLF) + CRLF
}
