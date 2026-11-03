import { describe, expect, it } from 'vitest'
import { INITIAL_QUIZ, gradeQuiz, keyToOptionIndex, quizReducer, scoreMessage } from './quiz-engine'

const QUIZ = [
  { q: 'Câu 1', options: ['a', 'b', 'c', 'd'], answer: 1 },
  { q: 'Câu 2', options: ['a', 'b', 'c', 'd'], answer: 3 },
]

describe('gradeQuiz', () => {
  it('đếm số câu đúng và tính điểm 0..1', () => {
    expect(gradeQuiz(QUIZ, [1, 3])).toEqual({ correct: 2, total: 2, score: 1 })
    expect(gradeQuiz(QUIZ, [1, 0])).toEqual({ correct: 1, total: 2, score: 0.5 })
    expect(gradeQuiz(QUIZ, [])).toEqual({ correct: 0, total: 2, score: 0 })
  })

  it('bộ câu hỏi rỗng cho điểm 0, không chia cho 0', () => {
    expect(gradeQuiz([], [])).toEqual({ correct: 0, total: 0, score: 0 })
  })
})

describe('quizReducer', () => {
  it('chọn đáp án thì lộ kết quả, không cho chọn lại', () => {
    let s = quizReducer(INITIAL_QUIZ, { type: 'select', choice: 2, total: 2 })
    expect(s).toMatchObject({ index: 0, answers: [2], revealed: true })
    const again = quizReducer(s, { type: 'select', choice: 1, total: 2 })
    expect(again).toBe(s)
  })

  it('không cho sang câu khi chưa chọn', () => {
    expect(quizReducer(INITIAL_QUIZ, { type: 'next', total: 2 })).toBe(INITIAL_QUIZ)
  })

  it('đi hết các câu rồi kết thúc, sau đó làm lại từ đầu', () => {
    let s = quizReducer(INITIAL_QUIZ, { type: 'select', choice: 1, total: 2 })
    s = quizReducer(s, { type: 'next', total: 2 })
    expect(s).toMatchObject({ index: 1, revealed: false, done: false })
    s = quizReducer(s, { type: 'select', choice: 3, total: 2 })
    s = quizReducer(s, { type: 'next', total: 2 })
    expect(s.done).toBe(true)
    expect(s.answers).toEqual([1, 3])
    expect(quizReducer(s, { type: 'restart' })).toEqual(INITIAL_QUIZ)
  })

  it('bỏ qua lựa chọn không hợp lệ và action lạ', () => {
    expect(quizReducer(INITIAL_QUIZ, { type: 'select', choice: -1, total: 2 })).toBe(INITIAL_QUIZ)
    expect(quizReducer(INITIAL_QUIZ, { type: 'select', choice: 1.5, total: 2 })).toBe(INITIAL_QUIZ)
    expect(quizReducer(INITIAL_QUIZ, { type: 'khac' })).toBe(INITIAL_QUIZ)
  })

  it('không làm thay đổi state cũ (bất biến)', () => {
    const before = { ...INITIAL_QUIZ, answers: [] }
    quizReducer(before, { type: 'select', choice: 0, total: 2 })
    expect(before.answers).toEqual([])
  })
})

describe('keyToOptionIndex', () => {
  it('ánh xạ phím 1–4 sang chỉ số 0–3', () => {
    expect(keyToOptionIndex('1')).toBe(0)
    expect(keyToOptionIndex('4')).toBe(3)
  })

  it('trả về -1 với phím khác hoặc vượt số phương án', () => {
    expect(keyToOptionIndex('5')).toBe(-1)
    expect(keyToOptionIndex('0')).toBe(-1)
    expect(keyToOptionIndex('a')).toBe(-1)
    expect(keyToOptionIndex('Enter')).toBe(-1)
    expect(keyToOptionIndex('3', 2)).toBe(-1)
    expect(keyToOptionIndex(undefined)).toBe(-1)
  })
})

describe('scoreMessage', () => {
  it('có lời nhận xét cho mọi mức điểm', () => {
    for (const s of [0, 0.4, 0.6, 0.8, 1]) {
      const m = scoreMessage(s)
      expect(m.title).toBeTruthy()
      expect(m.text).toBeTruthy()
    }
    expect(scoreMessage(1).title).not.toBe(scoreMessage(0).title)
  })
})
