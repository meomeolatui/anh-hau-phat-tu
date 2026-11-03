import { describe, expect, it } from 'vitest'
import {
  NOTE_LIMIT,
  appendReflection,
  countByTheme,
  filterQuotes,
  formatQuoteForCopy,
  normalizeVi,
  pickRandomQuote,
  pushRecent,
} from './quote-utils'

const Q = [
  { id: 'a', text: 'Tâm dẫn đầu các pháp', source: 'Kinh Pháp Cú, kệ 1', theme: 'tam' },
  { id: 'b', text: 'Hận thù không dập tắt hận thù', source: 'Kinh Pháp Cú, kệ 5', theme: 'tu-bi' },
  { id: 'c', text: 'Nhẫn nhục là hạnh cao nhất', source: 'Kinh Pháp Cú, kệ 184', theme: 'nhan-nhuc' },
  { id: 'd', text: 'Ưng vô sở trụ nhi sanh kỳ tâm.', gloss: 'Lược giải: không bám víu', source: 'Kinh Kim Cang', theme: 'tam' },
]
const labels = { tam: 'Tâm', 'tu-bi': 'Từ bi', 'nhan-nhuc': 'Nhẫn nhục' }
const getThemeLabel = (id) => labels[id]

describe('normalizeVi', () => {
  it('bỏ dấu, đổi đ thành d, chữ thường, gọn khoảng trắng', () => {
    expect(normalizeVi('  Đức  Phật Dạy ')).toBe('duc phat day')
    expect(normalizeVi('Nhẫn nhục')).toBe('nhan nhuc')
    expect(normalizeVi(null)).toBe('')
  })
})

describe('filterQuotes', () => {
  it('tìm không dấu và có dấu cho cùng kết quả', () => {
    expect(filterQuotes(Q, { query: 'han thu' }).map((q) => q.id)).toEqual(['b'])
    expect(filterQuotes(Q, { query: 'hận thù' }).map((q) => q.id)).toEqual(['b'])
  })

  it('mọi từ khoá đều phải khớp', () => {
    expect(filterQuotes(Q, { query: 'kinh 184' }).map((q) => q.id)).toEqual(['c'])
    expect(filterQuotes(Q, { query: 'kim 184' })).toEqual([])
  })

  it('tìm được trong nguồn, lược giải và tên chủ đề', () => {
    expect(filterQuotes(Q, { query: 'kim cang' }).map((q) => q.id)).toEqual(['d'])
    expect(filterQuotes(Q, { query: 'bam viu' }).map((q) => q.id)).toEqual(['d'])
    expect(filterQuotes(Q, { query: 'tu bi', getThemeLabel }).map((q) => q.id)).toEqual(['b'])
  })

  it('lọc theo chủ đề', () => {
    expect(filterQuotes(Q, { theme: 'tam' }).map((q) => q.id)).toEqual(['a', 'd'])
    expect(filterQuotes(Q, { theme: 'all' })).toHaveLength(4)
  })

  it('chỉ yêu thích: giữ thứ tự yêu thích, bỏ id không còn tồn tại', () => {
    const r = filterQuotes(Q, { onlyFavorites: true, favoriteIds: ['c', 'x', 'a'] })
    expect(r.map((q) => q.id)).toEqual(['c', 'a'])
  })

  it('từ khoá rỗng trả về nguyên danh sách', () => {
    expect(filterQuotes(Q, { query: '   ' })).toBe(Q)
  })
})

describe('countByTheme', () => {
  it('đếm theo chủ đề và tổng', () => {
    expect(countByTheme(Q)).toEqual({ all: 4, tam: 2, 'tu-bi': 1, 'nhan-nhuc': 1 })
  })
})

describe('pickRandomQuote', () => {
  it('trả về null khi danh sách rỗng, trả về câu duy nhất khi chỉ có một', () => {
    expect(pickRandomQuote([], [])).toBeNull()
    expect(pickRandomQuote([Q[0]], ['a'])).toBe(Q[0])
  })

  it('không chọn câu vừa xem', () => {
    for (let i = 0; i < 20; i++) {
      const r = pickRandomQuote(Q, ['a', 'b'], () => i / 20)
      expect(['c', 'd']).toContain(r.id)
    }
  })

  it('khi đã xem hết thì chỉ tránh câu cuối cùng', () => {
    for (let i = 0; i < 20; i++) {
      const r = pickRandomQuote(Q, ['a', 'b', 'c', 'd'], () => i / 20)
      expect(r.id).not.toBe('d')
    }
  })

  it('an toàn khi random trả về sát 1', () => {
    expect(pickRandomQuote(Q, [], () => 0.9999999)).toBe(Q[3])
  })
})

describe('pushRecent', () => {
  it('đưa id xuống cuối, không trùng, giới hạn độ dài', () => {
    expect(pushRecent(['a', 'b'], 'a')).toEqual(['b', 'a'])
    expect(pushRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['b', 'c', 'd'])
  })
})

describe('formatQuoteForCopy', () => {
  it('gồm câu trong ngoặc kép, lược giải, nguồn và tên ứng dụng', () => {
    const t = formatQuoteForCopy(Q[3])
    expect(t).toContain('“Ưng vô sở trụ nhi sanh kỳ tâm.”')
    expect(t).toContain('Lược giải: không bám víu')
    expect(t).toContain('— Kinh Kim Cang')
    expect(t).toContain('Anh Hậu Phật Tử')
  })
})

describe('appendReflection', () => {
  it('tạo ghi chú mới khi chưa có', () => {
    const r = appendReflection('', Q[0], '  Hôm nay mình giận ít hơn.  ')
    expect(r.ok).toBe(true)
    expect(r.note).toBe('[Chiêm nghiệm] “Tâm dẫn đầu các pháp” — Kinh Pháp Cú, kệ 1\nHôm nay mình giận ít hơn.')
  })

  it('nối vào sau ghi chú cũ, cách một dòng trống', () => {
    const r = appendReflection('Ghi chú sáng nay', Q[1], 'Buông bớt')
    expect(r.note.startsWith('Ghi chú sáng nay\n\n[Chiêm nghiệm]')).toBe(true)
  })

  it('rút gọn câu trích dài', () => {
    const r = appendReflection('', { ...Q[0], text: 'x'.repeat(120) }, 'ok')
    expect(r.note).toContain('…”')
  })

  it('từ chối khi rỗng hoặc vượt giới hạn nhật ký', () => {
    expect(appendReflection('cũ', Q[0], '   ')).toEqual({ ok: false, reason: 'empty', note: 'cũ' })
    const r = appendReflection('y'.repeat(NOTE_LIMIT - 10), Q[0], 'quá dài rồi')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('too-long')
  })
})
