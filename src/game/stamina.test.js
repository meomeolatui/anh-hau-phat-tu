import { describe, expect, it } from 'vitest'
import { IDLE_DELAY, RATES, RECOVER_AT, TIRED_BELOW, canRun, showTired, speedFactor, stepStamina, tiredness } from './stamina'

const base = { value: 50, exhausted: false, idleFor: 0 }
const act = (patch = {}) => ({ moving: false, running: false, climbing: false, sitting: false, resting: false, ...patch })

describe('thể lực', () => {
  it('tiêu hao chậm: chạy liên tục hơn 20 giây mới cạn sức', () => {
    let s = { value: 100, exhausted: false, idleFor: 0 }
    for (let i = 0; i < 20; i++) s = stepStamina(s, act({ moving: true, running: true }), 1)
    expect(s.value).toBeGreaterThan(0)
  })

  it('chạy làm tụt thể lực', () => {
    const s = stepStamina(base, act({ moving: true, running: true }), 1)
    expect(s.value).toBeCloseTo(50 - RATES.run)
  })

  it('leo dốc tốn sức nhẹ, chạy lên dốc tốn nhiều hơn', () => {
    expect(stepStamina(base, act({ moving: true, climbing: true }), 1).value).toBeCloseTo(50 - RATES.climb)
    expect(stepStamina(base, act({ moving: true, climbing: true, running: true }), 1).value).toBeCloseTo(50 - RATES.climb - RATES.run)
  })

  it('đứng yên phải chờ một chút rồi mới hồi chậm', () => {
    const early = stepStamina(base, act(), IDLE_DELAY / 2)
    expect(early.value).toBe(50)
    const later = stepStamina({ ...early, idleFor: IDLE_DELAY }, act(), 1)
    expect(later.value).toBeCloseTo(50 + RATES.idle)
  })

  it('ngồi ghế hồi nhanh hơn ngồi làm nghi thức, nhanh hơn đứng yên', () => {
    const still = { ...base, idleFor: 5 }
    const idle = stepStamina(still, act(), 1).value
    const sit = stepStamina(still, act({ sitting: true }), 1).value
    const rest = stepStamina(still, act({ resting: true }), 1).value
    expect(rest).toBeGreaterThan(sit)
    expect(sit).toBeGreaterThan(idle)
  })

  it('kiệt sức khi về 0, chỉ chạy lại được khi hồi đủ ngưỡng', () => {
    let s = stepStamina({ ...base, value: 3 }, act({ moving: true, running: true }), 1)
    expect(s.value).toBe(0)
    expect(s.exhausted).toBe(true)
    expect(s.becameExhausted).toBe(true)
    expect(canRun(s)).toBe(false)
    expect(speedFactor(s)).toBeLessThan(1)
    s = stepStamina({ ...s, value: RECOVER_AT - 1 }, act({ resting: true }), 0.01)
    expect(s.exhausted).toBe(true)
    s = stepStamina(s, act({ resting: true }), 1)
    expect(s.exhausted).toBe(false)
    expect(canRun(s)).toBe(true)
  })

  it('đứng yên khi thể lực dưới ngưỡng thì hiện dáng thở dốc, càng cạn càng mệt', () => {
    expect(showTired({ value: TIRED_BELOW - 1 }, true)).toBe(true)
    expect(showTired({ value: TIRED_BELOW - 1 }, false)).toBe(false)
    expect(showTired({ value: TIRED_BELOW + 1 }, true)).toBe(false)
    expect(tiredness({ value: 0 })).toBe(1)
    expect(tiredness({ value: 20 })).toBeCloseTo(0.5)
  })

  it('không vượt quá 100', () => {
    expect(stepStamina({ ...base, value: 99 }, act({ resting: true }), 5).value).toBe(100)
  })
})
