import {
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Float32BufferAttribute,
  LatheGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three'

/**
 * Hình học trang phục & mũ mão (thuần JS, test được): cà sa vắt vai, áo choàng, mẫu vải, các kiểu mũ.
 * Toạ độ: hệ thân (gốc ở hông, mặt trước +Z) cho áo; hệ đầu (tâm đầu ở y 0.17) cho mũ — cùng Avatar.jsx.
 */

/** Đường cong thân áo (bán kính, độ cao) — Avatar dựng thân áo bằng chính đường này */
export const TORSO_PROFILE = [
  [0.0, -0.02],
  [0.2, -0.02],
  [0.212, 0.1],
  [0.228, 0.28],
  [0.222, 0.42],
  [0.2, 0.52],
  [0.15, 0.6],
  [0.08, 0.64],
  [0.0, 0.645],
]

/** Bán kính thân áo ở độ cao y (nội suy theo TORSO_PROFILE) */
export function torsoRadius(y) {
  const pts = TORSO_PROFILE.slice(1) // bỏ điểm tâm đáy
  if (y <= pts[0][1]) return pts[0][0]
  for (let i = 1; i < pts.length; i++) {
    const [r0, y0] = pts[i - 1]
    const [r1, y1] = pts[i]
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0)
  }
  return 0
}

export const lathe = (pts, seg = 28) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), seg)

/**
 * Tấm vải ôm quanh trục Y: mỗi hàng ở độ cao y phủ cung góc arc(y) = [phiFrom, phiTo], bán kính radius(y).
 * Góc phi tính như LatheGeometry: x = sin(phi)·r, z = cos(phi)·r (phi = 0 là mặt trước).
 * UV: u theo cung, v theo chiều cao → dán được mẫu vải lặp.
 */
