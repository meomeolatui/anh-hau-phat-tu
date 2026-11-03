import { describe, expect, it } from 'vitest'
import {
  buildBuckets,
  buildHeatmap,
  compactNumber,
  deedsByCategory,
  describeDay,
  groupVowsByMonth,
  hasJournalContent,
  journalEntries,
  niceScale,
  normalizeDayKey,
  normalizeTab,
  pickPrompt,
  pickSuggestions,
  summarize,
} from './journal'
import { DEED_CATEGORIES, DEED_SUGGESTIONS, REFLECTION_PROMPTS, VOW_TEMPLATES, VOW_TYPES, getDeedCategory } from '../../data/good-deeds'

const day = (patch = {}) => ({ niem: 0, thienMin: 0, tung: 0, thienHanh: [], note: '', mood: null, ...patch })
const deed = (category = 'khac') => ({ id: Math.random().toString(36), text: 'x', category, at: '2026-11-01T08:00:00.000Z' })
const goals = { niem: 1080, thienMin: 15, thienHanh: 1 }

describe('dữ liệu thiện hạnh', () => {
  it('mỗi gợi ý thuộc một nhóm có thật và id không trùng', () => {
    const ids = new Set(DEED_CATEGORIES.map((c) => c.id))
    for (const s of DEED_SUGGESTIONS) expect(ids.has(s.category)).toBe(true)
    expect(new Set(DEED_SUGGESTIONS.map((s) => s.id)).size).toBe(DEED_SUGGESTIONS.length)
    expect(DEED_SUGGESTIONS.length).toBeGreaterThanOrEqual(40)
    expect(REFLECTION_PROMPTS.length).toBeGreaterThanOrEqual(15)
  })

  it('nhóm lạ quy về "Khác"', () => {
    expect(getDeedCategory('khong-ton-tai').id).toBe('khac')
    expect(getDeedCategory('hieu-thao').label).toBe('Hiếu thảo')
  })

  it('mẫu sổ nguyện đều thuộc loại hợp lệ', () => {
    const types = new Set(VOW_TYPES.map((t) => t.id))
    for (const t of VOW_TEMPLATES) expect(types.has(t.type)).toBe(true)
  })
})

describe('URL', () => {
  it('tab lạ quy về "hom-nay"', () => {
    expect(normalizeTab('thong-ke')).toBe('thong-ke')
    expect(normalizeTab('abc')).toBe('hom-nay')
    expect(normalizeTab(null)).toBe('hom-nay')
  })

  it('ngày sai, không tồn tại hoặc ở tương lai quy về hôm nay', () => {
    const today = '2026-11-02'
    expect(normalizeDayKey('2026-10-15', today)).toBe('2026-10-15')
    expect(normalizeDayKey('2026-02-31', today)).toBe(today)
    expect(normalizeDayKey('2026-12-01', today)).toBe(today)
    expect(normalizeDayKey('hom-qua', today)).toBe(today)
    expect(normalizeDayKey(null, today)).toBe(today)
  })
})

describe('gợi ý theo ngày', () => {
  it('cùng ngày cho cùng kết quả, các gợi ý không trùng nhau', () => {
    const a = pickSuggestions(DEED_SUGGESTIONS, '2026-11-02')
    const b = pickSuggestions(DEED_SUGGESTIONS, '2026-11-02')
    expect(a).toEqual(b)
    expect(a).toHaveLength(3)
    expect(new Set(a.map((s) => s.id)).size).toBe(3)
  })

  it('đổi lượt cho gợi ý khác, đi hết danh sách mới lặp lại', () => {
    const seen = new Set()
    const rounds = Math.floor(DEED_SUGGESTIONS.length / 3)
    for (let r = 0; r < rounds; r++) for (const s of pickSuggestions(DEED_SUGGESTIONS, '2026-11-02', 3, r)) seen.add(s.id)
    expect(seen.size).toBe(rounds * 3)
  })

  it('ngày khác nhau thường ra thứ tự khác nhau', () => {
    const days = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']
    const firsts = new Set(days.map((d) => pickSuggestions(DEED_SUGGESTIONS, d)[0].id))
    expect(firsts.size).toBeGreaterThan(1)
  })

  it('danh sách ngắn hơn số cần chọn và danh sách rỗng', () => {
    expect(pickSuggestions([{ id: 'a' }], '2026-11-02', 3)).toEqual([{ id: 'a' }])
    expect(pickSuggestions([], '2026-11-02')).toEqual([])
  })

  it('câu tự vấn xoay vòng theo lượt', () => {
    const p0 = pickPrompt(REFLECTION_PROMPTS, '2026-11-02', 0)
    const p1 = pickPrompt(REFLECTION_PROMPTS, '2026-11-02', 1)
    expect(REFLECTION_PROMPTS).toContain(p0)
    expect(p1).not.toBe(p0)
    expect(pickPrompt(REFLECTION_PROMPTS, '2026-11-02', REFLECTION_PROMPTS.length)).toBe(p0)
  })
})

