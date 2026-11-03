import { describe, expect, it } from 'vitest'
import { GLOW_BOOST, postFxEnabled, wantsFpsMeter } from './quality'
import { getGlowBoost, glow, setGlowBoost } from '../materials'
import { getTexture, TEXTURE_NAMES } from '../textures'
import { waterMaterial } from './waterMaterial'
import { skyUniforms } from './skyUniforms'

describe('hậu kỳ theo chất lượng', () => {
  it('low tắt, high bật, auto chỉ bật trên máy tính', () => {
    expect(postFxEnabled('low', false)).toBe(false)
    expect(postFxEnabled('high', true)).toBe(true)
    expect(postFxEnabled('auto', false)).toBe(true)
    expect(postFxEnabled('auto', true)).toBe(false)
  })

  it('chỉ báo FPS khi URL có ?fps', () => {
    expect(wantsFpsMeter('?fps')).toBe(true)
    expect(wantsFpsMeter('?a=1&fps=1')).toBe(true)
    expect(wantsFpsMeter('')).toBe(false)
  })
})

describe('vật liệu phát sáng', () => {
  it('đẩy sáng HDR khi bật Bloom và trả về màu gốc khi tắt', () => {
    const m = glow('#ffb347')
    const r0 = m.color.r
    setGlowBoost(GLOW_BOOST)
    expect(getGlowBoost()).toBe(GLOW_BOOST)
    expect(m.color.r).toBeCloseTo(r0 * GLOW_BOOST, 5)
    const strong = glow('#ffb347', 1, 2)
    expect(strong.color.r).toBeCloseTo(r0 * GLOW_BOOST * 2, 5)
    setGlowBoost(1)
    expect(m.color.r).toBeCloseTo(r0, 5)
    expect(strong.color.r).toBeCloseTo(r0, 5)
  })

  it('glow cache theo (màu, độ trong, cường độ)', () => {
    expect(glow('#ffcf7a')).toBe(glow('#ffcf7a'))
    expect(glow('#ffcf7a', 1, 2)).not.toBe(glow('#ffcf7a'))
  })
})

describe('texture & nước', () => {
  it('không có canvas (jsdom) thì getTexture trả null, không ném lỗi', () => {
    for (const name of TEXTURE_NAMES) expect(() => getTexture(name)).not.toThrow()
    expect(TEXTURE_NAMES).toEqual(expect.arrayContaining(['stone', 'roof', 'wood', 'plaster', 'granite', 'grass', 'cloth']))
  })

  it('vật liệu nước có cache và dùng chung uniform trời', () => {
    const a = waterMaterial()
    expect(waterMaterial()).toBe(a)
    const s = waterMaterial(undefined, { kind: 'stream' })
    expect(s).not.toBe(a)
    expect(a.uniforms.uTime).toBe(skyUniforms.uTime)
    expect(s.uniforms.uSkyTop).toBe(skyUniforms.uSkyTop)
    expect(a.fog).toBe(true)
  })
})

describe('module đồ hoạ nạp được (không cần WebGL)', () => {
  it('PostFX, Environment, Terrain, WaterSurface, FpsMeter', async () => {
    const mods = await Promise.all([
      import('../world/PostFX'),
      import('../world/Environment'),
      import('../world/Terrain'),
      import('../props/water'),
      import('./FpsMeter'),
    ])
    for (const m of mods) expect(typeof (m.default ?? m.WaterSurface)).toBe('function')
  })
})
