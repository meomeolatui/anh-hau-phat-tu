import { describe, expect, it } from 'vitest'
import { GRAVITY, JUMP_SPEED, LAND_TIME, canJump, createJump, jumpPhase, startJump, stepJump } from './jump'
import { poseFor } from './avatarRig'

describe('nhảy (Space)', () => {
  it('bật lên rồi rơi về đúng mặt đất, báo tiếp đất đúng một lần', () => {
    const j = createJump()
    startJump(j)
    let peak = 0
    let landed = 0
    let time = 0
    for (let i = 0; i < 120; i++) {
      if (stepJump(j, 1 / 60)) landed++
      peak = Math.max(peak, j.h)
      if (j.airborne) time += 1 / 60
    }
    expect(peak).toBeCloseTo((JUMP_SPEED * JUMP_SPEED) / (2 * GRAVITY), 1)
    expect(time).toBeGreaterThan(0.5)
    expect(time).toBeLessThan(0.8)
    expect(landed).toBe(1)
    expect(j.h).toBe(0)
    expect(j.airborne).toBe(false)
  })

  it('không nhảy khi đang bay, đang làm hoạt động, ngồi cáp treo hay kiệt sức', () => {
    const j = createJump()
    expect(canJump(j, { stamina: { value: 50, exhausted: false } })).toBe(true)
    expect(canJump(j, { locked: true })).toBe(false)
    expect(canJump(j, { riding: true })).toBe(false)
    expect(canJump(j, { stamina: { value: 50, exhausted: true } })).toBe(false)
    expect(canJump(j, { stamina: { value: 1, exhausted: false } })).toBe(false)
    startJump(j)
    expect(canJump(j, {})).toBe(false)
  })

  it('tiếp đất thì nhún gối một nhịp ngắn', () => {
    const j = createJump()
    startJump(j)
    while (!stepJump(j, 1 / 60));
    expect(j.land).toBeCloseTo(LAND_TIME)
    stepJump(j, LAND_TIME + 0.01)
    expect(j.land).toBe(0)
  })

  it('động tác: bật lên co chân, rơi xuống duỗi chân đón đất, tiếp đất khuỵu gối', () => {
    const j = createJump()
    startJump(j)
    expect(jumpPhase(j)).toBeCloseTo(-1)
    const rising = poseFor('jump', 0, 0, 0, 0, -0.8)
    const falling = poseFor('jump', 0, 0, 0, 0, 0.9)
    expect(rising.kneeL).toBeGreaterThan(falling.kneeL)
    expect(rising.armL).toBeGreaterThan(0.5) // vung tay lấy đà
    const land = poseFor('land', 0)
    expect(land.rootY).toBeLessThan(-0.08)
    expect(land.kneeL).toBeGreaterThan(0.5)
    for (const pose of [rising, falling, land]) for (const v of Object.values(pose)) expect(Number.isFinite(v)).toBe(true)
  })
})
