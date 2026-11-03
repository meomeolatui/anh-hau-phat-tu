import { describe, expect, it } from 'vitest'
import { Color } from 'three'
import { leafPalette, nearestTree, pickLeafColor } from './leafColors'
import { seeded } from '../../lib/random'

describe('màu lá rụng theo cây', () => {
  it('cây xanh → phần lớn lá rụng có sắc xanh', () => {
    const palette = leafPalette('#5f9a52')
    const rand = seeded(3)
    let green = 0
    for (let i = 0; i < 400; i++) {
      const c = pickLeafColor(rand, palette)
      const hsl = c.getHSL({})
      if (hsl.h > 0.2 && hsl.h < 0.45) green++
    }
    expect(green / 400).toBeGreaterThan(0.8)
  })

  it('cây đỏ → lá cùng tông đỏ', () => {
    const [, base] = leafPalette('#c0392b')
    expect(base.equals(new Color('#c0392b'))).toBe(true)
  })

  it('tìm đúng cây gần nhất', () => {
    const trees = [
      { x: 0, z: 0, color: 'a' },
      { x: 10, z: 0, color: 'b' },
    ]
    expect(nearestTree(trees, 8, 1).color).toBe('b')
    expect(nearestTree([], 0, 0)).toBeNull()
  })
})