describe('mô tả ngày & dòng thời gian', () => {
  it('mô tả đủ các hoạt động', () => {
    const d = day({ niem: 1080, thienMin: 15, tung: 1, thienHanh: [deed(), deed()] })
    expect(describeDay('2026-11-02', d)).toBe('02/11: 1.080 câu niệm, 15 phút thiền, 1 thời kinh, 2 việc lành')
    expect(describeDay('2026-11-02', null)).toBe('02/11: chưa ghi nhận')
  })

  it('chỉ lấy ngày có ghi chép, mới nhất trước, bỏ ngày tương lai', () => {
    const logs = {
      '2026-10-30': day({ note: 'Bình yên' }),
      '2026-10-31': day({ niem: 100 }),
      '2026-11-01': day({ mood: 4 }),
      '2026-11-02': day({ thienHanh: [deed()] }),
      '2026-11-05': day({ note: 'tương lai' }),
    }
    expect(journalEntries(logs, '2026-11-02').map((e) => e.key)).toEqual(['2026-11-02', '2026-11-01', '2026-10-30'])
    expect(hasJournalContent(day({ note: '   ' }))).toBe(false)
  })
})

describe('lịch nhiệt', () => {
  it('26 tuần × 7 ngày, bắt đầu thứ Hai, cột cuối chứa hôm nay', () => {
    // 2026-11-02 là thứ Hai
    const { columns } = buildHeatmap({}, goals, '2026-11-02')
    expect(columns).toHaveLength(26)
    for (const c of columns) {
      expect(c.cells).toHaveLength(7)
      expect(new Date(`${c.key}T00:00:00`).getDay()).toBe(1)
    }
    const last = columns.at(-1)
    expect(last.cells[0].key).toBe('2026-11-02')
    expect(last.cells[0].future).toBe(false)
    expect(last.cells.slice(1).every((c) => c.future)).toBe(true)
  })

  it('mức độ lấy từ intensity và ngày chủ nhật nằm hàng cuối', () => {
    const logs = { '2026-11-01': day({ niem: 1080, thienMin: 15, thienHanh: [deed()] }) }
    const { columns } = buildHeatmap(logs, goals, '2026-11-04', 2)
    const sunday = columns[0].cells[6]
    expect(sunday.key).toBe('2026-11-01')
    expect(sunday.level).toBe(4)
    expect(columns[1].cells[0].level).toBe(0)
  })

  it('gắn nhãn tháng ở tuần chứa ngày mùng 1', () => {
    const { columns, months } = buildHeatmap({}, goals, '2026-11-02')
    for (const m of months.filter((x) => x.index > 0)) {
      expect(columns[m.index].cells.some((c) => c.key.endsWith('-01'))).toBe(true)
    }
    expect(months.at(-1).label).toBe('thg 11')
  })
})