export function wrapGeometry({ yTop, yBottom, arc, radius, rows = 14, cols = 28 }) {
  const pos = []
  const uv = []
  const index = []
  for (let i = 0; i <= rows; i++) {
    const v = i / rows
    const y = yTop + (yBottom - yTop) * v
    const [a0, a1] = arc(y)
    const r = radius(y)
    for (let j = 0; j <= cols; j++) {
      const u = j / cols
      const phi = a0 + (a1 - a0) * u
      pos.push(Math.sin(phi) * r, y, Math.cos(phi) * r)
      uv.push(u, 1 - v)
    }
  }
  const w = cols + 1
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * w + j
      const b = a + w
      // Mặt ngoài quay ra ngoài khi phi tăng theo j (cùng chiều lathe)
      index.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/**
 * Cà sa vắt vai: phủ kín vai TRÁI (phía −X) và lưng, mép trước chạy chéo từ cổ xuống hông phải,
 * để lộ vai phải & áo trong — đúng kiểu đắp y "thiên đản hữu kiên".
 */
export function kasayaFront(y) {
  const t = Math.min(1, Math.max(0, (0.6 - y) / 0.6)) // 0 ở vai → 1 ở eo
  return 0.05 + 1.25 * t
}

export function buildKasayaTorso() {
  return wrapGeometry({
    yTop: 0.6,
    yBottom: -0.03,
    arc: (y) => [-Math.PI - kasayaFront(y), kasayaFront(y)],
    radius: (y) => torsoRadius(y) * 1.05 + 0.01,
    rows: 16,
    cols: 30,
  })
}

/** Phần cà sa quấn quanh vạt áo (ngắn hơn vạt áo trong để lộ gấu áo) */
export function buildKasayaSkirt() {
  return lathe([
    [0.0, 0.035],
    [0.222, 0.035],
    [0.232, -0.06],
    [0.262, -0.2],
    [0.3, -0.34],
    [0.335, -0.44],
    [0.318, -0.448],
  ])
}

/** Áo choàng sau lưng: từ vai rủ xuống quá gối, loe dần */
export function buildCape() {
  return wrapGeometry({
    yTop: 0.58,
    yBottom: -0.62,
    arc: (y) => {
      const w = 0.95 + Math.min(1, Math.max(0, (0.58 - y) / 1.2)) * 0.45
      return [Math.PI - w, Math.PI + w]
    },
    radius: (y) => (y >= 0 ? torsoRadius(y) * 1.1 + 0.02 : 0.24 + -y * 0.26),
    rows: 18,
    cols: 20,
  })
}

/** Góc nghiêng binh khí đeo sau lưng (quanh trục Z của thân) và chỗ đeo */
export const WEAPON_BACK = { tilt: { 'gay-nhu-y': 0.62, 'cao-cuu-rang': -0.6, 'nguyet-xan': 0.6 }, position: [0, 0.3, -0.27] }

/* ---------------- Mẫu vải (canvas) ---------------- */

const textures = new Map()

/**
 * kind 'kasaya': ô ruộng (các dải dọc, mỗi dải chia ô so le) — vân cà sa truyền thống.
 * kind 'tiger': vằn da hổ.
 * Trả về null khi không có canvas (môi trường test).
 */
export function patternTexture(kind, base, line, rich = false) {
  const key = `${kind}|${base}|${line}|${rich}`
  if (textures.has(key)) return textures.get(key)
  let tex = null
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
  const ctx = canvas?.getContext?.('2d')
  if (ctx) {
    canvas.width = 256
    canvas.height = 256
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    if (kind === 'kasaya') drawPaddies(ctx, line, rich)
    else if (kind === 'tiger') drawTiger(ctx, line)
    tex = new CanvasTexture(canvas)
    tex.colorSpace = SRGBColorSpace
    tex.wrapS = RepeatWrapping
    tex.wrapT = RepeatWrapping
    tex.repeat.set(kind === 'kasaya' ? 3 : 2, kind === 'kasaya' ? 1.5 : 1)
  }
  textures.set(key, tex)
  return tex
}

function drawPaddies(ctx, line, rich) {
  ctx.strokeStyle = line
  ctx.lineWidth = rich ? 7 : 5
  const cols = 5
  const cw = 256 / cols
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath()
    ctx.moveTo(c * cw, 0)
    ctx.lineTo(c * cw, 256)
    ctx.stroke()
  }
  // Mỗi dải chia ô dài–ngắn so le như bờ ruộng
  for (let c = 0; c < cols; c++) {
    const off = c % 2 ? 0.35 : 0.7
    for (const f of [off, off + 0.5]) {
      const y = (f % 1) * 256
      ctx.beginPath()
      ctx.moveTo(c * cw, y)
      ctx.lineTo((c + 1) * cw, y)
      ctx.stroke()
    }
  }
  if (rich) {
    // Gấm: chấm hoa vàng giữa mỗi ô
    ctx.fillStyle = line
    for (let c = 0; c < cols; c++) {
      for (const f of [0.1, 0.6]) {
        ctx.beginPath()
        ctx.arc((c + 0.5) * cw, (((c % 2 ? 0.35 : 0.7) + f) % 1) * 256, 6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

function drawTiger(ctx, line) {
  ctx.fillStyle = line
  for (let i = 0; i < 9; i++) {
    const x = 14 + i * 28
    ctx.beginPath()
    ctx.moveTo(x, 0)
    // Vằn uốn lượn, nhọn hai đầu
    for (let y = 0; y <= 256; y += 16) ctx.lineTo(x + Math.sin(y * 0.05 + i) * 7 + 5, y)
    for (let y = 256; y >= 0; y -= 16) ctx.lineTo(x + Math.sin(y * 0.05 + i) * 7 - 2 + (i % 3), y)
    ctx.closePath()
    ctx.fill()
  }
}

/* ---------------- Mũ mão ---------------- */

/** Nón lá: vỏ nón hình chóp (hai mặt) + vòng nón */
export function buildConicalHat() {
  return lathe(
    [
      [0.0, 0.58],
      [0.03, 0.565],
      [0.47, 0.235],
      [0.475, 0.225],
      [0.455, 0.228],
      [0.03, 0.55],
      [0.0, 0.56],
    ],
    32,
  )
}

/** Mặt nón quai thao: phẳng, vành rộng hơi cụp */
export function buildFlatHat() {
  return lathe(
    [
      [0.0, 0.37],
      [0.42, 0.365],
      [0.47, 0.34],
      [0.475, 0.325],
      [0.46, 0.33],
      [0.41, 0.35],
      [0.17, 0.35],
      [0.165, 0.29],
      [0.0, 0.29],
    ],
    32,
  )
}

/** Thân mão tròn (mão Thần Tài, mão hoàng kim) ôm đầu từ ngang trán */
export function buildCrownShell(top = 0.5, r = 0.222) {
  return lathe(
    [
      [0.0, top],
      [r * 0.55, top],
      [r * 0.92, top - 0.035],
      [r, top - 0.08],
      [r, 0.25],
      [r - 0.012, 0.25],
    ],
    28,
  )
}

/** Lông trĩ cắm trên mão Tề Thiên — cong vút lên rồi ngả ra sau, hơi chếch ra ngoài */
export function buildFeather(side) {
  const pts = [
    [0.05, 0.43, 0.02],
    [0.12, 0.72, -0.03],
    [0.26, 1.02, -0.2],
    [0.46, 1.2, -0.46],
    [0.66, 1.24, -0.72],
  ].map(([x, y, z]) => new Vector3(x * side, y, z))
  return new TubeGeometry(new CatmullRomCurve3(pts), 28, 0.016, 6, false)
}

/** Quai nón: vòng cung từ hai bên vành xuống dưới cằm */
export function buildStrap() {
  const pts = [
    [-0.2, 0.3, 0.0],
    [-0.17, 0.06, 0.09],
    [0.0, -0.035, 0.15],
    [0.17, 0.06, 0.09],
    [0.2, 0.3, 0.0],
  ].map(([x, y, z]) => new Vector3(x, y, z))
  return new TubeGeometry(new CatmullRomCurve3(pts), 20, 0.006, 5, false)
}
