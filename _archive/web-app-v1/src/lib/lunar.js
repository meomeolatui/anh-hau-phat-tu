/**
 * Chuyển đổi Dương lịch ↔ Âm lịch Việt Nam (múi giờ GMT+7).
 * Thuật toán thiên văn của Hồ Ngọc Đức (https://www.informatik.uni-leipzig.de/~duc/amlich/),
 * viết lại theo ES module.
 */

const INT = Math.floor
const PI = Math.PI
const TZ = 7

export const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']
export const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']
export const LUNAR_MONTH_NAMES = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Một', 'Chạp']

export function jdFromDate(dd, mm, yy) {
  const a = INT((14 - mm) / 12)
  const y = yy + 4800 - a
  const m = mm + 12 * a - 3
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083
  return jd
}

export function jdToDate(jd) {
  let b, c
  if (jd > 2299160) {
    const a = jd + 32044
    b = INT((4 * a + 3) / 146097)
    c = a - INT((b * 146097) / 4)
  } else {
    b = 0
    c = jd + 32082
  }
  const d = INT((4 * c + 3) / 1461)
  const e = c - INT((1461 * d) / 4)
  const m = INT((5 * e + 2) / 153)
  const day = e - INT((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * INT(m / 10)
  const year = b * 100 + d - 4800 + INT(m / 10)
  return [day, month, year]
}

function newMoon(k) {
  const T = k / 1236.85
  const T2 = T * T
  const T3 = T2 * T
  const dr = PI / 180
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M)
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr)
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr)
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr))
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M))
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr))
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M))
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2
  return jd1 + C1 - deltat
}

function sunLongitude(jdn) {
  const T = (jdn - 2451545.0) / 36525
  const T2 = T * T
  const dr = PI / 180
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M)
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M)
  let L = (L0 + DL) * dr
  L -= PI * 2 * INT(L / (PI * 2))
  return L
}

const getSunLongitude = (dayNumber, tz) => INT((sunLongitude(dayNumber - 0.5 - tz / 24) / PI) * 6)
const getNewMoonDay = (k, tz) => INT(newMoon(k) + 0.5 + tz / 24)

function getLunarMonth11(yy, tz) {
  const off = jdFromDate(31, 12, yy) - 2415021
  const k = INT(off / 29.530588853)
  let nm = getNewMoonDay(k, tz)
  if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz)
  return nm
}

function getLeapMonthOffset(a11, tz) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5)
  let last
  let i = 1
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz)
  do {
    last = arc
    i++
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz)
  } while (arc !== last && i < 14)
  return i - 1
}

/** @returns [ngày, tháng, năm, nhuận(0|1)] âm lịch */
export function solarToLunar(dd, mm, yy, tz = TZ) {
  const dayNumber = jdFromDate(dd, mm, yy)
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853)
  let monthStart = getNewMoonDay(k + 1, tz)
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz)
  let a11 = getLunarMonth11(yy, tz)
  let b11 = a11
  let lunarYear
  if (a11 >= monthStart) {
    lunarYear = yy
    a11 = getLunarMonth11(yy - 1, tz)
  } else {
    lunarYear = yy + 1
    b11 = getLunarMonth11(yy + 1, tz)
  }
  const lunarDay = dayNumber - monthStart + 1
  const diff = INT((monthStart - a11) / 29)
  let lunarLeap = 0
  let lunarMonth = diff + 11
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, tz)
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10
      if (diff === leapMonthDiff) lunarLeap = 1
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1
  return [lunarDay, lunarMonth, lunarYear, lunarLeap]
}

/** @returns [ngày, tháng, năm] dương lịch, hoặc [0,0,0] nếu tháng nhuận không tồn tại */
export function lunarToSolar(lunarDay, lunarMonth, lunarYear, lunarLeap = 0, tz = TZ) {
  let a11, b11
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, tz)
    b11 = getLunarMonth11(lunarYear, tz)
  } else {
    a11 = getLunarMonth11(lunarYear, tz)
    b11 = getLunarMonth11(lunarYear + 1, tz)
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853)
  let off = lunarMonth - 11
  if (off < 0) off += 12
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, tz)
    let leapMonth = leapOff - 2
    if (leapMonth < 0) leapMonth += 12
    if (lunarLeap && lunarMonth !== leapMonth) return [0, 0, 0]
    if (lunarLeap || off >= leapOff) off += 1
  }
  const monthStart = getNewMoonDay(k + off, tz)
  return jdToDate(monthStart + lunarDay - 1)
}

export const canChiYear = (y) => `${CAN[(y + 6) % 10]} ${CHI[(y + 8) % 12]}`
export const canChiMonth = (m, y) => `${CAN[(y * 12 + m + 3) % 10]} ${CHI[(m + 1) % 12]}`
export const canChiDay = (jd) => `${CAN[(jd + 9) % 10]} ${CHI[(jd + 1) % 12]}`

/**
 * Thông tin âm lịch đầy đủ của một ngày dương lịch.
 * @param {Date} date
 */
export function getLunarDate(date = new Date()) {
  const dd = date.getDate()
  const mm = date.getMonth() + 1
  const yy = date.getFullYear()
  const [day, month, year, leap] = solarToLunar(dd, mm, yy)
  const jd = jdFromDate(dd, mm, yy)
  return {
    day,
    month,
    year,
    leap: leap === 1,
    jd,
    yearName: canChiYear(year),
    monthName: canChiMonth(month, year),
    dayName: canChiDay(jd),
    monthLabel: `tháng ${LUNAR_MONTH_NAMES[month - 1]}${leap ? ' (nhuận)' : ''}`,
  }
}

/** Date dương lịch của một ngày âm lịch, hoặc null nếu không tồn tại. */
export function lunarToDate(day, month, year, leap = false) {
  const [d, m, y] = lunarToSolar(day, month, year, leap ? 1 : 0)
  if (!d) return null
  return new Date(y, m - 1, d)
}

/** Số ngày của tháng âm (29 hoặc 30). */
export function lunarMonthLength(month, year, leap = false) {
  const start = lunarToDate(1, month, year, leap)
  if (!start) return 0
  const d30 = new Date(start)
  d30.setDate(d30.getDate() + 29)
  return getLunarDate(d30).day === 30 ? 30 : 29
}

/** "15/4" hoặc "15/4 nhuận" */
export function lunarShortLabel(l) {
  return `${l.day}/${l.month}${l.leap ? ' nhuận' : ''}`
}

/**
 * Lần gần nhất (tính từ `from`, bao gồm cả hôm nay) mà ngày âm `day/month` rơi vào.
 * Bỏ qua tháng nhuận (ngày vía tính theo tháng thường).
 */
export function nextLunarOccurrence(day, month, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const { year } = getLunarDate(start)
  for (const y of [year - 1, year, year + 1]) {
    let d = lunarToDate(day, month, y)
    // Tháng thiếu không có ngày 30 → lùi về ngày cuối tháng
    if (d && day === 30 && getLunarDate(d).day !== 30) d = lunarToDate(29, month, y)
    if (d && d >= start) return d
  }
  return null
}
