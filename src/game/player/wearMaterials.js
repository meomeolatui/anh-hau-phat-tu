import { DoubleSide } from 'three'
import { soft, shade } from './softMaterial'
import { patternTexture } from './costumeGeometry'

/** Vật liệu thay/thêm cho Avatar khi mặc một bộ (null = đồ thường) */
export function wearMaterials(wear) {
  if (!wear) return {}
  const out = {}
  if (wear.sash) out.sash = soft(wear.sash)
  if (wear.pants) out.pants = soft(wear.pants)
  if (wear.shoe) out.shoe = soft(wear.shoe)
  const skirtColor = wear.skirt ?? wear.robe
  if (wear.skirtPattern === 'tiger') {
    const map = patternTexture('tiger', skirtColor, '#2a1a12')
    out.skirt = map ? soft(skirtColor, { map, mapKey: `tiger|${skirtColor}`, side: DoubleSide }) : soft(skirtColor, { side: DoubleSide })
  } else if (wear.skirt) {
    out.skirt = soft(shade(wear.skirt, -0.04), { side: DoubleSide })
  }
  if (wear.kasaya) {
    const { color, line, rich = false } = wear.kasaya
    const map = patternTexture('kasaya', color, line, rich)
    out.kasaya = map ? soft(color, { map, mapKey: `kasaya|${color}|${line}|${rich}`, side: DoubleSide }) : soft(color, { side: DoubleSide })
    out.kasayaArm = soft(color)
    out.kasayaRing = soft(rich ? '#f0c75a' : shade(line, 0.1))
  }
  if (wear.cape) out.cape = soft(wear.cape, { side: DoubleSide })
  if (wear.pauldrons) out.pad = soft(wear.pauldrons)
  if (wear.necklace) out.necklace = soft(wear.necklace)
  return out
}

/** Có che tóc búi / mũ len ni cô không (vòng Kim Cô thì không) */
export const hatCoversHair = (hat) => Boolean(hat && hat.kind !== 'kim-co')
