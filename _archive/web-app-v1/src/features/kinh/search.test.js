import { describe, expect, it } from 'vitest'
import { buildIndex, normalizeVi, removeDiacritics, searchIndex, searchSutras, tokenize } from './search'
import { SUTRAS, getSutra } from '../../data/sutras'

describe('removeDiacritics / normalizeVi', () => {
  it('bỏ toàn bộ dấu tiếng Việt, kể cả đ/Đ', () => {
    expect(removeDiacritics('Đà Lạt ướt át, Bồ Đề')).toBe('Da Lat uot at, Bo De')
    expect(removeDiacritics('Nguyễn Thị Hồng Nhung')).toBe('Nguyen Thi Hong Nhung')
  })
  it('xử lý cả chữ dựng sẵn (NFC) lẫn tổ hợp (NFD)', () => {
    const nfd = 'Tâm Kinh'.normalize('NFD')
    expect(normalizeVi(nfd)).toBe('tam kinh')
    expect(normalizeVi('Tâm Kinh')).toBe('tam kinh')
  })
  it('chữ thường, bỏ dấu câu, gộp khoảng trắng', () => {
    expect(normalizeVi('  Yết đế,   yết đế!  ')).toBe('yet de yet de')
    expect(normalizeVi(null)).toBe('')
  })
  it('tokenize trả mảng rỗng với chuỗi trống', () => {
    expect(tokenize('   ')).toEqual([])
    expect(tokenize('Chú Vãng')).toEqual(['chu', 'vang'])
  })
})

describe('searchSutras', () => {
  const ids = (results) => results.map((r) => r.sutra.id)

  it('trả về tất cả khi từ khoá rỗng', () => {
    expect(searchSutras(SUTRAS, '', getSutra)).toHaveLength(SUTRAS.length)
  })
  it('tìm được khi gõ không dấu', () => {
    expect(ids(searchSutras(SUTRAS, 'tam kinh', getSutra))[0]).toBe('bat-nha-tam-kinh')
    expect(ids(searchSutras(SUTRAS, 'chu vang sanh', getSutra))[0]).toBe('chu-vang-sanh')
  })
  it('tìm được khi gõ có dấu', () => {
    expect(ids(searchSutras(SUTRAS, 'Hồi Hướng', getSutra))[0]).toBe('ke-hoi-huong')
  })
  it('khớp trong kinh văn kèm trích đoạn và chỉ số dòng', () => {
    const results = searchSutras(SUTRAS, 'sac bat di khong', getSutra)
    const heart = results.find((r) => r.sutra.id === 'bat-nha-tam-kinh')
    expect(heart).toBeTruthy()
    expect(heart.snippet).toContain('Sắc bất dị không')
    expect(heart.lineIndex).toBe(2)
  })
  it('mọi từ khoá phải cùng xuất hiện', () => {
    expect(searchSutras(SUTRAS, 'tam kinh xyzzy', getSutra)).toEqual([])
  })
  it('ưu tiên khớp tiêu đề lên trước khớp nội dung', () => {
    const results = searchSutras(SUTRAS, 'hoi huong', getSutra)
    expect(results[0].sutra.id).toBe('ke-hoi-huong')
    expect(results[0].snippet).toBeNull()
  })
  it('searchIndex dùng lại được chỉ mục dựng sẵn', () => {
    const index = buildIndex(SUTRAS, getSutra)
    expect(searchIndex(index, 'an ma ni')[0].sutra.id).toBe('luc-tu-dai-minh')
  })
})
