import { describe, expect, it } from 'vitest'
import { matchesQuery, normalizeVi } from './search'
import { TEMPLES } from '../../data/temples'

describe('normalizeVi', () => {
  it('bỏ dấu, đổi đ thành d và viết thường', () => {
    expect(normalizeVi('Chùa Đồng – Yên Tử')).toBe('chua dong yen tu')
    expect(normalizeVi('THIÊN MỤ')).toBe('thien mu')
  })

  it('xử lý được chuỗi đã tổ hợp sẵn dấu (NFD) và giá trị rỗng', () => {
    expect(normalizeVi('Hương'.normalize('NFD'))).toBe('huong')
    expect(normalizeVi(null)).toBe('')
    expect(normalizeVi(undefined)).toBe('')
  })

  it('gộp dấu câu và khoảng trắng thừa', () => {
    expect(normalizeVi('  TP. Hồ   Chí Minh!! ')).toBe('tp ho chi minh')
  })
})

describe('matchesQuery', () => {
  const tranQuoc = TEMPLES.find((t) => t.id === 'chua-tran-quoc')
  const dong = TEMPLES.find((t) => t.id === 'chua-dong-yen-tu')

  it('truy vấn rỗng khớp tất cả', () => {
    expect(matchesQuery(tranQuoc, '')).toBe(true)
    expect(matchesQuery(tranQuoc, '   ')).toBe(true)
  })

  it('tìm được khi gõ không dấu', () => {
    expect(matchesQuery(tranQuoc, 'tran quoc')).toBe(true)
    expect(matchesQuery(tranQuoc, 'ho tay')).toBe(true)
  })

  it('các từ có thể đảo thứ tự nhưng phải xuất hiện đủ', () => {
    expect(matchesQuery(dong, 'yen tu dong')).toBe(true)
    expect(matchesQuery(dong, 'yen tu hue')).toBe(false)
  })

  it('tìm theo tên gọi khác (alias)', () => {
    const motCot = TEMPLES.find((t) => t.id === 'chua-mot-cot')
    expect(matchesQuery(motCot, 'dien huu')).toBe(true)
  })
})
