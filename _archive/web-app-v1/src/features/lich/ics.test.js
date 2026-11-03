import { describe, expect, it } from 'vitest'
import { buildIcs, escapeText, foldLine, formatIcsDate, formatIcsDateTime } from './ics'
import { collectCalendarEvents, icsFileName, rangeEnd } from './calendar-events'
import { getLunarDate } from '../../lib/lunar'
import { BUDDHIST_HOLIDAYS } from '../../data/holidays'

const byteLength = (s) => new TextEncoder().encode(s).length

/** Bỏ gập dòng để đọc lại các thuộc tính */
const unfold = (ics) => ics.replace(/\r\n /g, '')

describe('định dạng ngày', () => {
  it('ngày cả ngày dạng YYYYMMDD theo giờ địa phương', () => {
    expect(formatIcsDate(new Date(2026, 0, 5))).toBe('20260105')
    expect(formatIcsDate(new Date(2026, 10, 24, 23, 59))).toBe('20261124')
  })

  it('DTSTAMP theo UTC có hậu tố Z', () => {
    expect(formatIcsDateTime(new Date(Date.UTC(2026, 10, 2, 3, 4, 5)))).toBe('20261102T030405Z')
  })
})

describe('escapeText', () => {
  it('escape dấu \\ ; , và xuống dòng', () => {
    expect(escapeText('a\\b')).toBe('a\\\\b')
    expect(escapeText('Rằm; tháng Giêng, cầu an')).toBe('Rằm\\; tháng Giêng\\, cầu an')
    expect(escapeText('dòng 1\ndòng 2\r\ndòng 3')).toBe('dòng 1\\ndòng 2\\ndòng 3')
  })

  it('escape dấu \\ trước để không escape hai lần', () => {
    expect(escapeText('\\,')).toBe('\\\\\\,')
  })

  it('chịu được giá trị rỗng', () => {
    expect(escapeText(undefined)).toBe('')
    expect(escapeText(null)).toBe('')
  })
})

describe('foldLine', () => {
  it('không gập dòng ngắn', () => {
    expect(foldLine('SUMMARY:Phật Đản')).toBe('SUMMARY:Phật Đản')
  })

  it('mỗi dòng gập tối đa 75 octet UTF-8, dòng tiếp nối bắt đầu bằng dấu cách', () => {
    const line = `DESCRIPTION:${'Tưởng niệm ngày đức Phật nhập Niết Bàn, nhắc nhở về lẽ vô thường. '.repeat(5)}`
    const folded = foldLine(line)
    const parts = folded.split('\r\n')
    expect(parts.length).toBeGreaterThan(2)
    parts.forEach((p, i) => {
      expect(byteLength(p)).toBeLessThanOrEqual(75)
      if (i > 0) expect(p.startsWith(' ')).toBe(true)
    })
    expect(unfold(folded)).toBe(line)
  })

  it('không cắt đôi ký tự nhiều byte', () => {
    const line = 'X:' + 'ệ'.repeat(60) // 'ệ' = 3 byte
    const parts = foldLine(line).split('\r\n')
    expect(byteLength(parts[0])).toBe(74) // 2 + 24×3, thêm một ký tự nữa sẽ vượt 75
    for (const p of parts) expect(p).not.toContain('�')
    expect(unfold(foldLine(line))).toBe(line)
  })

  it('xử lý ký tự 4 byte (emoji) như một khối', () => {
    const line = 'X:' + '🪷'.repeat(30)
    const parts = foldLine(line).split('\r\n')
    for (const p of parts) expect(byteLength(p)).toBeLessThanOrEqual(75)
    expect(unfold(foldLine(line))).toBe(line)
  })
})

