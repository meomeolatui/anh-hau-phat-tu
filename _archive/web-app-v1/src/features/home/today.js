import { addDaysKey, fromKey, WEEKDAYS_SHORT_VI } from '../../lib/date'
import { isActiveDay } from '../../lib/stats'
import { getFastingScheme, holidaysOn, isFastingDay, isSocVong } from '../../data/holidays'

/** "Ngày 12 tháng Chín năm Bính Ngọ" */
export function lunarHeading(lunar) {
  return `Ngày ${lunar.day} ${lunar.monthLabel} năm ${lunar.yearName}`
}

/**
 * Dải N ngày gần nhất (cũ → mới, kết thúc ở hôm nay) để vẽ các chấm tu tập.
 * @returns [{ key, weekday, dayOfMonth, active, isToday }]
 */
export function recentDays(logs, today, n = 7) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const key = addDaysKey(today, -i)
    const date = fromKey(key)
    out.push({
      key,
      weekday: WEEKDAYS_SHORT_VI[date.getDay()],
      dayOfMonth: date.getDate(),
      active: isActiveDay(logs[key]),
      isToday: i === 0,
    })
  }
  return out
}

/** Nhãn đếm ngược thân thiện: "Hôm nay", "Ngày mai", "Còn 5 ngày". */
export function countdownLabel(daysLeft) {
  if (daysLeft <= 0) return 'Hôm nay'
  if (daysLeft === 1) return 'Ngày mai'
  return `Còn ${daysLeft} ngày`
}

/**
 * Các nhãn nổi bật cho ngày âm hôm nay: ngày lễ/vía, mùng Một/Rằm, ngày chay.
 * Mùng Một/Rằm vẫn hiện riêng dù trùng ngày chay, vì đó là ngày nhiều người đi chùa.
 * @returns [{ id, label, tone: 'saffron'|'lotus'|'jade' }]
 */
export function todayBadges(lunar, fastingSchemeId) {
  const badges = holidaysOn(lunar).map((h) => ({ id: `le-${h.id}`, label: h.short, tone: 'saffron' }))
  if (isSocVong(lunar)) {
    badges.push({ id: 'soc-vong', label: lunar.day === 1 ? 'Mùng Một' : 'Ngày Rằm', tone: 'lotus' })
  }
  if (isFastingDay(lunar, fastingSchemeId)) {
    const scheme = getFastingScheme(fastingSchemeId)
    badges.push({ id: 'chay', label: `Ngày chay · ${scheme.label.split(' (')[0]}`, tone: 'jade' })
  }
  return badges
}
