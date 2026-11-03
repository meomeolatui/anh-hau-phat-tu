import { describe, expect, it } from 'vitest'
import { REST, RIG, applyCarry, handPosition, poseFor } from './avatarRig'

const ANIMS = ['idle', 'walk', 'run', 'pray', 'incense', 'bow', 'kneel', 'sit', 'seated', 'sweep', 'bell', 'bell-pull', 'bell-strike', 'wave', 'tired']

describe('khung xương nhân vật', () => {
  it.each(ANIMS)('tư thế %s đủ khớp, mọi giá trị là số hữu hạn', (anim) => {
    for (const t of [0, 0.37, 1.2, 2.9]) {
      const p = poseFor(anim, t, 3, 0.7)
      for (const key of Object.keys(REST)) expect(Number.isFinite(p[key]), `${anim}.${key}`).toBe(true)
    }
  })

  it('chắp tay: hai bàn tay ở trước ngực, không đâm vào thân', () => {
    const p = poseFor('pray', 0)
    const h = handPosition(p.armL, p.elbowL)
    expect(h.z).toBeGreaterThan(0.22) // ra trước mặt ngực (thân dày ~0.22)
    expect(h.y).toBeGreaterThan(0.25)
    expect(h.y).toBeLessThan(0.6)
  })

  it('thắp hương: tay nâng cao ngang mặt', () => {
    const p = poseFor('incense', 0)
    expect(handPosition(p.armL, p.elbowL).y).toBeGreaterThan(handPosition(PRAYED().armL, PRAYED().elbowL).y)
  })

  it('quỳ: gối gập vuông, hông hạ đúng chiều dài cẳng chân', () => {
    const p = poseFor('kneel', 0)
    expect(p.kneeL).toBeCloseTo(Math.PI / 2, 1)
    expect(RIG.hipY + p.rootY).toBeCloseTo(RIG.thigh + 0.08, 1)
  })

  it('lạy: giữa chu kỳ cúi rạp, đầu và chu kỳ đứng thẳng', () => {
    expect(poseFor('bow', 1.5).torsoPitch).toBeGreaterThan(1)
    expect(poseFor('bow', 0).torsoPitch).toBeLessThan(0.1)
  })

  it('thở dốc: gập ở hông rõ rệt và nhịp nhanh hơn khi mệt hơn', () => {
    const p = poseFor('tired', 0.2, 0, 0.5)
    expect(p.torsoPitch).toBeGreaterThan(0.5)
    expect(p.headPitch).toBeLessThan(0)
    // Đếm số lần đổi chiều trong 2 giây: mệt hơn → nhiều hơn
    const flips = (tired) => {
      let n = 0
      let prev = poseFor('tired', 0, 0, tired).rootY
      let dir = 0
      for (let t = 0.02; t < 2; t += 0.02) {
        const v = poseFor('tired', t, 0, tired).rootY
        const d = Math.sign(v - prev)
        if (d && d !== dir) {
          n++
          dir = d
        }
        prev = v
      }
      return n
    }
    expect(flips(1)).toBeGreaterThan(flips(0))
  })

  it('ngồi ghế: hông cao ngang mặt ghế (~0.42 m), đùi nằm ngang, cẳng chân thẳng đứng chạm đất', () => {
    const p = poseFor('seated', 0)
    const hip = RIG.hipY + p.rootY
    expect(hip).toBeGreaterThan(0.38)
    expect(hip).toBeLessThan(0.48)
    // Bàn chân: đùi ngang (góc ~π/2), gối gập ~π/2 → cẳng chân thẳng xuống; mặt đất ≈ hông − cẳng chân
    expect(p.thighL).toBeCloseTo(Math.PI / 2, 0)
    expect(hip - RIG.shin).toBeGreaterThan(0.05)
    expect(hip - RIG.shin).toBeLessThan(0.16)
  })

  it('thỉnh chuông: lấy đà thì ngả ra sau (theo lực kéo), đánh thì nhoài tới rồi thu về', () => {
    expect(poseFor('bell-pull', 0, 0, 0.5, 1).torsoPitch).toBeLessThan(-0.2)
    expect(poseFor('bell-pull', 0, 0, 0.5, 0).torsoPitch).toBeCloseTo(0)
    const hit = poseFor('bell-strike', 0.2)
    expect(hit.torsoPitch).toBeGreaterThan(0.25)
    expect(hit.elbowL).toBeLessThan(0.2) // tay duỗi thẳng đẩy chày
    expect(poseFor('bell-strike', 1.4).torsoPitch).toBeCloseTo(0, 1)
    // Tay nâng cao nắm dây (cao hơn vai)
    const ready = poseFor('bell', 0)
    expect(handPosition(ready.armL, ready.elbowL).y).toBeGreaterThan(RIG.shoulderY)
  })

  it('bưng khay: cẳng tay gần nằm ngang phía trước', () => {
    const p = applyCarry(REST)
    const elbowY = RIG.shoulderY - Math.cos(p.armL) * RIG.upperArm
    const h = handPosition(p.armL, p.elbowL)
    expect(Math.abs(h.y - elbowY)).toBeLessThan(0.12)
    expect(h.z).toBeGreaterThan(0.3)
  })
})

function PRAYED() {
  return poseFor('pray', 0)
}
