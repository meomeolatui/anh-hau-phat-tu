import { addDays } from '../lib/date'
import { getLunarDate, lunarMonthLength, nextLunarOccurrence } from '../lib/lunar'

/**
 * Ngày lễ, ngày vía Phật – Bồ Tát theo âm lịch (truyền thống Phật giáo Bắc tông tại Việt Nam).
 * kind: 'le' (đại lễ) | 'via' (ngày vía) | 'tet' (tết/rằm lớn)
 */
export const BUDDHIST_HOLIDAYS = [
  { id: 'di-lac', day: 1, month: 1, kind: 'tet', name: 'Tết Nguyên Đán · Vía Phật Di Lặc', short: 'Vía Di Lặc', desc: 'Ngày đầu năm mới, cũng là ngày vía đức Phật Di Lặc — biểu tượng của hoan hỷ và hy vọng.' },
  { id: 'thuong-nguyen', day: 15, month: 1, kind: 'tet', name: 'Rằm tháng Giêng · Tết Thượng Nguyên', short: 'Rằm tháng Giêng', desc: 'Rằm đầu tiên của năm; nhiều chùa tổ chức lễ cầu an đầu năm.' },
  { id: 'xuat-gia', day: 8, month: 2, kind: 'le', name: 'Phật Thích Ca xuất gia', short: 'Phật xuất gia', desc: 'Kỷ niệm ngày Thái tử Tất Đạt Đa rời hoàng cung, tìm đạo giải thoát.' },
  { id: 'niet-ban', day: 15, month: 2, kind: 'le', name: 'Phật Thích Ca nhập Niết Bàn', short: 'Phật nhập Niết Bàn', desc: 'Tưởng niệm ngày đức Phật nhập Niết Bàn, nhắc nhở về lẽ vô thường.' },
  { id: 'quan-am-dan-sanh', day: 19, month: 2, kind: 'via', name: 'Vía Quán Thế Âm Bồ Tát đản sanh', short: 'Vía Quán Âm', desc: 'Ngày vía đức Quán Thế Âm Bồ Tát — hiện thân của lòng từ bi lắng nghe tiếng khổ.' },
  { id: 'pho-hien', day: 21, month: 2, kind: 'via', name: 'Vía Phổ Hiền Bồ Tát', short: 'Vía Phổ Hiền', desc: 'Đức Phổ Hiền — biểu trưng cho hạnh nguyện và sự thực hành.' },
  { id: 'van-thu', day: 4, month: 4, kind: 'via', name: 'Vía Văn Thù Sư Lợi Bồ Tát', short: 'Vía Văn Thù', desc: 'Đức Văn Thù — biểu trưng cho trí tuệ.' },
  { id: 'phat-dan', day: 15, month: 4, kind: 'le', name: 'Đại lễ Phật Đản', short: 'Phật Đản', desc: 'Kỷ niệm ngày đức Phật Thích Ca đản sanh — đại lễ quan trọng bậc nhất trong năm.' },
  { id: 'quan-am-thanh-dao', day: 19, month: 6, kind: 'via', name: 'Vía Quán Thế Âm Bồ Tát thành đạo', short: 'Vía Quán Âm', desc: 'Ngày vía Quán Thế Âm Bồ Tát thành đạo.' },
  { id: 'the-chi', day: 13, month: 7, kind: 'via', name: 'Vía Đại Thế Chí Bồ Tát', short: 'Vía Thế Chí', desc: 'Đức Đại Thế Chí — cùng Quán Thế Âm phụ tá Phật A Di Đà.' },
  { id: 'vu-lan', day: 15, month: 7, kind: 'le', name: 'Đại lễ Vu Lan báo hiếu', short: 'Vu Lan', desc: 'Mùa báo hiếu, tưởng nhớ công ơn cha mẹ và ông bà tổ tiên.' },
  { id: 'dia-tang', day: 30, month: 7, kind: 'via', name: 'Vía Địa Tạng Vương Bồ Tát', short: 'Vía Địa Tạng', desc: 'Đức Địa Tạng — biểu trưng cho đại nguyện cứu độ chúng sinh.' },
  { id: 'quan-am-xuat-gia', day: 19, month: 9, kind: 'via', name: 'Vía Quán Thế Âm Bồ Tát xuất gia', short: 'Vía Quán Âm', desc: 'Ngày vía Quán Thế Âm Bồ Tát xuất gia.' },
  { id: 'duoc-su', day: 30, month: 9, kind: 'via', name: 'Vía Dược Sư Lưu Ly Quang Phật', short: 'Vía Dược Sư', desc: 'Đức Phật Dược Sư — nguyện chữa lành thân tâm cho chúng sinh.' },
  { id: 'ha-nguyen', day: 15, month: 10, kind: 'tet', name: 'Rằm tháng Mười · Tết Hạ Nguyên', short: 'Rằm tháng Mười', desc: 'Rằm cuối mùa thu hoạch, dịp tạ ơn và hồi hướng.' },
  { id: 'a-di-da', day: 17, month: 11, kind: 'via', name: 'Vía Phật A Di Đà', short: 'Vía A Di Đà', desc: 'Ngày vía đức Phật A Di Đà, giáo chủ cõi Tây Phương Cực Lạc.' },
  { id: 'thanh-dao', day: 8, month: 12, kind: 'le', name: 'Phật Thích Ca thành đạo', short: 'Phật thành đạo', desc: 'Kỷ niệm ngày đức Phật thành đạo dưới cội Bồ Đề.' },
]

