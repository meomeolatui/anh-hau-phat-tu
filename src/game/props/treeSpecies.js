import { Color, SRGBColorSpace } from 'three'

/**
 * Loài cây Nam Bộ cách điệu low-poly — logic THUẦN (không React), dùng chung cho:
 *  - BigTree (cây lớn trong zone) và Forest (rừng instanced) trong nature.jsx,
 *  - lá rụng (LeafField, lá rơi lả tả) để lá cùng màu với tán cây phía trên.
 *
 * QUY TẮC MÀU: mỗi cây MỘT tông màu — mọi khối tán, đốm hoa/lá, chùm hoa rủ đều là sắc độ
 * đậm/nhạt của cùng màu đó (cây đỏ thì đỏ hết, không lẫn chỏm xanh).
 */

/**
 * shape: dáng tán trong rừng instanced — 'tron' | 'xoe' | 'tang' | 'phong' | 'thong' | 'cao' | 'bui'
 * big:   dáng khi là BigTree — 'da' (có rễ phụ) | 'tron' | 'xoe' | 'tang' | 'phong' | 'cao' | 'bui'
 * bloom: 'dot' (đốm hoa/lá sáng màu rải đều khắp tán) | 'hang' (chùm hoa rủ) | null
 */
export const SPECIES = {
  xanh: { name: 'Cây rừng', shape: 'tron', big: 'tron', color: '#5f9a52', colorful: false, bloom: null },
  bui: { name: 'Bụi cây', shape: 'bui', big: 'bui', color: '#6a9e4f', colorful: false, bloom: null },
  thong: { name: 'Thông', shape: 'thong', big: 'cao', color: '#3f7442', colorful: false, bloom: null },
  sao: { name: 'Dầu, sao', shape: 'cao', big: 'cao', color: '#4f8a49', colorful: false, bloom: null },
  da: { name: 'Cây đa', shape: 'tron', big: 'da', color: '#5f9a52', colorful: false, bloom: null },
  'bo-de': { name: 'Bồ đề', shape: 'tron', big: 'da', color: '#6aa45a', colorful: false, bloom: null },
  phong: { name: 'Phong đỏ', shape: 'phong', big: 'phong', color: '#c8452e', colorful: true, bloom: 'dot' },
  'phong-cam': { name: 'Phong cam', shape: 'phong', big: 'phong', color: '#e07a2c', colorful: true, bloom: 'dot' },
  'phong-vang': { name: 'Phong vàng', shape: 'phong', big: 'phong', color: '#e8b232', colorful: true, bloom: 'dot' },
  phuong: { name: 'Phượng vĩ', shape: 'xoe', big: 'xoe', color: '#d93a2a', colorful: true, bloom: 'dot' },
  bang: { name: 'Bàng', shape: 'tang', big: 'tang', color: '#c9502c', colorful: true, bloom: null },
  muong: { name: 'Muồng hoàng yến', shape: 'tron', big: 'tron', color: '#efc53a', colorful: true, bloom: 'hang' },
  diep: { name: 'Điệp vàng', shape: 'xoe', big: 'xoe', color: '#e9a92e', colorful: true, bloom: 'dot' },
  'bang-lang': { name: 'Bằng lăng', shape: 'tron', big: 'tron', color: '#9a6fd0', colorful: true, bloom: 'dot' },
  mai: { name: 'Mai vàng', shape: 'bui', big: 'bui', color: '#f0c22e', colorful: true, bloom: 'dot' },
}

/** Màu tán có phải đỏ/cam/vàng/tím rõ rệt không (không phải xanh lá) */
export const isColorful = (species) => Boolean(SPECIES[species]?.colorful)

/* ---------------- Băm xác định theo vị trí ---------------- */

/** Số giả ngẫu nhiên [0,1) xác định theo (x, z) — làm tròn 0,1 m để không lệch vì sai số dấu phẩy động */
export function hash2(x, z, salt = 0) {
  const xi = Math.round(x * 10) | 0
  const zi = Math.round(z * 10) | 0
  let h = Math.imul(xi ^ 0x5bd1e995, 0x85ebca6b) ^ Math.imul(zi + Math.imul(salt + 1, 0x27d4eb2f), 0xc2b2ae35)
  h ^= h >>> 15
  h = Math.imul(h, 0x2c1b3c6d)
  h ^= h >>> 12
  h = Math.imul(h, 0x297a2d39)
  h ^= h >>> 15
  return (h >>> 0) / 4294967296
}

