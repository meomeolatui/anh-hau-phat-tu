import { Color, SRGBColorSpace } from 'three'
import {
  SPECIES,
  buildTrees,
  crownShades,
  forestSpeciesAt,
  hash2,
  isColorful,
  leafPaletteFor,
  shellPoints,
  speciesAt,
  speciesForColor,
  treeLookAt,
} from './treeSpecies'
import { scatterForest } from './natureScatter'

const hsl = (hex) => new Color(hex).getHSL({ h: 0, s: 0, l: 0 }, SRGBColorSpace)
const hueDist = (a, b) => {
  const d = Math.abs(a - b) % 1
  return Math.min(d, 1 - d)
}

describe('treeSpecies — chọn loài theo vị trí', () => {
  it('hash2 xác định và nằm trong [0, 1)', () => {
    expect(hash2(12.34, -56.7)).toBe(hash2(12.34, -56.7))
    for (let i = 0; i < 200; i++) {
      const h = hash2(i * 3.7 - 100, i * -1.3, i % 5)
      expect(h).toBeGreaterThanOrEqual(0)
      expect(h).toBeLessThan(1)
    }
  })

  it('speciesAt ổn định theo vị trí và ~60% cây lớn có tán màu đỏ/cam/vàng/tím', () => {
    expect(speciesAt(18.5, 18.5)).toBe(speciesAt(18.5, 18.5))
    let colorful = 0
    const N = 4000
    for (let i = 0; i < N; i++) if (isColorful(speciesAt(-200 + (i % 80) * 5.3, -300 + Math.floor(i / 80) * 7.1))) colorful++
    expect(colorful / N).toBeGreaterThan(0.53)
    expect(colorful / N).toBeLessThan(0.67)
  })

  it('treeLookAt giữ màu zone truyền vào, tôn trọng species chỉ định, mặc định lấy màu loài', () => {
    expect(treeLookAt(5, 5, { color: '#c8452e' }).color).toBe('#c8452e')
    expect(treeLookAt(5, 5, { species: 'bang-lang' })).toEqual({ species: 'bang-lang', color: SPECIES['bang-lang'].color })
    const auto = treeLookAt(-24, 18)
    expect(auto.species).toBe(speciesAt(-24, 18))
    expect(auto.color).toBe(SPECIES[auto.species].color)
  })

  it('speciesForColor: màu xanh → loài xanh, màu đỏ/vàng → loài có màu, tím → bằng lăng', () => {
    expect(isColorful(speciesForColor('#5f9a52', 1, 2))).toBe(false)
    expect(isColorful(speciesForColor('#c8452e', 1, 2))).toBe(true)
    expect(isColorful(speciesForColor('#e8b232', 3, 4))).toBe(true)
    expect(speciesForColor('#9b6bc4', 3, 4)).toBe('bang-lang')
  })
})

describe('treeSpecies — mỗi cây một tông màu', () => {
  it('crownShades: 4 sắc độ cùng hue, sáng dần', () => {
    for (const sp of Object.values(SPECIES)) {
      const shades = crownShades(sp.color).map(hsl)
      const base = hsl(sp.color)
      shades.forEach((s) => expect(hueDist(s.h, base.h)).toBeLessThan(0.01))
      for (let i = 1; i < shades.length; i++) expect(shades[i].l).toBeGreaterThan(shades[i - 1].l)
    }
  })

  it('mọi khối tán, đốm hoa, chùm hoa của một cây cùng tông với màu tán (rừng và cây lớn)', () => {
    for (const big of [false, true]) {
      for (const species of Object.keys(SPECIES)) {
        const color = SPECIES[species].color
        const d = buildTrees([{ x: 3, y: 0, z: 7, s: 1, rot: 0.4, species }], { big })
        const leafy = [...d.ico, ...d.ico1, ...d.cone, ...d.dodeca, ...d.bloom, ...d.hang]
        // Tán nhiều cụm: 5–12 khối
        expect(d.ico.length + d.ico1.length + d.cone.length + d.dodeca.length).toBeGreaterThanOrEqual(5)
        expect(d.ico.length + d.ico1.length + d.cone.length + d.dodeca.length).toBeLessThanOrEqual(12)
        leafy.forEach((it) => expect(hueDist(hsl(it.c).h, hsl(color).h)).toBeLessThan(0.03))
        // Có thân + cành/rễ
        expect(d.wood.length).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('màu zone truyền vào là màu tán chính của mọi khối', () => {
    const d = buildTrees([{ x: 0, y: 0, z: 0, s: 1, rot: 0, color: '#e07a2c' }], { big: true })
    ;[...d.ico, ...d.ico1, ...d.dodeca, ...d.bloom].forEach((it) => expect(hueDist(hsl(it.c).h, hsl('#e07a2c').h)).toBeLessThan(0.03))
  })

  it('leafPaletteFor: lá rụng cùng tông với tán', () => {
    for (const species of ['phong', 'phuong', 'muong', 'bang-lang', 'da']) {
      const base = hsl(SPECIES[species].color)
      const pal = leafPaletteFor(species)
      expect(pal.length).toBeGreaterThanOrEqual(3)
      pal.slice(0, 3).forEach((c) => expect(hueDist(hsl(c).h, base.h)).toBeLessThan(0.01))
    }
    expect(hueDist(hsl(leafPaletteFor('da', '#c8452e')[1]).h, hsl('#c8452e').h)).toBeLessThan(0.01)
  })

  it('shellPoints rải đều trên vỏ ellipsoid', () => {
    const pts = shellPoints(40, [2, 1, 2], { from: -0.3, to: 1 })
    expect(pts).toHaveLength(40)
    pts.forEach(([x, y, z]) => expect((x / 2) ** 2 + y ** 2 + (z / 2) ** 2).toBeCloseTo(1, 5))
    // Không dồn một phía: đủ 4 góc phần tư
    const quads = new Set(pts.map(([x, , z]) => `${x > 0}${z > 0}`))
    expect(quads.size).toBe(4)
  })
})

describe('rừng sườn núi — cụm màu', () => {
  const { trees } = scatterForest()
  const species = trees.map((t) => forestSpeciesAt(t.x, t.z, t.kind))

  it('55–65% cây rừng có tán đỏ/cam/vàng/tím', () => {
    const ratio = species.filter(isColorful).length / species.length
    expect(ratio).toBeGreaterThan(0.55)
    expect(ratio).toBeLessThan(0.65)
  })

  it('phong (đỏ/cam/vàng) là nhóm màu phổ biến nhất', () => {
    const count = {}
    species.forEach((s) => (count[s] = (count[s] ?? 0) + 1))
    const phong = (count.phong ?? 0) + (count['phong-cam'] ?? 0) + (count['phong-vang'] ?? 0)
    for (const s of ['phuong', 'bang', 'muong', 'diep', 'bang-lang']) expect(phong).toBeGreaterThan(count[s] ?? 0)
  })

  it('cây màu mọc theo cụm: phần lớn cây màu có láng giềng gần nhất cùng loài', () => {
    const colored = trees.map((t, i) => ({ ...t, sp: species[i] })).filter((t) => isColorful(t.sp))
    let same = 0
    let total = 0
    for (const t of colored) {
      let best = null
      let bd = 15
      for (const o of colored) {
        if (o === t) continue
        const d = Math.hypot(o.x - t.x, o.z - t.z)
        if (d < bd) {
          bd = d
          best = o
        }
      }
      if (!best) continue
      total++
      if (best.sp === t.sp) same++
    }
    expect(same / total).toBeGreaterThan(0.45)
  })
})