describe('buildIcs', () => {
  const now = new Date(Date.UTC(2026, 10, 2, 0, 0, 0))
  const events = [
    {
      uid: '20261124-thanh-dao@test',
      date: new Date(2026, 10, 24),
      summary: 'Lễ, Vía; thử',
      description: 'Dòng một\nDòng hai',
      categories: ['Phật giáo', 'Ngày lễ'],
    },
    { uid: '20261231-chay@test', date: new Date(2026, 11, 31), summary: 'Ngày chay', alarmHoursBefore: 6 },
  ]

  it('dùng CRLF cho mọi dòng và kết thúc bằng CRLF', () => {
    const ics = buildIcs(events, { now })
    expect(ics.endsWith('\r\n')).toBe(true)
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('có khung VCALENDAR chuẩn', () => {
    const lines = unfold(buildIcs(events, { now })).split('\r\n')
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines).toContain('VERSION:2.0')
    expect(lines.some((l) => l.startsWith('PRODID:'))).toBe(true)
    expect(lines.at(-2)).toBe('END:VCALENDAR')
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(2)
    expect(lines.filter((l) => l === 'END:VEVENT')).toHaveLength(2)
  })

  it('sự kiện cả ngày dùng DTSTART;VALUE=DATE và DTEND là ngày hôm sau (kể cả qua năm)', () => {
    const ics = unfold(buildIcs(events, { now }))
    expect(ics).toContain('DTSTART;VALUE=DATE:20261124\r\nDTEND;VALUE=DATE:20261125')
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101')
    expect(ics).toContain('DTSTAMP:20261102T000000Z')
  })

  it('escape văn bản trong SUMMARY/DESCRIPTION và nối CATEGORIES bằng dấu phẩy', () => {
    const ics = unfold(buildIcs(events, { now }))
    expect(ics).toContain('SUMMARY:Lễ\\, Vía\\; thử')
    expect(ics).toContain('DESCRIPTION:Dòng một\\nDòng hai')
    expect(ics).toContain('CATEGORIES:Phật giáo,Ngày lễ')
  })

  it('thêm VALARM khi có nhắc trước', () => {
    const ics = unfold(buildIcs(events, { now }))
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(1)
    expect(ics).toContain('TRIGGER:-PT6H')
    expect(ics).toContain('ACTION:DISPLAY')
  })

  it('bỏ sự kiện trùng UID', () => {
    const ics = buildIcs([...events, events[0]], { now })
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2)
  })

  it('mọi dòng vật lý đều không vượt 75 octet', () => {
    const real = collectCalendarEvents(new Date(2026, 10, 2), { includeFasting: true, fasting: 'thap-trai' })
    const ics = buildIcs(real, { now })
    for (const line of ics.split('\r\n')) expect(byteLength(line)).toBeLessThanOrEqual(75)
  })

  it('lịch rỗng vẫn hợp lệ', () => {
    const ics = buildIcs([], { now })
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).not.toContain('BEGIN:VEVENT')
  })
})

describe('collectCalendarEvents', () => {
  const from = new Date(2026, 10, 2)

  it('phủ đủ mọi ngày lễ/vía trong 12 tháng tới, theo thứ tự thời gian', () => {
    const list = collectCalendarEvents(from)
    expect(list.every((e) => e.kind === 'holiday')).toBe(true)
    // 12 tháng dương dài hơn 12 tháng âm nên có thể gặp một ngày vía hai lần (vd. Vía Dược Sư)
    expect(new Set(list.map((e) => e.uid.split('@')[0].slice(9)))).toEqual(new Set(BUDDHIST_HOLIDAYS.map((h) => h.id)))
    expect(list.length).toBeGreaterThanOrEqual(BUDDHIST_HOLIDAYS.length)
    expect(list.filter((e) => e.uid.includes('duoc-su')).map((e) => e.key)).toEqual(['2026-11-08', '2027-10-28'])
    const times = list.map((e) => e.date.getTime())
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(list.every((e) => e.date >= from && e.date < rangeEnd(from, 12))).toBe(true)
  })

  it('ngày của sự kiện khớp đúng ngày âm', () => {
    const list = collectCalendarEvents(from)
    const phatDan = list.find((e) => e.uid.includes('phat-dan'))
    expect(getLunarDate(phatDan.date)).toMatchObject({ day: 15, month: 4, leap: false })
    expect(phatDan.summary).toBe('Đại lễ Phật Đản')
  })

  it('UID duy nhất và ổn định', () => {
    const a = collectCalendarEvents(from, { includeFasting: true, fasting: 'luc-trai' })
    const b = collectCalendarEvents(from, { includeFasting: true, fasting: 'luc-trai' })
    expect(new Set(a.map((e) => e.uid)).size).toBe(a.length)
    expect(a.map((e) => e.uid)).toEqual(b.map((e) => e.uid))
  })

  it('thêm ngày chay khi được chọn — nhị trai ~24 ngày/năm', () => {
    const list = collectCalendarEvents(from, { includeFasting: true, fasting: 'nhi-trai' })
    const fasting = list.filter((e) => e.kind === 'fasting')
    expect(fasting.length).toBeGreaterThanOrEqual(24)
    expect(fasting.length).toBeLessThanOrEqual(26)
    for (const e of fasting) expect([1, 15]).toContain(getLunarDate(e.date).day)
  })

  it('không thêm ngày chay khi lối chay là "không theo dõi"', () => {
    const list = collectCalendarEvents(from, { includeFasting: true, fasting: 'none' })
    expect(list.some((e) => e.kind === 'fasting')).toBe(false)
  })

  it('truyền nhắc trước vào từng sự kiện', () => {
    const list = collectCalendarEvents(from, { months: 1, alarmHoursBefore: 6 })
    expect(list.every((e) => e.alarmHoursBefore === 6)).toBe(true)
  })

  it('tên tệp có ngày bắt đầu', () => {
    expect(icsFileName(from)).toBe('le-via-ngay-chay-2026-11-02.ics')
  })
})