function pickWeighted(table, r) {
  let acc = 0
  for (const [id, w] of table) {
    acc += w
    if (r < acc) return id
  }
  return table[table.length - 1][0]
}

/* ---------------- Cây lớn (BigTree) ---------------- */

// ~60% cây lớn có tán đỏ/cam/vàng/tím; phong là loài màu phổ biến nhất
const BIG_POOL = [
  ['phong', 0.18],
  ['phong-vang', 0.1],
  ['phong-cam', 0.06],
  ['phuong', 0.1],
  ['bang', 0.07],
  ['muong', 0.06],
  ['bang-lang', 0.03],
  ['da', 0.18],
  ['bo-de', 0.14],
  ['sao', 0.08],
]
const GREEN_POOL = [
  ['da', 0.45],
  ['bo-de', 0.35],
  ['sao', 0.2],
]

/** Loài của cây lớn tại toạ độ THẾ GIỚI (x, z) của gốc cây — ổn định qua mỗi lần tải */
export function speciesAt(x, z) {
  return pickWeighted(BIG_POOL, hash2(x, z, 11))
}

/** Chọn dáng loài hợp với màu tán zone truyền vào (màu giữ nguyên, chỉ chọn dáng) */
export function speciesForColor(color, x, z) {
  const hsl = toHSL(color)
  const r = hash2(x, z, 23)
  const h = hsl.h
  if (hsl.s < 0.18 || (h > 0.19 && h < 0.55)) return pickWeighted(GREEN_POOL, r)
  if (h >= 0.62 && h < 0.93) return 'bang-lang'
  if (h >= 0.55 && h < 0.62) return 'sao'
  // vàng
  if (h >= 0.1 && h <= 0.19) return r < 0.6 ? 'phong-vang' : r < 0.85 ? 'muong' : 'diep'
  // đỏ / cam
  return r < 0.65 ? 'phong' : r < 0.85 ? 'bang' : 'phuong'
}

/**
 * Loài + màu tán CHÍNH của một cây lớn tại toạ độ thế giới (x, z) của gốc — cùng logic với BigTree.
 * opts.color: màu zone truyền cho BigTree (giữ nguyên làm màu tán chính); opts.species: loài chỉ định.
 * Dùng cho LeafField: `leafPalette(treeLookAt(t.x, t.z, { color: t.color }).color)`.
 * @returns {{ species: string, color: string }}
 */
export function treeLookAt(x, z, opts = {}) {
  const { color, species } = opts
  if (species && SPECIES[species]) return { species, color: color ?? SPECIES[species].color }
  if (color) return { species: speciesForColor(color, x, z), color }
  const sp = speciesAt(x, z)
  return { species: sp, color: SPECIES[sp].color }
}

/* ---------------- Sắc độ tán ---------------- */

const shadeCache = new Map()

/**
 * 4 sắc độ CÙNG TÔNG của màu tán: [đậm, gốc, sáng, sáng hơn] — chỉ đổi độ sáng/độ bão hoà, giữ nguyên hue.
 * @returns {string[]} mã hex '#rrggbb'
 */
export function crownShades(color) {
  const key = String(color)
  if (shadeCache.has(key)) return shadeCache.get(key)
  const hsl = toHSL(color)
  const at = (ds, dl) => fromHSL(hsl.h, clamp01(hsl.s + ds), clamp01(hsl.l + dl, 0.08, 0.88))
  const out = [at(0.03, -0.09), `#${new Color(color).getHexString()}`, at(0, 0.06), at(-0.02, 0.12)]
  shadeCache.set(key, out)
  return out
}

/** Màu đốm hoa / chùm hoa: sáng và tươi hơn màu tán một chút, cùng hue */
export function bloomColor(color) {
  const hsl = toHSL(color)
  return fromHSL(hsl.h, clamp01(hsl.s + 0.08), clamp01(hsl.l + 0.15, 0.2, 0.88))
}

/**
 * Màu lá rụng hợp với loài (cùng tông tán, thêm một sắc úa pha nâu nhẹ).
 * color: màu tán thực tế nếu khác màu mặc định của loài (vd. zone truyền color).
 * @returns {string[]}
 */
export function leafPaletteFor(species, color) {
  const c = color ?? SPECIES[species]?.color ?? SPECIES.xanh.color
  const [dark, base, light] = crownShades(c)
  const dry = `#${new Color(c).lerp(new Color('#8a6a35'), 0.3).getHexString()}`
  return [dark, base, light, dry]
}

