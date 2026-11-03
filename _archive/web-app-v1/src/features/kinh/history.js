import { addDays, toKey } from '../../lib/date'

/**
 * Thống kê thời tụng từ lịch sử phiên (state.sessions, type 'tung').
 * Dùng để hiển thị "đã tụng mấy lần", "lần cuối" trên thẻ kinh — giúp người dùng
 * thấy nhịp đều đặn của mình, không phải để thi đua.
 */
export function tungStats(sessions, now = new Date()) {
  const today = toKey(now)
  const weekStart = toKey(addDays(now, -6))
  const out = { today: 0, week: 0, total: 0, seconds: 0, byId: {} }

  for (const s of sessions ?? []) {
    if (s?.type !== 'tung') continue
    const at = new Date(s.at)
    if (Number.isNaN(at.getTime())) continue
    const key = toKey(at)
    out.total += 1
    out.seconds += Number(s.duration) || 0
    if (key === today) out.today += 1
    if (key >= weekStart && key <= today) out.week += 1
    if (!s.ref) continue
    const prev = out.byId[s.ref]
    if (!prev) out.byId[s.ref] = { count: 1, last: s.at }
    else {
      prev.count += 1
      if (s.at > prev.last) prev.last = s.at
    }
  }
  return out
}

/** "hôm nay", "hôm qua", "3 ngày trước", hoặc ngày dd/mm. */
export function relativeDayLabel(iso, now = new Date()) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((b - a) / 86400000)
  if (days <= 0) return 'hôm nay'
  if (days === 1) return 'hôm qua'
  if (days < 7) return `${days} ngày trước`
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Gợi ý bài tụng theo thời điểm trong ngày — theo nếp thời khoá quen thuộc:
 * sáng ngắn gọn, tối trọn vẹn hơn.
 */
export function suggestByHour(hour = new Date().getHours()) {
  if (hour >= 4 && hour < 9) {
    return { id: 'muoi-niem-buoi-sang', label: 'Thời khoá sáng', hint: 'Hai phút niệm Phật trước khi bắt đầu ngày mới.' }
  }
  if (hour >= 9 && hour < 17) {
    return { id: 'bat-nha-tam-kinh', label: 'Giữa ngày', hint: 'Một bài kinh ngắn để lắng lại giữa những bận rộn.' }
  }
  if (hour >= 17 && hour < 22) {
    return { id: 'nghi-thuc-niem-phat', label: 'Thời khoá tối', hint: 'Mười lăm phút khép lại một ngày trong an tĩnh.' }
  }
  return { id: 'kinh-tu-bi', label: 'Trước giấc ngủ', hint: 'Gửi lòng thương đến mọi người trước khi nghỉ ngơi.' }
}
