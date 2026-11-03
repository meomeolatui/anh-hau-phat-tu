import { describe, expect, it } from 'vitest'
import { avoidOrphan, fitText, tokenize, wrapText } from './wrap-text'

// Mỗi ký tự rộng 10px — đủ để kiểm tra logic mà không cần canvas thật
const measure = (t) => [...t].length * 10

describe('tokenize', () => {
  it('tách theo khoảng trắng và dính dấu gạch ngang vào tiếng trước', () => {
    expect(tokenize('giữ tâm  trong sạch — đó là')).toEqual(['giữ', 'tâm', 'trong', 'sạch —', 'đó', 'là'])
  })

  it('dấu gạch ở đầu chuỗi vẫn giữ nguyên', () => {
    expect(tokenize('— Kinh Pháp Cú')).toEqual(['—', 'Kinh', 'Pháp', 'Cú'])
  })
})

describe('wrapText', () => {
  it('không dòng nào vượt quá độ rộng và không mất chữ', () => {
    const text = 'Hận thù không thể dập tắt hận thù; chỉ có lòng từ mới dập tắt được hận thù.'
    const lines = wrapText(text, 160, measure)
    for (const l of lines) expect(measure(l)).toBeLessThanOrEqual(160)
    expect(lines.join(' ')).toBe(text)
  })

  it('giữ nguyên chữ có dấu tiếng Việt, không cắt giữa một tiếng', () => {
    const lines = wrapText('Nhẫn nhục là hạnh tu cao nhất', 100, measure)
    expect(lines.join(' ').split(' ')).toEqual(['Nhẫn', 'nhục', 'là', 'hạnh', 'tu', 'cao', 'nhất'])
  })

  it('không bao giờ mở đầu dòng bằng dấu gạch ngang', () => {
    const lines = wrapText('một hai ba bốn — năm sáu bảy tám chín mười', 100, measure)
    for (const l of lines) expect(l.startsWith('—')).toBe(false)
  })

  it('bẻ từ quá dài thành nhiều mảnh', () => {
    expect(wrapText('abcdefghijklmnop', 50, measure)).toEqual(['abcde', 'fghij', 'klmno', 'p'])
  })

  it('giữ xuống dòng có sẵn và xử lý chuỗi rỗng', () => {
    expect(wrapText('một\nhai', 500, measure)).toEqual(['một', 'hai'])
    expect(wrapText('', 100, measure)).toEqual([''])
  })

  it('tránh dòng cuối mồ côi một tiếng', () => {
    // "aa bb cc dd" vừa 110px, "ee" sẽ mồ côi nếu không xử lý
    expect(wrapText('aa bb cc dd ee', 110, measure)).toEqual(['aa bb cc', 'dd ee'])
  })
})

describe('avoidOrphan', () => {
  it('không đổi khi dòng trên quá ngắn', () => {
    expect(avoidOrphan(['aa bb', 'cc'], 100, measure)).toEqual(['aa bb', 'cc'])
  })

  it('không kéo xuống nếu dòng cuối mới bị tràn', () => {
    expect(avoidOrphan(['aa bb cccccc', 'dddddd'], 120, measure)).toEqual(['aa bb cccccc', 'dddddd'])
  })
})

describe('fitText', () => {
  const measureAt = (size) => (t) => [...t].length * size * 0.5
  const text = 'một hai ba bốn năm sáu bảy tám'

  it('chọn cỡ chữ lớn nhất vừa chiều cao', () => {
    const opts = { maxWidth: 200, maxHeight: 120, minSize: 10, maxSize: 60, lineHeight: 1.5, measureAt }
    const r = fitText(text, opts)
    expect(r.fits).toBe(true)
    expect(r.height).toBeLessThanOrEqual(120)
    const bigger = fitText(text, { ...opts, minSize: r.size + 2, maxSize: r.size + 2 })
    expect(bigger.fits).toBe(false)
  })

  it('trả về cỡ nhỏ nhất (fits = false) nếu không thể vừa', () => {
    const r = fitText('rất nhiều chữ '.repeat(40), { maxWidth: 100, maxHeight: 20, minSize: 20, maxSize: 30, measureAt })
    expect(r.size).toBe(20)
    expect(r.fits).toBe(false)
  })
})