function clamp01(v, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v))
}

/** HSL theo không gian sRGB (như mắt nhìn mã hex) — tránh HSL tuyến tính làm màu sẫm lệch độ sáng */
function toHSL(color) {
  return new Color(color).getHSL({ h: 0, s: 0, l: 0 }, SRGBColorSpace)
}

function fromHSL(h, s, l) {
  return `#${new Color().setHSL(h, s, l, SRGBColorSpace).getHexString()}`
}

/* ---------------- Rừng sườn núi: cụm màu như mùa hoa / mùa thu ---------------- */

/** Trường "có màu" tần số thấp (mảng ~30–60 m) + nhiễu nhỏ từng cây để mép cụm tự nhiên */
export function colorField(x, z) {
  return (
    Math.sin(x * 0.043 + z * 0.021 + 1.3) * 0.55 +
    Math.sin(z * 0.051 - x * 0.027 + 0.4) * 0.45 +
    Math.sin((x + z) * 0.093 + 2.1) * 0.25 +
    (hash2(x, z, 5) - 0.5) * 0.45
  )
}

/** Trường chọn loài màu: các dải liền nhau → cụm đỏ, cụm cam, cụm vàng nối tiếp nhau */
export function hueField(x, z) {
  return Math.sin(x * 0.031 - z * 0.017 + 0.7) + 0.6 * Math.sin(z * 0.045 + x * 0.012 + 2.2) + (hash2(x, z, 7) - 0.5) * 0.3
}

/** Ngưỡng trường màu — chỉnh để ~60% cây rừng có tán đỏ/cam/vàng/tím (xem test) */
export const FOREST_COLOR_THRESHOLD = -0.2

function colorBand(x, z) {
  if (hash2(x, z, 9) < 0.04) return 'bang-lang'
  const h = hueField(x, z)
  if (h < -0.95) return 'phuong'
  if (h < -0.35) return 'phong'
  if (h < 0.1) return hash2(x, z, 13) < 0.5 ? 'bang' : 'phong-cam'
  if (h < 0.6) return 'phong-vang'
  if (h < 1.05) return 'muong'
  return 'diep'
}

/**
 * Loài của một cây rừng tại (x, z) theo dáng gốc `kind` ('tron' | 'thong' | 'cao' | 'bui').
 * Cây trong mảng "có màu" lấy loài theo dải màu; ngoài mảng giữ xanh làm nền tương phản.
 */
export function forestSpeciesAt(x, z, kind = 'tron') {
  const colored = colorField(x, z) > FOREST_COLOR_THRESHOLD
  if (kind === 'bui') return colored && hash2(x, z, 17) < 0.75 ? 'mai' : 'bui'
  if (!colored) return kind === 'thong' ? 'thong' : kind === 'cao' ? 'sao' : 'xanh'
  // Một phần thông vẫn xanh giữa cụm màu (đỉnh núi nhiều thông)
  if (kind === 'thong' && hash2(x, z, 3) < 0.3) return 'thong'
  return colorBand(x, z)
}

/* ---------------- Dáng cây (khối tán + cành + rễ) ---------------- */

/** n khối tán xếp vòng quanh trục cây ở bán kính `rad`, độ cao `y` (dy: nhấp nhô xen kẽ) */
function ring(n, rad, y, s, shades, { g = 'ico', phase = 0, dy = 0 } = {}) {
  return Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2
    return { g, p: [Math.cos(a) * rad, y + (i % 2 ? dy : -dy), Math.sin(a) * rad], s, shade: shades[i % shades.length] }
  })
}

/** Cành chính: từ điểm `from` trên thân vươn tới (k phần) tâm từng khối tán */
function limbs(from, parts, r, k = 0.78) {
  return parts.map((p) => [from, [p.p[0] * k, from[1] + (p.p[1] - from[1]) * k, p.p[2] * k], r])
}

/** Rễ nổi toả quanh gốc */
function roots(n, rad, r, phase = 0.4) {
  return Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2
    return [[0, 0.32 * rad, 0], [Math.cos(a) * rad, -0.06, Math.sin(a) * rad], r]
  })
}

/** Cành ngang (bàng): `n` cành toả đều ở độ cao y, dài `len` */
function spokes(n, y, len, r, phase = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2
    return [[0, y - 0.05, 0], [Math.cos(a) * len, y + 0.08, Math.sin(a) * len], r]
  })
}

