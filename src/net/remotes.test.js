import { beforeEach, describe, expect, it } from 'vitest'
import { INTERP_MS, STALE_MS, addRemote, applySnap, getRemote, isStale, removeRemote, resetRemotes, sampleRemote, setRemoteLook } from './remotes'
import { isMuted, pushMessage, toggleMute, clearMessages, useMessages } from './chatStore'
import { renderHook, act } from '@testing-library/react'

const look = (name) => ({ name, role: 'phat-tu' })

describe('người chơi khác (nội suy vị trí)', () => {
  beforeEach(() => resetRemotes())

  it('vẽ trễ một chút và nội suy mượt giữa hai mẫu vị trí', () => {
    addRemote({ id: 7, name: 'An', look: look('An') })
    applySnap([[7, 0, 0, 0, 0, 'walk', 1.6, null]], 1000)
    applySnap([[7, 1, 0, 0, 0.4, 'walk', 1.6, null]], 1100)
    const mid = sampleRemote(getRemote(7), 1050 + INTERP_MS)
    expect(mid.x).toBeCloseTo(0.5)
    expect(mid.r).toBeCloseTo(0.2)
    expect(mid.a).toBe('walk')
    // Sau mẫu cuối: đứng ở mẫu cuối, không đoán trước
    expect(sampleRemote(getRemote(7), 5000).x).toBe(1)
  })

  it('xoay qua đường ngắn nhất (không quay vòng ngược khi vượt ±π)', () => {
    addRemote({ id: 1, name: 'A', look: look('A') })
    applySnap([[1, 0, 0, 0, 3.1, 'idle', 0, null]], 0)
    applySnap([[1, 0, 0, 0, -3.1, 'idle', 0, null]], 100)
    const r = sampleRemote(getRemote(1), 50 + INTERP_MS).r
    expect(Math.abs(Math.abs(r) - Math.PI)).toBeLessThan(0.1)
  })

  it('lâu không có tin thì coi như ra khỏi tầm nhìn; đổi ngoại hình, rời đi', () => {
    addRemote({ id: 2, name: 'B', look: look('B') })
    applySnap([[2, 0, 0, 0, 0, 'idle', 0, null]], 0)
    expect(isStale(getRemote(2), 100)).toBe(false)
    expect(isStale(getRemote(2), STALE_MS + 1)).toBe(true)
    setRemoteLook(2, { ...look('Bình'), costume: 'te-thien' })
    expect(getRemote(2).name).toBe('Bình')
    expect(getRemote(2).source).toBeTruthy()
    removeRemote(2)
    expect(getRemote(2)).toBeUndefined()
  })
})

describe('chat: tắt tiếng người khác', () => {
  beforeEach(() => clearMessages())

  it('tắt tiếng thì ẩn tin cũ & bỏ qua tin mới của người đó (tin hệ thống vẫn hiện)', () => {
    const { result } = renderHook(() => useMessages())
    act(() => {
      pushMessage({ id: 1, name: 'Ồn ào', text: 'a', at: 1 })
      pushMessage({ id: 2, name: 'Hiền', text: 'A Di Đà Phật', at: 2 })
    })
    expect(result.current).toHaveLength(2)
    act(() => toggleMute('Ồn ào'))
    expect(isMuted('Ồn ào')).toBe(true)
    act(() => {
      pushMessage({ id: 1, name: 'Ồn ào', text: 'b', at: 3 })
      pushMessage({ system: true, name: 'Hệ thống', text: 'chậm lại', at: 4 })
    })
    expect(result.current.map((m) => m.text)).toEqual(['A Di Đà Phật', 'chậm lại'])
    act(() => toggleMute('Ồn ào'))
  })
})
