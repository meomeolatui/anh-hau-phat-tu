import { describe, expect, it } from 'vitest'
import { IDLE_DELAY, IDLE_SCRIPTS, idleActionFor, idleSegmentAt, scriptLength, stepIdle } from './idleActions'
import { poseFor } from './avatarRig'

const run = (st, still, costume, seconds, dt = 1 / 30) => {
  let last = null
  let turned = 0
  const anims = new Set()
  for (let t = 0; t < seconds; t += dt) {
    last = stepIdle(st, still, costume, dt)
    if (last) {
      anims.add(last.anim)
      turned += last.turnRate * dt
    }
  }
  return { last, turned, anims }
}

describe('động tác khi đứng yên theo bộ đồ', () => {
  it('chọn đúng động tác cho từng bộ', () => {
    for (const id of ['te-thien', 'bat-gioi', 'sa-tang']) expect(idleActionFor(id)).toBe('mua-gay')
    for (const id of ['ca-sa-vang', 'ca-sa-do', 'ca-sa-gam']) expect(idleActionFor(id)).toBe('lay-bon-phuong')
    expect(idleActionFor('than-tai')).toBe('chuc-phuc')
    expect(idleActionFor(null)).toBe('ngam-canh')
  })

  it('chỉ bắt đầu sau khi đứng yên đủ lâu', () => {
    const st = { wait: 0, kind: null, t: 0 }
    expect(run(st, true, 'te-thien', IDLE_DELAY - 0.2).last).toBeNull()
    expect(run(st, true, 'te-thien', 0.5).last.anim).toBe('twirl')
  })

  it('lạy bốn phương: nhìn quanh, lạy 4 lần, xoay đủ một vòng về hướng cũ', () => {
    const st = { wait: 0, kind: null, t: 0 }
    const r = run(st, true, 'ca-sa-nau', IDLE_DELAY + scriptLength('lay-bon-phuong') - 0.05)
    expect(r.anims).toEqual(new Set(['look', 'bow', 'idle']))
    expect(IDLE_SCRIPTS['lay-bon-phuong'].filter((s) => s.anim === 'bow')).toHaveLength(4)
    expect(r.turned).toBeCloseTo(Math.PI * 2, 1)
  })

  it('bấm di chuyển là huỷ ngay, phải chờ lại từ đầu', () => {
    const st = { wait: 0, kind: null, t: 0 }
    run(st, true, 'te-thien', IDLE_DELAY + 1)
    expect(stepIdle(st, false, 'te-thien', 1 / 30)).toBeNull()
    expect(st.kind).toBeNull()
    expect(run(st, true, 'te-thien', 1).last).toBeNull()
  })

  it('xong một lượt thì nghỉ rồi mới lặp lại', () => {
    const st = { wait: 0, kind: null, t: 0 }
    run(st, true, 'than-tai', IDLE_DELAY + scriptLength('chuc-phuc') + 0.1)
    expect(st.kind).toBeNull()
    expect(idleSegmentAt('chuc-phuc', scriptLength('chuc-phuc') + 0.01)).toBeNull()
  })

  it('tư thế mới hợp lệ: ngắm cảnh quay đầu, vái cúi người, múa gậy giơ tay phải', () => {
    expect(Math.abs(poseFor('look', 1.8).headYaw)).toBeGreaterThan(0.3)
    expect(poseFor('vai', 0.75).torsoPitch).toBeGreaterThan(0.4)
    expect(poseFor('twirl', 1).armR).toBeGreaterThan(1.2)
    for (const a of ['look', 'vai', 'twirl']) for (const v of Object.values(poseFor(a, 2.3))) expect(Number.isFinite(v)).toBe(true)
  })
})