/**
 * Dựng một dáng: trunk { h, r } (thân), parts (khối tán { g, p, s, shade }), wood (cành/rễ [a, b, r]),
 * bloom (đốm hoa rải đều trên mặt các khối tán { n: tổng số đốm, size }).
 */
function shape({ trunk, parts, wood = [], bloom = null }) {
  return { trunk, parts, wood: [[[0, -0.1, 0], [0, trunk.h, 0], trunk.r], ...wood], bloom }
}

function forestShapes() {
  const tronRing = ring(4, 0.95, 2.5, [0.78, 0.66, 0.78], [0, 1], { dy: 0.1 })
  const xoeRing = ring(6, 1.55, 2.82, [0.85, 0.42, 0.85], [0, 1, 2], { dy: 0.08 })
  const phongRing = ring(4, 0.85, 2.4, [0.75, 0.65, 0.75], [0, 1])
  const caoRing = ring(5, 1.3, 4.55, [0.9, 0.6, 0.9], [0, 1, 2])
  return {
    tron: shape({
      trunk: { h: 2.0, r: 0.2 },
      parts: [{ g: 'ico', p: [0, 2.75, 0], s: [1.15, 0.95, 1.15], shade: 1 }, ...tronRing, ...ring(2, 0.45, 3.35, [0.62, 0.52, 0.62], [2, 3], { phase: 0.8 })],
      wood: [...limbs([0, 1.7, 0], tronRing, 0.07), ...roots(3, 0.5, 0.07)],
      bloom: { n: 12, size: 0.2 },
    }),
    xoe: shape({
      trunk: { h: 2.1, r: 0.22 },
      parts: [{ g: 'dodeca', p: [0, 2.95, 0], s: [1.3, 0.5, 1.3], shade: 1 }, ...xoeRing, ...ring(2, 0.6, 3.3, [0.7, 0.38, 0.7], [2, 3])],
      wood: [...limbs([0, 1.8, 0], xoeRing, 0.075, 0.8), ...roots(3, 0.55, 0.08)],
      bloom: { n: 16, size: 0.2 },
    }),
    tang: shape({
      trunk: { h: 3.6, r: 0.2 },
      parts: [
        { g: 'dodeca', p: [0, 2.0, 0], s: [1.9, 0.36, 1.9], shade: 0 },
        { g: 'dodeca', p: [0, 2.7, 0], s: [1.5, 0.36, 1.5], shade: 1 },
        { g: 'dodeca', p: [0, 3.35, 0], s: [1.05, 0.34, 1.05], shade: 2 },
        { g: 'dodeca', p: [0, 3.9, 0], s: [0.6, 0.3, 0.6], shade: 3 },
        ...ring(3, 1.35, 2.18, [0.6, 0.3, 0.6], [1], { g: 'dodeca', phase: 0.5 }),
      ],
      wood: [...spokes(3, 2.0, 1.5, 0.06, 0.5), ...roots(3, 0.5, 0.07)],
    }),
    phong: shape({
      trunk: { h: 1.9, r: 0.18 },
      parts: [
        { g: 'ico', p: [0, 2.65, 0], s: [1.1, 0.95, 1.1], shade: 1 },
        ...phongRing,
        ...ring(3, 0.5, 3.25, [0.6, 0.52, 0.6], [2, 2, 3], { phase: 0.5 }),
        { g: 'ico', p: [0, 3.85, 0], s: [0.45, 0.4, 0.45], shade: 3 },
      ],
      wood: [...limbs([0, 1.6, 0], phongRing, 0.065), ...roots(3, 0.45, 0.06)],
      bloom: { n: 12, size: 0.18 },
    }),
    thong: shape({
      trunk: { h: 1.6, r: 0.15 },
      parts: [
        [2.2, 1.4, 1.3, 0],
        [2.95, 1.15, 1.2, 1],
        [3.65, 0.92, 1.1, 1],
        [4.3, 0.7, 1.0, 2],
        [4.85, 0.45, 0.8, 3],
      ].map(([y, r, h, shade]) => ({ g: 'cone', p: [0, y, 0], s: [r, h, r], shade })),
      wood: roots(2, 0.4, 0.06),
    }),
    cao: shape({
      trunk: { h: 4.0, r: 0.19 },
      parts: [{ g: 'ico', p: [0, 4.75, 0], s: [1.4, 0.85, 1.4], shade: 1 }, ...caoRing, { g: 'ico', p: [0.2, 5.35, 0], s: [0.8, 0.5, 0.8], shade: 3 }],
      wood: [...limbs([0, 3.5, 0], caoRing, 0.07, 0.8), ...roots(3, 0.6, 0.08)],
      bloom: { n: 14, size: 0.22 },
    }),
    bui: shape({
      trunk: { h: 0.45, r: 0.07 },
      parts: [
        { g: 'ico', p: [0, 0.75, 0], s: [0.7, 0.55, 0.7], shade: 1 },
        ...ring(4, 0.5, 0.62, [0.45, 0.38, 0.45], [0, 1, 2, 1]),
        { g: 'ico', p: [0, 1.08, 0], s: [0.4, 0.32, 0.4], shade: 3 },
      ],
      wood: limbs([0, 0.3, 0], ring(4, 0.5, 0.62, [0, 0, 0], [0]), 0.03),
      bloom: { n: 12, size: 0.13 },
    }),
  }
}

