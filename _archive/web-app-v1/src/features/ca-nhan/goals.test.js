import { describe, expect, it } from 'vitest'
import { GOAL_PRESETS, goalsToDraft, matchPreset, parseGoal, validateGoals } from './goals'

describe('parseGoal', () => {
  it('nhận số nguyên hợp lệ', () => {
    expect(parseGoal('niem', '1080')).toEqual({ value: 1080, error: null })
  })

  it('chấp nhận dấu chấm phân cách hàng nghìn', () => {
    expect(parseGoal('niem', '3.000').value).toBe(3000)
    expect(parseGoal('niem', ' 10 000 ').value).toBe(10000)
  })

  it('báo lỗi khi bỏ trống', () => {
    expect(parseGoal('thienMin', '').error).toMatch(/Hãy nhập/)
  })

  it('báo lỗi khi không phải số nguyên', () => {
    expect(parseGoal('thienMin', '1,5').error).toMatch(/số nguyên/)
    expect(parseGoal('thienMin', 'abc').value).toBeNull()
  })

  it('báo lỗi khi ngoài khoảng', () => {
    expect(parseGoal('thienMin', '0').error).toMatch(/khoảng/)
    expect(parseGoal('thienMin', '481').error).toMatch(/480/)
    expect(parseGoal('thienHanh', '21').value).toBeNull()
  })

  it('mục tiêu không xác định', () => {
    expect(parseGoal('xyz', '1').error).toBeTruthy()
  })
})

describe('validateGoals', () => {
  it('trả về goals khi tất cả hợp lệ', () => {
    expect(validateGoals({ niem: '108', thienMin: '5', thienHanh: '1' })).toEqual({
      goals: { niem: 108, thienMin: 5, thienHanh: 1 },
      errors: {},
    })
  })

  it('goals = null và liệt kê lỗi khi có ô sai', () => {
    const r = validateGoals({ niem: '', thienMin: '5', thienHanh: '99' })
    expect(r.goals).toBeNull()
    expect(Object.keys(r.errors)).toEqual(['niem', 'thienHanh'])
  })
})

describe('matchPreset & goalsToDraft', () => {
  it('nhận ra mức gợi ý', () => {
    expect(matchPreset({ niem: 1080, thienMin: 15, thienHanh: 1 })).toBe('deu-dan')
    expect(matchPreset({ niem: 500, thienMin: 15, thienHanh: 1 })).toBe('custom')
    expect(matchPreset(undefined)).toBe('custom')
  })

  it('các mức gợi ý đúng như đặc tả', () => {
    expect(GOAL_PRESETS.map((p) => [p.goals.niem, p.goals.thienMin])).toEqual([
      [108, 5],
      [1080, 15],
      [3000, 30],
    ])
  })

  it('đổi số thành chuỗi cho ô nhập', () => {
    expect(goalsToDraft({ niem: 108, thienMin: 5, thienHanh: 1 })).toEqual({ niem: '108', thienMin: '5', thienHanh: '1' })
  })
})
