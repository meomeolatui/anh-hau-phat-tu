import { describe, expect, it } from 'vitest'
import {
  clampFontSize,
  clampIndex,
  countLines,
  estimateSeconds,
  flattenSutra,
  getPace,
  isInProgress,
  lineSeconds,
  parseLineParam,
  progressOf,
  repeatCount,
  splitRepeat,
  syllableCount,
} from './reader'
import { getSutra } from '../../data/sutras'

const fake = {
  a: { id: 'a', title: 'Bài A', sections: [{ heading: 'A', lines: ['một hai', 'ba bốn'] }] },
  b: { id: 'b', title: 'Bài B', sections: [{ note: 'Ghi chú B', lines: ['năm'] }, { lines: ['sáu'] }] },
  loop: { id: 'loop', sections: [{ lines: ['x'] }, { ref: 'loop' }] },
  host: {
    id: 'host',
    sections: [{ heading: 'Mở đầu', note: 'Chỉ dẫn' }, { ref: 'a' }, { ref: 'b', heading: 'Tiêu đề riêng' }, { ref: 'khong-co' }],
  },
}
const resolve = (id) => fake[id]

describe('repeatCount', () => {
  it('đọc số lần lặp ở cuối dòng', () => {
    expect(repeatCount('Bồ đề tát bà ha. (3 lần)')).toBe(3)
    expect(repeatCount('Nam mô A Di Đà Phật. (10 Lần)')).toBe(10)
  })
  it('mặc định 1 khi không ghi hoặc ghi sai', () => {
    expect(repeatCount('Quy y Phật')).toBe(1)
    expect(repeatCount('(0 lần)')).toBe(1)
    expect(repeatCount(undefined)).toBe(1)
  })
})

describe('syllableCount', () => {
  it('đếm âm tiết, bỏ qua ghi chú trong ngoặc và dấu câu', () => {
    expect(syllableCount('Nguyện dĩ thử công đức,')).toBe(5)
    expect(syllableCount('Nam mô A Di Đà Phật. (3 lần)')).toBe(6)
    expect(syllableCount('  —  ')).toBe(0)
  })
})

describe('lineSeconds / estimateSeconds', () => {
  it('nhịp chậm lâu hơn nhịp nhanh', () => {
    const line = 'Quán Tự Tại Bồ Tát hành thâm Bát Nhã Ba La Mật Đa thời,'
    expect(lineSeconds(line, 'cham')).toBeGreaterThan(lineSeconds(line, 'vua'))
    expect(lineSeconds(line, 'vua')).toBeGreaterThan(lineSeconds(line, 'nhanh'))
  })
  it('nhân thời gian theo số lần lặp', () => {
    const once = lineSeconds('Án ma ni bát di hồng.', 'vua')
    expect(lineSeconds('Án ma ni bát di hồng. (7 lần)', 'vua')).toBeCloseTo(once * 7)
  })
  it('có thời gian tối thiểu cho dòng rỗng/ngắn', () => {
    expect(lineSeconds('', 'nhanh')).toBe(1.5)
    expect(lineSeconds('A', 'nhanh')).toBe(1.5)
  })
  it('nhịp không hợp lệ dùng mặc định "vừa"', () => {
    expect(getPace('khong-co').value).toBe('vua')
  })
  it('cộng dồn từ dòng chỉ định, nhận cả chuỗi lẫn object', () => {
    const lines = [{ text: 'một hai ba' }, 'bốn năm sáu']
    const all = estimateSeconds(lines, 'vua')
    expect(all).toBeCloseTo(lineSeconds('một hai ba') + lineSeconds('bốn năm sáu'))
    expect(estimateSeconds(lines, 'vua', 1)).toBeCloseTo(lineSeconds('bốn năm sáu'))
    expect(estimateSeconds([], 'vua')).toBe(0)
  })
})