function bigShapes() {
  const daRing = ring(6, 2.3, 4.3, [1.5, 1.15, 1.5], [0, 1, 2], { dy: 0.2 })
  const tronRing = ring(5, 2.0, 4.1, [1.4, 1.1, 1.4], [0, 1, 2])
  const xoeRing = ring(7, 2.6, 4.1, [1.4, 0.7, 1.4], [0, 1, 2], { dy: 0.12 })
  const phongRing = ring(5, 1.9, 4.1, [1.35, 1.1, 1.35], [0, 1, 0, 1, 2])
  const caoRing = ring(5, 1.9, 6.1, [1.3, 0.8, 1.3], [0, 1, 2])
  const buiRing = ring(5, 0.95, 1.3, [0.7, 0.6, 0.7], [0, 1, 2])
  const aerial = Array.from({ length: 6 }, (_, i) => {
    const a = 0.3 + (i / 6) * Math.PI * 2
    return [[Math.cos(a) * 0.6, 2.4, Math.sin(a) * 0.6], [Math.cos(a) * 1.35, -0.05, Math.sin(a) * 1.35], 0.1]
  })
  return {
    da: shape({
      trunk: { h: 3.6, r: 0.75 },
      parts: [{ g: 'ico1', p: [0, 4.8, 0], s: [2.4, 1.6, 2.4], shade: 1 }, ...daRing, ...ring(4, 1.2, 5.7, [1.25, 0.95, 1.25], [2, 3, 2, 1], { phase: 0.6 })],
      wood: [...limbs([0, 3.0, 0], daRing, 0.2, 0.72), ...aerial, ...roots(6, 2.3, 0.2)],
    }),
    tron: shape({
      trunk: { h: 3.0, r: 0.5 },
      parts: [{ g: 'ico1', p: [0, 4.5, 0], s: [2.2, 1.7, 2.2], shade: 1 }, ...tronRing, ...ring(3, 1.0, 5.4, [1.1, 0.9, 1.1], [2, 3, 2], { phase: 0.5 })],
      wood: [...limbs([0, 2.6, 0], tronRing, 0.15), ...roots(4, 1.5, 0.15)],
      bloom: { n: 64, size: 0.3 },
    }),
    xoe: shape({
      trunk: { h: 2.8, r: 0.45 },
      parts: [{ g: 'dodeca', p: [0, 4.3, 0], s: [2.2, 0.8, 2.2], shade: 1 }, ...xoeRing, ...ring(3, 1.2, 4.75, [1.2, 0.6, 1.2], [2, 3, 2])],
      wood: [...limbs([0, 2.4, 0], xoeRing, 0.15, 0.85), ...roots(4, 1.6, 0.15)],
      bloom: { n: 90, size: 0.3 },
    }),
    tang: shape({
      trunk: { h: 5.6, r: 0.42 },
      parts: [
        ...[
          [2.8, 3.4, 0],
          [3.8, 2.7, 1],
          [4.7, 1.9, 2],
          [5.45, 1.1, 3],
        ].map(([y, r, shade]) => ({ g: 'dodeca', p: [0, y, 0], s: [r, 0.55, r], shade })),
        ...ring(3, 2.4, 3.0, [0.95, 0.42, 0.95], [1], { g: 'dodeca', phase: 0.5 }),
        ...ring(3, 1.9, 3.95, [0.8, 0.4, 0.8], [2], { g: 'dodeca', phase: 1.5 }),
      ],
      wood: [...spokes(3, 2.75, 2.9, 0.12, 0.5), ...spokes(3, 3.75, 2.2, 0.1, 1.5), ...spokes(3, 4.65, 1.5, 0.08, 0.2), ...roots(4, 1.4, 0.14)],
    }),
    phong: shape({
      trunk: { h: 3.0, r: 0.45 },
      parts: [
        { g: 'ico1', p: [0, 4.5, 0], s: [2.0, 1.6, 2.0], shade: 1 },
        ...phongRing,
        ...ring(4, 1.1, 5.4, [1.1, 0.9, 1.1], [2, 3, 2, 1], { phase: 0.4 }),
        { g: 'ico', p: [0, 6.3, 0], s: [0.75, 0.6, 0.75], shade: 3 },
      ],
      wood: [...limbs([0, 2.6, 0], phongRing, 0.15), ...roots(4, 1.4, 0.14)],
      bloom: { n: 56, size: 0.28 },
    }),
    cao: shape({
      trunk: { h: 5.6, r: 0.4 },
      parts: [{ g: 'ico1', p: [0, 6.4, 0], s: [2.0, 1.1, 2.0], shade: 1 }, ...caoRing, { g: 'ico', p: [0, 7.1, 0], s: [1.0, 0.6, 1.0], shade: 3 }],
      wood: [...limbs([0, 4.6, 0], caoRing, 0.13), ...roots(4, 1.3, 0.16)],
      bloom: { n: 56, size: 0.3 },
    }),
    bui: shape({
      trunk: { h: 0.9, r: 0.14 },
      parts: [{ g: 'ico1', p: [0, 1.5, 0], s: [1.1, 0.85, 1.1], shade: 1 }, ...buiRing, ...ring(3, 0.5, 1.95, [0.55, 0.45, 0.55], [2, 3, 2])],
      wood: limbs([0, 0.6, 0], buiRing, 0.05),
      bloom: { n: 60, size: 0.16 },
    }),
  }
}

