import { describe, expect, it } from 'vitest'
import { LESSONS, LEVELS, getLesson, getLevel } from './lessons'
import { hasLessonIcon } from '../features/hoc-phat/lesson-icons'

const LEVEL_IDS = LEVELS.map((l) => l.id)

describe('dữ liệu bài học', () => {
  it('có khoảng 10 bài, id duy nhất và đúng định dạng slug', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(10)
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('mỗi cấp độ có ít nhất một bài và bài nào cũng thuộc cấp độ hợp lệ', () => {
    for (const l of LESSONS) expect(LEVEL_IDS).toContain(l.level)
    for (const id of LEVEL_IDS) expect(LESSONS.some((l) => l.level === id)).toBe(true)
  })

  it('lộ trình đi từ dễ đến khó (cấp độ không giảm theo thứ tự)', () => {
    const ranks = LESSONS.map((l) => LEVEL_IDS.indexOf(l.level))
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })

  it.each(LESSONS.map((l) => [l.id, l]))('bài %s có đủ nội dung', (_id, l) => {
    expect(l.title.trim()).not.toBe('')
    expect(l.subtitle.trim()).not.toBe('')
    expect(l.minutes).toBeGreaterThan(0)
    expect(hasLessonIcon(l.icon)).toBe(true)
    expect(l.sections.length).toBeGreaterThanOrEqual(3)
    const headings = l.sections.map((s) => s.heading)
    expect(new Set(headings).size).toBe(headings.length)
    for (const s of l.sections) {
      expect(s.heading.trim()).not.toBe('')
      expect(Array.isArray(s.paragraphs)).toBe(true)
      expect(s.paragraphs.length + (s.list?.length ?? 0)).toBeGreaterThan(0)
    }
    expect(l.keyPoints.length).toBeGreaterThanOrEqual(3)
  })

  it.each(LESSONS.map((l) => [l.id, l]))('trắc nghiệm bài %s hợp lệ: 4–6 câu, 4 phương án, đáp án đúng chỉ số', (_id, l) => {
    expect(l.quiz.length).toBeGreaterThanOrEqual(4)
    expect(l.quiz.length).toBeLessThanOrEqual(6)
    for (const item of l.quiz) {
      expect(item.q.trim()).not.toBe('')
      expect(item.options).toHaveLength(4)
      expect(new Set(item.options).size).toBe(4)
      for (const o of item.options) expect(o.trim()).not.toBe('')
      expect(Number.isInteger(item.answer)).toBe(true)
      expect(item.answer).toBeGreaterThanOrEqual(0)
      expect(item.answer).toBeLessThan(4)
      expect(item.explain.trim()).not.toBe('')
    }
  })

  it('đáp án đúng được phân bố ở nhiều vị trí, tránh đoán mò theo thói quen', () => {
    const positions = new Set(LESSONS.flatMap((l) => l.quiz.map((q) => q.answer)))
    expect(positions.size).toBe(4)
  })

  it('tra cứu theo id', () => {
    expect(getLesson('tu-dieu-de')?.title).toBe('Tứ Diệu Đế')
    expect(getLesson('khong-co')).toBeNull()
    expect(getLevel('nang-cao')?.label).toBe('Nâng cao')
    expect(getLevel('x')).toBeNull()
  })
})