/**
 * Các lối ăn chay theo ngày âm lịch. Ngày "30" áp dụng cho ngày cuối tháng
 * (tháng thiếu chỉ có 29 ngày thì ngày 29 được tính là ngày cuối tháng).
 */
export const FASTING_SCHEMES = [
  { id: 'none', label: 'Không theo dõi', days: [] },
  { id: 'nhi-trai', label: 'Nhị trai (2 ngày/tháng)', days: [1, 15] },
  { id: 'tu-trai', label: 'Tứ trai (4 ngày/tháng)', days: [1, 14, 15, 30] },
  { id: 'luc-trai', label: 'Lục trai (6 ngày/tháng)', days: [8, 14, 15, 23, 29, 30] },
  { id: 'thap-trai', label: 'Thập trai (10 ngày/tháng)', days: [1, 8, 14, 15, 18, 23, 24, 28, 29, 30] },
]

export function getFastingScheme(id) {
  return FASTING_SCHEMES.find((s) => s.id === id) ?? FASTING_SCHEMES[1]
}

/** @param lunar kết quả getLunarDate */
export function isFastingDay(lunar, schemeId) {
  const days = getFastingScheme(schemeId).days
  if (!days.length) return false
  if (days.includes(lunar.day)) return true
  // Tháng thiếu: ngày 29 là ngày cuối tháng → tính như ngày 30
  if (days.includes(30) && lunar.day === 29) return lunarMonthLength(lunar.month, lunar.year, lunar.leap) === 29
  return false
}

/** Ngày lễ/vía rơi đúng vào ngày âm này (bỏ qua tháng nhuận). */
export function holidaysOn(lunar) {
  if (lunar.leap) return []
  return BUDDHIST_HOLIDAYS.filter((h) => {
    if (h.month !== lunar.month) return false
    if (h.day === lunar.day) return true
    // Vía ngày 30 rơi vào tháng thiếu → cử hành ngày 29
    return h.day === 30 && lunar.day === 29 && lunarMonthLength(lunar.month, lunar.year) === 29
  })
}

/** Ngày mùng 1 (Sóc) hoặc Rằm (Vọng) — ngày nhiều người đi chùa. */
export function isSocVong(lunar) {
  return lunar.day === 1 || lunar.day === 15
}

/**
 * Các ngày lễ/vía sắp tới, tính từ `from` (bao gồm hôm nay).
 * @returns [{ ...holiday, date: Date, daysLeft: number }] sắp xếp theo ngày
 */
export function upcomingHolidays(from = new Date(), limit = 5) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  return BUDDHIST_HOLIDAYS.map((h) => {
    const date = nextLunarOccurrence(h.day, h.month, start)
    return date ? { ...h, date, daysLeft: Math.round((date - start) / 86400000) } : null
  })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date)
    .slice(0, limit)
}

/** Ngày chay sắp tới theo lối chay đã chọn (tối đa `limit` ngày, trong vòng 60 ngày). */
export function upcomingFastingDays(schemeId, from = new Date(), limit = 3) {
  const out = []
  if (!getFastingScheme(schemeId).days.length) return out
  for (let i = 0; i < 60 && out.length < limit; i++) {
    const date = addDays(new Date(from.getFullYear(), from.getMonth(), from.getDate()), i)
    const lunar = getLunarDate(date)
    if (isFastingDay(lunar, schemeId)) out.push({ date, lunar, daysLeft: i })
  }
  return out
}