/** Dáng cây rừng instanced (cây s = 1) */
export const SHAPES = forestShapes()
/** Dáng cây lớn BigTree (scale = 1) */
export const BIG_SHAPES = bigShapes()

const TRUNK_COLOR = '#6b4f3a'

/** Bán kính ngang và độ cao giữa tán (đơn vị cây, scale = 1) — để rải lá rơi đúng dưới tán */
export function crownExtent(species, { big = true } = {}) {
  const sp = SPECIES[species] ?? SPECIES.xanh
  const shp = (big ? BIG_SHAPES : SHAPES)[big ? sp.big : sp.shape]
  let radius = 0
  let top = 0
  for (const q of shp.parts) {
    radius = Math.max(radius, Math.hypot(q.p[0], q.p[2]) + q.s[0] * 0.6)
    top = Math.max(top, q.p[1])
  }
  return { radius, top }
}

/**
 * Điểm rải đều trên vỏ ellipsoid (xoắn ốc Fibonacci) — đốm hoa phân bố đều khắp tán.
 * from/to: sin vĩ độ dưới/trên (−1..1).
 * @returns {[number, number, number][]} toạ độ cục bộ quanh tâm vỏ
 */
export function shellPoints(n, [rx, ry, rz], { from = -0.25, to = 1 } = {}) {
  const out = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = to - ((i + 0.5) / n) * (to - from)
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const a = i * golden
    out.push([Math.cos(a) * r * rx, y * ry, Math.sin(a) * r * rz])
  }
  return out
}

/** Loài của một item cây: chỉ định → theo màu zone truyền → theo cụm màu của rừng */
export function itemSpecies(t) {
  if (t.species && SPECIES[t.species]) return t.species
  if (t.color) return speciesForColor(t.color, t.x, t.z)
  return forestSpeciesAt(t.x, t.z, t.kind)
}

/**
 * Tách danh sách cây thành các lô instance theo hình khối (mỗi lô = 1 draw call cho mọi cây).
 * items: [{ x, y, z, s, rot, kind?, species?, color? }]
 * big: dùng dáng cây lớn (BigTree) thay vì dáng cây rừng.
 * @returns {{ wood: Wood[], ico: Inst[], ico1: Inst[], cone: Inst[], dodeca: Inst[], bloom: Inst[], hang: Inst[], species: string[] }}
 *   Inst = { p: [x,y,z], s: [sx,sy,sz], ry: number, c: '#hex' }
 *   Wood = { p: trung điểm, s: [r, dài, r], dir: [dx,dy,dz] đơn vị, c } — thân, cành, rễ
 */