describe('gom thống kê', () => {
  const logs = {
    '2026-10-27': day({ niem: 100, thienMin: 10 }),
    '2026-11-01': day({ niem: 500, thienHanh: [deed('hieu-thao'), deed('tu-bi')] }),
    '2026-11-02': day({ thienMin: 20, tung: 1, thienHanh: [deed('hieu-thao')] }),
    '2026-09-15': day({ niem: 1000 }),
    '2025-10-10': day({ niem: 9999 }),
  }

  it('7 ngày: mỗi cột một ngày, kết thúc hôm nay', () => {
    const b = buildBuckets(logs, '7d', '2026-11-02')
    expect(b).toHaveLength(7)
    expect(b[0].key).toBe('2026-10-27')
    expect(b.at(-1).key).toBe('2026-11-02')
    expect(b.at(-1).label).toBe('T2')
    const s = summarize(b)
    expect(s).toMatchObject({ niem: 600, thienMin: 30, tung: 1, thienHanh: 3, activeDays: 3, days: 7 })
    expect(s.avgNiem).toBe(86)
  })

  it('30 ngày dùng nhãn ngày/tháng', () => {
    const b = buildBuckets(logs, '30d', '2026-11-02')
    expect(b).toHaveLength(30)
    expect(b.at(-1).label).toBe('02/11')
  })

  it('12 tháng: gom theo tháng, tháng hiện tại tính đến hôm nay, bỏ dữ liệu ngoài khoảng', () => {
    const b = buildBuckets(logs, '12m', '2026-11-02')
    expect(b).toHaveLength(12)
    expect(b[0]).toMatchObject({ key: '2025-12', label: 'T12', days: 31 })
    const oct = b.find((x) => x.key === '2026-10')
    const nov = b.at(-1)
    expect(oct.niem).toBe(100)
    expect(nov).toMatchObject({ key: '2026-11', niem: 500, thienMin: 20, days: 2, fullLabel: 'Tháng 11/2026' })
    expect(b.find((x) => x.key === '2026-09').niem).toBe(1000)
    expect(summarize(b).niem).toBe(1600)
  })

  it('đếm thiện hạnh theo nhóm, nhóm lạ vào "Khác"', () => {
    const extra = { ...logs, '2026-10-31': day({ thienHanh: [deed('nhom-cu')] }) }
    const r = deedsByCategory(extra, '2026-10-27', '2026-11-02', DEED_CATEGORIES)
    expect(r.total).toBe(4)
    expect(r.items[0]).toEqual({ id: 'hieu-thao', count: 2, share: 0.5 })
    expect(r.items.map((x) => x.id)).toEqual(['hieu-thao', 'tu-bi', 'khac'])
    expect(deedsByCategory({}, '2026-10-27', '2026-11-02', DEED_CATEGORIES)).toEqual({ total: 0, items: [] })
  })
})

describe('trục biểu đồ', () => {
  it('thang đẹp, phủ giá trị lớn nhất', () => {
    expect(niceScale(1080)).toEqual({ max: 1500, step: 500, ticks: [0, 500, 1000, 1500] })
    expect(niceScale(7).ticks).toEqual([0, 2, 4, 6, 8])
    expect(niceScale(3)).toMatchObject({ max: 3, step: 1 })
    expect(niceScale(0)).toMatchObject({ max: 4, step: 1 })
  })

  it('số gọn', () => {
    expect(compactNumber(900)).toBe('900')
    expect(compactNumber(1500)).toBe('1,5k')
    expect(compactNumber(2_000_000)).toBe('2tr')
  })
})

describe('sổ nguyện', () => {
  it('gom theo tháng, giữ thứ tự', () => {
    const vows = [
      { id: 'c', at: new Date(2026, 10, 2, 9).toISOString() },
      { id: 'b', at: new Date(2026, 10, 1, 9).toISOString() },
      { id: 'a', at: new Date(2026, 9, 20, 9).toISOString() },
      { id: 'x', at: 'không hợp lệ' },
    ]
    const g = groupVowsByMonth(vows)
    expect(g.map((x) => x.label)).toEqual(['Tháng 11/2026', 'Tháng 10/2026', 'Không rõ thời gian'])
    expect(g[0].items.map((v) => v.id)).toEqual(['c', 'b'])
  })
})
