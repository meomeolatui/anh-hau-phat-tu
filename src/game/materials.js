import { Color, DataTexture, MeshBasicMaterial, MeshToonMaterial, NearestFilter, RedFormat } from 'three'
import { getTexture } from './textures'

/**
 * Bảng màu & vật liệu toon dùng chung. Tạo một lần, tái sử dụng (giảm draw-state, tiết kiệm bộ nhớ).
 * Phong cách: low-poly, tô bóng 3 bậc, màu ấm của chùa Nam Bộ giữa rừng núi xanh.
 */

export const PALETTE = {
  stone: '#cdbfa6',
  stoneDark: '#a8987d',
  tile: '#d9cdb4',
  granite: '#7c776d',
  graniteDark: '#5f5b53',
  wallCream: '#f3e6c8',
  wallYellow: '#e9c46a',
  pillarRed: '#a8322d',
  lacquer: '#7a1f1b',
  roof: '#9e3d27',
  roofDark: '#7d2f1f',
  roofGreen: '#3f7d62',
  gold: '#d9a441',
  bronze: '#9b6b3c',
  wood: '#7a5134',
  woodDark: '#563823',
  leaf: '#5f9a52',
  leafDark: '#3f7442',
  leafLight: '#8fc06a',
  grass: '#86b45d',
  trunk: '#6b4f3a',
  water: '#6fb7c7',
  lotus: '#f2a2bd',
  lotusLeaf: '#4f8f5a',
  cloth: '#5b7fa8', // áo tràng lam
  robeBrown: '#8a5a3b',
  robeSaffron: '#e0a33a',
  robeGrey: '#8d8f8a',
  skin: '#f0c9a4',
  incense: '#b0442f',
  smoke: '#e8e8ee',
  white: '#ffffff',
}

let gradient = null

/** Bản đồ chuyển sắc 3 bậc cho MeshToonMaterial */
export function toonGradient() {
  if (gradient) return gradient
  const data = new Uint8Array([90, 175, 255])
  gradient = new DataTexture(data, data.length, 1, RedFormat)
  gradient.minFilter = NearestFilter
  gradient.magFilter = NearestFilter
  gradient.generateMipmaps = false
  gradient.needsUpdate = true
  return gradient
}

const cache = new Map()

/**
 * Vật liệu toon theo màu (có cache).
 * @param {string} color  mã màu hoặc khoá trong PALETTE
 * @param {{ emissive?: string, emissiveIntensity?: number, transparent?: boolean, opacity?: number, flat?: boolean, side?: number, vertexColors?: boolean, map?: string, repeat?: [number, number] }} [opts]
 *   map: tên texture trong textures.js ('stone' | 'roof' | 'wood' | 'plaster' | 'granite' | 'grass' | 'cloth') — nhân với màu;
 *   repeat: số lần lặp texture theo [u, v] (mặc định [1, 1]).
 *   flat: giữ để tương thích — MeshToonMaterial không hỗ trợ flatShading; mặt phẳng low-poly lấy từ hình học (geometry thô, ít đỉnh)
 */
export function toon(color, opts = {}) {
  const hex = PALETTE[color] ?? color
  const key = `${hex}|${JSON.stringify(opts)}`
  if (cache.has(key)) return cache.get(key)
  const m = new MeshToonMaterial({
    color: new Color(hex),
    gradientMap: toonGradient(),
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    vertexColors: opts.vertexColors ?? false,
  })
  if (opts.map) {
    const base = getTexture(opts.map)
    if (base) {
      const [ru, rv] = opts.repeat ?? [1, 1]
      // Mỗi mức lặp cần bản sao texture riêng (repeat là thuộc tính của texture); ảnh canvas dùng chung
      const tex = ru === 1 && rv === 1 ? base : base.clone()
      tex.repeat.set(ru, rv)
      tex.needsUpdate = true
      m.map = tex
    }
  }
  if (opts.side !== undefined) m.side = opts.side
  if (opts.emissive) {
    m.emissive = new Color(PALETTE[opts.emissive] ?? opts.emissive)
    m.emissiveIntensity = opts.emissiveIntensity ?? 1
  }
  cache.set(key, m)
  return m
}

const glowMats = new Set()
let glowBoost = 1

function applyGlow(m) {
  const { base, intensity } = m.userData
  // Chỉ đẩy sáng > 1 khi hậu kỳ bật (Bloom + tone mapping HDR); không có hậu kỳ thì giữ màu gốc,
  // vì toneMapped:false sẽ cắt màu > 1 thành trắng bệch.
  m.color.copy(base).multiplyScalar(glowBoost > 1 ? glowBoost * intensity : 1)
}

/**
 * Vật liệu không chịu ánh sáng (ngọn lửa, đèn, khói phát sáng).
 * @param {string} color mã màu hoặc khoá PALETTE
 * @param {number} [opacity=1]
 * @param {number} [intensity=1] hệ số sáng thêm khi hậu kỳ (Bloom) bật — >1 cho đèn/nến cần loá mạnh hơn
 */
export function glow(color, opacity = 1, intensity = 1) {
  const hex = PALETTE[color] ?? color
  const key = `glow|${hex}|${opacity}|${intensity}`
  if (cache.has(key)) return cache.get(key)
  const m = new MeshBasicMaterial({ color: new Color(hex), transparent: opacity < 1, opacity, toneMapped: false })
  m.userData.base = new Color(hex)
  m.userData.intensity = intensity
  applyGlow(m)
  glowMats.add(m)
  cache.set(key, m)
  return m
}

/**
 * Hệ số sáng HDR cho mọi vật liệu glow() — PostFX đặt > 1 khi bật Bloom (để chỉ đèn/nến vượt ngưỡng loá),
 * về 1 khi tắt hậu kỳ.
 */
export function setGlowBoost(k) {
  if (k === glowBoost) return
  glowBoost = k
  glowMats.forEach(applyGlow)
}

export function getGlowBoost() {
  return glowBoost
}
