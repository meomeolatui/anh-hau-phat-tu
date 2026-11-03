import { afterEach, describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { runtime } from '../runtime'
import { EYE_HEIGHT, firstPersonActive, firstPersonView, toggleFirstPerson } from './firstPerson'

describe('góc nhìn thứ nhất (phím C)', () => {
  afterEach(() => {
    runtime.camera.firstPerson = false
    runtime.camera.pitch = 0.38
  })

  it('mắt ở ngang đầu, nhìn đúng hướng yaw; pitch dương = cúi xuống', () => {
    const { eye, look } = firstPersonView(new Vector3(1, 10, 2), 0, 0)
    expect(eye[1]).toBeCloseTo(10 + EYE_HEIGHT)
    expect(look[2]).toBeGreaterThan(eye[2]) // yaw 0 → nhìn về +Z
    expect(look[1]).toBeCloseTo(eye[1])
    expect(firstPersonView(new Vector3(), 0, 0.8).look[1]).toBeLessThan(EYE_HEIGHT)
  })

  it('chỉ áp dụng khi không có hoạt động hay cảnh quay đặc biệt', () => {
    expect(firstPersonActive({ firstPerson: true, focus: null }, null)).toBe(true)
    expect(firstPersonActive({ firstPerson: true, focus: null }, { id: 'thinh-chuong' })).toBe(false)
    expect(firstPersonActive({ firstPerson: true, focus: { target: [0, 0, 0] } }, null)).toBe(false)
    expect(firstPersonActive({ firstPerson: false, focus: null }, null)).toBe(false)
  })

  it('bật rồi tắt trả lại góc ngẩng cũ của góc nhìn thứ ba', () => {
    runtime.camera.pitch = 0.6
    expect(toggleFirstPerson()).toBe(true)
    expect(runtime.camera.pitch).toBeLessThan(0.2)
    expect(toggleFirstPerson()).toBe(false)
    expect(runtime.camera.pitch).toBeCloseTo(0.6)
  })
})
