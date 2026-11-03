import { getFastingScheme, holidaysOn, isFastingDay } from '../../data/holidays'
import { addDays, toKey } from '../../lib/date'
import { getLunarDate, lunarShortLabel } from '../../lib/lunar'
import { formatIcsDate } from './ics'

const UID_DOMAIN = 'anh-hau-phat-tu.app'

/** Ngày cuối (không bao gồm) của khoảng `months` tháng kể từ `from`. */
export function rangeEnd(from, months) {
  return new Date(from.getFullYear(), from.getMonth() + months, from.getDate())
}

/**
 * Liệt kê sự kiện lịch (ngày lễ/vía + tuỳ chọn ngày chay) từ `from` trong `months` tháng.
 * Duyệt từng ngày dương để bắt đúng tháng nhuận và tháng thiếu thay vì tự suy ra ngày âm.
 */
export function collectCalendarEvents(
  from = new Date(),
  { months = 12, includeFasting = false, fasting = 'none', alarmHoursBefore = null } = {},
) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = rangeEnd(start, months)
  const scheme = getFastingScheme(fasting)
  const withFasting = includeFasting && scheme.days.length > 0
  const events = []
  for (let date = start; date < end; date = addDays(date, 1)) {
    const lunar = getLunarDate(date)
    const stamp = formatIcsDate(date)
    const lunarText = `${lunarShortLabel(lunar)} âm lịch, năm ${lunar.yearName}`
    for (const h of holidaysOn(lunar)) {
      events.push({
        uid: `${stamp}-${h.id}@${UID_DOMAIN}`,
        date,
        key: toKey(date),
        kind: 'holiday',
        summary: h.name,
        description: `${lunarText}.\n${h.desc}`,
        categories: ['Phật giáo', h.kind === 'via' ? 'Ngày vía' : 'Ngày lễ'],
        alarmHoursBefore,
      })
    }
    if (withFasting && isFastingDay(lunar, fasting)) {
      events.push({
        uid: `${stamp}-chay@${UID_DOMAIN}`,
        date,
        key: toKey(date),
        kind: 'fasting',
        summary: `Ngày chay (${lunarShortLabel(lunar)} âm)`,
        description: `${lunarText}.\nNgày ăn chay theo lối ${scheme.label.toLowerCase()}.`,
        categories: ['Phật giáo', 'Ngày chay'],
        alarmHoursBefore,
      })
    }
  }
  return events
}

/** Tên tệp tải về, vd. "le-via-ngay-chay-2026-11-02.ics" */
export function icsFileName(from = new Date()) {
  return `le-via-ngay-chay-${toKey(from)}.ics`
}
