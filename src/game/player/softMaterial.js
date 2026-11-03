import { Color, DataTexture, MeshToonMaterial, NearestFilter, RedFormat } from 'three'

/** Vật liệu toon mềm (5 bậc sáng) dùng chung cho nhân vật & trang phục — có cache theo màu/tuỳ chọn */

let softGradient = null
function gradient() {
  if (softGradient) return softGradient
  const data = new Uint8Array([70, 120, 170, 215, 255])
  softGradient = new DataTexture(data, data.length, 1, RedFormat)
  softGradient.minFilter = NearestFilter
  softGradient.magFilter = NearestFilter
  softGradient.needsUpdate = true
  return softGradient
}

const matCache = new Map()
/** opts: side, opacity, map (+ mapKey để phân biệt trong cache) */
export function soft(color, opts = {}) {
  const key = `${color}|${opts.side ?? ''}|${opts.opacity ?? 1}|${opts.mapKey ?? ''}`
  if (matCache.has(key)) return matCache.get(key)
  const m = new MeshToonMaterial({ color: new Color(opts.map ? '#ffffff' : color), gradientMap: gradient() })
  if (opts.map) m.map = opts.map
  if (opts.side !== undefined) m.side = opts.side
  if (opts.opacity !== undefined && opts.opacity < 1) {
    m.transparent = true
    m.opacity = opts.opacity
    m.depthWrite = false
  }
  matCache.set(key, m)
  return m
}

export const shade = (hex, l) => `#${new Color(hex).offsetHSL(0, 0, l).getHexString()}`