describe('flattenSutra', () => {
  it('đánh chỉ số liên tục và mở rộng dẫn chiếu', () => {
    const { sections, lines } = flattenSutra(fake.host, resolve)
    expect(lines.map((l) => l.text)).toEqual(['một hai', 'ba bốn', 'năm', 'sáu'])
    expect(lines.map((l) => l.index)).toEqual([0, 1, 2, 3])
    // ref không tồn tại bị bỏ qua
    expect(sections).toHaveLength(3)
    expect(sections[0]).toMatchObject({ heading: 'Mở đầu', note: 'Chỉ dẫn', start: 0, end: 0, ref: null })
    expect(sections[1]).toMatchObject({ heading: 'Bài A', note: null, start: 0, end: 2 })
    expect(sections[1].ref).toEqual({ id: 'a', title: 'Bài A' })
    expect(sections[2]).toMatchObject({ heading: 'Tiêu đề riêng', note: 'Ghi chú B', start: 2, end: 4 })
    expect(lines[3].section).toBe(2)
  })
  it('không lặp vô hạn khi bài tự dẫn chiếu chính nó', () => {
    const { lines } = flattenSutra(fake.loop, resolve)
    expect(lines.map((l) => l.text)).toEqual(['x'])
  })
  it('trả về rỗng khi không có bài', () => {
    expect(flattenSutra(undefined)).toEqual({ sections: [], lines: [] })
  })
  it('nghi thức thật chèn đủ nội dung Tâm Kinh', () => {
    const ritual = getSutra('nghi-thuc-niem-phat')
    const heart = getSutra('bat-nha-tam-kinh')
    const { lines, sections } = flattenSutra(ritual, getSutra)
    const heartSection = sections.find((s) => s.ref?.id === 'bat-nha-tam-kinh')
    expect(heartSection.heading).toBe(heart.title)
    expect(heartSection.end - heartSection.start).toBe(heart.sections[0].lines.length)
    expect(lines[heartSection.start].text).toBe(heart.sections[0].lines[0])
    expect(countLines(ritual, getSutra)).toBe(lines.length)
  })
})

describe('cỡ chữ & chỉ số dòng', () => {
  it('giới hạn cỡ chữ và làm tròn theo bước', () => {
    expect(clampFontSize(10)).toBe(16)
    expect(clampFontSize(99)).toBe(34)
    expect(clampFontSize(21)).toBe(22)
    expect(clampFontSize('abc')).toBe(20)
  })
  it('clampIndex đưa chỉ số về phạm vi hợp lệ', () => {
    expect(clampIndex(-3, 10)).toBe(0)
    expect(clampIndex(50, 10)).toBe(9)
    expect(clampIndex(1.5, 10)).toBe(0)
    expect(clampIndex(3, 0)).toBe(0)
  })
  it('isInProgress chỉ đúng khi đang ở giữa bài', () => {
    expect(isInProgress(0, 10)).toBe(false)
    expect(isInProgress(4, 10)).toBe(true)
    expect(isInProgress(9, 10)).toBe(false)
    expect(isInProgress(undefined, 10)).toBe(false)
  })
  it('progressOf tính cả dòng hiện tại', () => {
    expect(progressOf(0, 4)).toBe(0.25)
    expect(progressOf(3, 4)).toBe(1)
    expect(progressOf(0, 0)).toBe(0)
  })
  it('parseLineParam đọc số dòng đếm từ 1', () => {
    expect(parseLineParam('5', 10)).toBe(4)
    expect(parseLineParam('99', 10)).toBe(9)
    expect(parseLineParam('0', 10)).toBeNull()
    expect(parseLineParam('abc', 10)).toBeNull()
    expect(parseLineParam(null, 10)).toBeNull()
  })
})

describe('splitRepeat', () => {
  it('tách ghi chú lặp khỏi lời tụng', () => {
    expect(splitRepeat('Án ma ni bát di hồng. (7 lần)')).toEqual({ main: 'Án ma ni bát di hồng.', marker: '7 lần' })
    expect(splitRepeat('Quy y Phật.')).toEqual({ main: 'Quy y Phật.', marker: null })
  })
})