export function buildTrees(items, { big = false } = {}) {
  const out = { wood: [], ico: [], ico1: [], cone: [], dodeca: [], bloom: [], hang: [], species: [] }
  const tmp = new Color()
  const shapes = big ? BIG_SHAPES : SHAPES
  for (const t of items) {
    const species = itemSpecies(t)
    out.species.push(species)
    const sp = SPECIES[species]
    const shp = shapes[big ? sp.big : sp.shape]
    const color = t.color ?? sp.color
    // Lệch màu nhẹ từng cây (cả cây lệch cùng một lượng → vẫn một tông)
    const j = hash2(t.x, t.z, 31)
    const k = hash2(t.x, t.z, 37)
    const shades = crownShades(color).map((c) => jitterHex(tmp, c, (j - 0.5) * 0.02, (k - 0.5) * 0.08, (j + k - 1) * 0.04))
    const cos = Math.cos(t.rot)
    const sin = Math.sin(t.rot)
    const at = ([lx, ly, lz]) => [t.x + (lx * cos + lz * sin) * t.s, t.y + ly * t.s, t.z + (-lx * sin + lz * cos) * t.s]
    const bark = jitterHex(tmp, TRUNK_COLOR, 0, 0, (k - 0.5) * 0.08)
    for (const [a, b, r] of shp.wood) {
      const pa = at(a)
      const pb = at(b)
      const d = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]]
      const len = Math.hypot(d[0], d[1], d[2]) || 1
      out.wood.push({ p: [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2], s: [r * t.s, len, r * t.s], dir: d.map((v) => v / len), c: bark })
    }
    shp.parts.forEach((part, i) => {
      out[part.g].push({ p: at(part.p), s: part.s.map((v) => v * t.s), ry: t.rot + i * 0.9, c: shades[part.shade] })
    })
    if (sp.bloom && shp.bloom) {
      // Đốm hoa nằm ĐÚNG trên mặt từng khối tán (không lơ lửng), chia theo diện tích khối → phủ đều cả tán
      const b = shp.bloom
      const bc = jitterHex(tmp, bloomColor(color), 0, 0, (j - 0.5) * 0.06)
      const hang = sp.bloom === 'hang'
      const area = shp.parts.map((q) => q.s[0] * q.s[2] + q.s[1] * (q.s[0] + q.s[2]) * 0.5)
      const total = area.reduce((a, v) => a + v, 0)
      const want = hang ? Math.round(b.n * 0.7) : b.n
      let idx = 0
      shp.parts.forEach((part, pi) => {
        const n = Math.max(1, Math.round((want * area[pi]) / total))
        const pts = shellPoints(n, part.s, hang ? { from: -0.75, to: -0.1 } : { from: -0.3, to: 0.95 })
        const a = pi * 1.3
        const ca = Math.cos(a)
        const sa = Math.sin(a)
        for (const [lx, ly, lz] of pts) {
          // Mặt khối icosa nằm trong mặt cầu đơn vị (tâm mặt ~0,8) → đặt ở 0,92 để đốm bám sát mặt
          const p = at([part.p[0] + (lx * ca - lz * sa) * 0.92, part.p[1] + ly * 0.92, part.p[2] + (lx * sa + lz * ca) * 0.92])
          const i = idx++
          if (hang) out.hang.push({ p, s: [b.size * 0.7 * t.s, b.size * (2.6 + (i % 3) * 0.7) * t.s, b.size * 0.7 * t.s], ry: t.rot + i * 0.37, c: i % 3 ? bc : shades[3] })
          else out.bloom.push({ p, s: [b.size * t.s, b.size * 0.8 * t.s, b.size * t.s], ry: t.rot + i * 0.37, c: i % 2 ? bc : shades[3] })
        }
      })
    }
  }
  return out
}

function jitterHex(tmp, hex, dh, ds, dl) {
  const c = tmp.set(hex).getHSL({ h: 0, s: 0, l: 0 }, SRGBColorSpace)
  return fromHSL((c.h + dh + 1) % 1, clamp01(c.s + ds), clamp01(c.l + dl))
}
