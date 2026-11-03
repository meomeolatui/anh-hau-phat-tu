import { describe, expect, it } from 'vitest'
import {
  activeSectionIndex,
  adjacentLessons,
  bestScore,
  filterByLevel,
  formatPercent,
  lessonStatus,
  nextLesson,
  overallProgress,
  progressByLevel,
  readingProgress,
  stepFontSize,
  FONT_MAX,
  FONT_MIN,
} from './learning'

const LEVELS = [
  { id: 'nhap-mon', label: 'Nhập môn' },
  { id: 'can-ban', label: 'Căn bản' },
  { id: 'nang-cao', label: 'Nâng cao' },
]
const LESSONS = [
  { id: 'a', level: 'nhap-mon', minutes: 5 },
  { id: 'b', level: 'nhap-mon', minutes: 6 },
  { id: 'c', level: 'can-ban', minutes: 7 },
  { id: 'd', level: 'nang-cao', minutes: 8 },
]
const at = '2026-11-02T00:00:00.000Z'

describe('bestScore & lessonStatus', () => {
  it('trả về null và "new" khi chưa làm bài', () => {
    expect(bestScore({}, 'a')).toBeNull()
    expect(lessonStatus({}, 'a')).toBe('new')
    expect(lessonStatus(undefined, 'a')).toBe('new')
  })

  it('phân biệt đã học và thuần thục theo mốc 80%', () => {
    expect(lessonStatus({ a: { score: 0.6, at } }, 'a')).toBe('done')
    expect(lessonStatus({ a: { score: 0.8, at } }, 'a')).toBe('mastered')
  })

  it('bỏ qua dữ liệu hỏng và giới hạn điểm trong 0..1', () => {
    expect(bestScore({ a: { score: 'x' } }, 'a')).toBeNull()
    expect(bestScore({ a: { score: 1.4 } }, 'a')).toBe(1)
  })
})

describe('formatPercent', () => {
  it('làm tròn thành phần trăm', () => {
    expect(formatPercent(0.8)).toBe('80%')
    expect(formatPercent(2 / 3)).toBe('67%')
    expect(formatPercent(NaN)).toBe('0%')
  })
})

describe('overallProgress', () => {
  it('khi chưa học bài nào: điểm trung bình null, còn đủ số phút', () => {
    const p = overallProgress(LESSONS, {})
    expect(p).toMatchObject({ total: 4, done: 0, mastered: 0, ratio: 0, avgScore: null, minutesLeft: 26 })
  })

  it('tính trung bình trên các bài đã làm', () => {
    const p = overallProgress(LESSONS, { a: { score: 1, at }, c: { score: 0.6, at } })
    expect(p.done).toBe(2)
    expect(p.mastered).toBe(1)
    expect(p.ratio).toBe(0.5)
    expect(p.avgScore).toBeCloseTo(0.8)
    expect(p.minutesLeft).toBe(14)
  })

  it('không chia cho 0 khi danh sách rỗng', () => {
    expect(overallProgress([], {}).ratio).toBe(0)
  })
})

describe('progressByLevel', () => {
  it('giữ thứ tự cấp độ và đếm đúng', () => {
    const p = progressByLevel(LESSONS, { b: { score: 0.4, at } }, LEVELS)
    expect(p.map((x) => x.level)).toEqual(['nhap-mon', 'can-ban', 'nang-cao'])
    expect(p[0]).toEqual({ level: 'nhap-mon', total: 2, done: 1, ratio: 0.5 })
    expect(p[2].ratio).toBe(0)
  })

  it('cấp độ không có bài nào có tỉ lệ 0', () => {
    expect(progressByLevel([], {}, LEVELS)[0]).toEqual({ level: 'nhap-mon', total: 0, done: 0, ratio: 0 })
  })
})

describe('nextLesson', () => {
  it('gợi ý bài đầu tiên khi mới bắt đầu', () => {
    expect(nextLesson(LESSONS, {})).toEqual({ lesson: LESSONS[0], reason: 'start' })
  })

  it('gợi ý bài chưa học đầu tiên theo thứ tự lộ trình, kể cả khi học nhảy cóc', () => {
    const r = nextLesson(LESSONS, { a: { score: 1, at }, c: { score: 1, at } })
    expect(r).toEqual({ lesson: LESSONS[1], reason: 'continue' })
  })

  it('học hết rồi thì gợi ý ôn bài điểm thấp nhất chưa thuần thục', () => {
    const completed = { a: { score: 1, at }, b: { score: 0.6, at }, c: { score: 0.4, at }, d: { score: 0.8, at } }
    expect(nextLesson(LESSONS, completed)).toEqual({ lesson: LESSONS[2], reason: 'review' })
  })

  it('trả về null khi mọi bài đều thuần thục hoặc không có bài', () => {
    const all = Object.fromEntries(LESSONS.map((l) => [l.id, { score: 0.9, at }]))
    expect(nextLesson(LESSONS, all)).toBeNull()
    expect(nextLesson([], {})).toBeNull()
  })
})

describe('adjacentLessons & filterByLevel', () => {
  it('trả về bài trước/sau, null ở hai đầu', () => {
    expect(adjacentLessons(LESSONS, 'a')).toEqual({ prev: null, next: LESSONS[1], index: 0 })
    expect(adjacentLessons(LESSONS, 'd')).toEqual({ prev: LESSONS[2], next: null, index: 3 })
    expect(adjacentLessons(LESSONS, 'zzz')).toEqual({ prev: null, next: null, index: -1 })
  })

  it('lọc theo cấp độ, "all" giữ nguyên', () => {
    expect(filterByLevel(LESSONS, 'all')).toBe(LESSONS)
    expect(filterByLevel(LESSONS, 'can-ban').map((l) => l.id)).toEqual(['c'])
  })
})

describe('readingProgress & activeSectionIndex', () => {
  it('0 khi chưa cuộn tới bài, 1 khi đã đọc hết, tỉ lệ ở giữa', () => {
    expect(readingProgress({ top: 200, height: 2000, viewport: 800 })).toBe(0)
    expect(readingProgress({ top: -600, height: 2000, viewport: 800 })).toBe(0.5)
    expect(readingProgress({ top: -5000, height: 2000, viewport: 800 })).toBe(1)
  })

  it('bài ngắn hơn màn hình: coi như đọc xong khi đỉnh bài đã chạm mép trên', () => {
    expect(readingProgress({ top: 0, height: 300, viewport: 800 })).toBe(1)
    expect(readingProgress({ top: 100, height: 300, viewport: 800 })).toBe(0)
  })

  it('chọn mục cuối cùng đã vượt mốc', () => {
    expect(activeSectionIndex([300, 900, 1500], 120)).toBe(0)
    expect(activeSectionIndex([-500, 50, 700], 120)).toBe(1)
    expect(activeSectionIndex([-900, -400, -10], 120)).toBe(2)
  })
})

describe('stepFontSize', () => {
  it('tăng giảm theo bước 2 và giữ trong giới hạn', () => {
    expect(stepFontSize(20, 1)).toBe(22)
    expect(stepFontSize(20, -1)).toBe(18)
    expect(stepFontSize(FONT_MAX, 1)).toBe(FONT_MAX)
    expect(stepFontSize(FONT_MIN, -1)).toBe(FONT_MIN)
    expect(stepFontSize(undefined, 0)).toBe(20)
    expect(stepFontSize(40, 0)).toBe(FONT_MAX)
  })
})
