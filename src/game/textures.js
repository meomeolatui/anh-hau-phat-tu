import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Texture vẽ bằng canvas (không cần file ảnh, chạy offline). HỢP ĐỒNG API:
 *   getTexture(name) → CanvasTexture | null (null khi môi trường không có canvas, vd. test jsdom)
 *   Tên có sẵn: 'stone' (gạch đá lát sân), 'roof' (ngói âm dương), 'wood' (vân gỗ), 'plaster' (tường vôi),
 *               'granite' (đá granite lốm đốm), 'grass' (cỏ), 'cloth' (vải áo dệt), 'mist' (đốm sương mềm, có alpha),
 *               'halo' (quầng sáng tròn, có alpha — mặt trăng, đèn)
 * Texture màu XÁM/TRẮNG làm chi tiết sáng tối — màu thật lấy từ material.color (nhân với texture).
 * Độ sáng trung bình giữ quanh 0,85–0,9 để màu PALETTE không bị tối đi khi gắn texture.
 * Mọi texture lặp liền mạch (vẽ quấn mép) để dùng repeat thoải mái.
 * Dùng qua toon(color, { map: 'roof', repeat: [4, 2] }) trong materials.js.
 */

const SIZE = 512
const cache = new Map()

function canvas() {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  let ctx = null
  try {
    ctx = c.getContext?.('2d') ?? null
  } catch {
    // jsdom không có canvas 2D (ném lỗi "not implemented") → coi như không hỗ trợ
    ctx = null
  }
  return ctx ? { c, ctx } : null
}

/** Bộ sinh số giả ngẫu nhiên xác định (Park–Miller) → texture giống hệt nhau mỗi lần tải */
function rng(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const gray = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`

/** Gọi fn(dx, dy) cho 9 bản sao lệch ±SIZE — vẽ hình chạm mép vẫn lặp liền mạch */
function wrap(fn) {
  for (const dx of [-SIZE, 0, SIZE]) for (const dy of [-SIZE, 0, SIZE]) fn(dx, dy)
}

/** Nhiễu hạt mịn để bề mặt không phẳng màu */
function grain(ctx, amount = 18, seed = 1) {
  const img = ctx.getImageData(0, 0, SIZE, SIZE)
  const r = rng(seed)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * amount
    img.data[i] += n
    img.data[i + 1] += n
    img.data[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)
}

/** Vết loang mềm (gradient tròn) sáng/tối ngẫu nhiên — tạo sắc độ lớn cho tường, đá, cỏ */
function blotches(ctx, r, count, { min = 20, max = 90, alpha = 0.08, light = 0.5 } = {}) {
  for (let i = 0; i < count; i++) {
    const x = r() * SIZE
    const y = r() * SIZE
    const rad = min + r() * (max - min)
    const v = r() < light ? 255 : 0
    const a = alpha * (0.4 + r() * 0.6)
    wrap((dx, dy) => {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad)
      g.addColorStop(0, gray(v, a))
      g.addColorStop(1, gray(v, 0))
      ctx.fillStyle = g
      ctx.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2)
    })
  }
}

/** Vết nứt mảnh gấp khúc */
function crack(ctx, r, x, y, len, shade = 90, width = 1.2) {
  ctx.strokeStyle = gray(shade, 0.55)
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x, y)
  let a = r() * Math.PI * 2
  for (let k = 0; k < 6; k++) {
    a += (r() - 0.5) * 1.2
    x += Math.cos(a) * (len / 6)
    y += Math.sin(a) * (len / 6)
    ctx.lineTo(x, y)
  }
  ctx.stroke()
}

const PAINTERS = {
  /** Đá lát sân: phiến chữ nhật so le, mỗi phiên một sắc độ, cạnh vát sáng/tối, mạch vữa sẫm, vết nứt nhỏ */
  stone(ctx) {
    const r = rng(7)
    ctx.fillStyle = gray(150)
    ctx.fillRect(0, 0, SIZE, SIZE)
    const rows = 4
    const h = SIZE / rows
    const gap = 4
    for (let row = 0; row < rows; row++) {
      const y = row * h
      // Chia hàng thành các phiên dài ngắn khác nhau, cộng dồn đủ đúng SIZE để lặp liền
      const widths = []
      let left = SIZE
      while (left > 0) {
        const w = left < h * 1.6 ? left : Math.round(h * (0.9 + r() * 0.9))
        widths.push(w)
        left -= w
      }
      let x = (row % 2) * h * 0.55
      for (const w of widths) {
        const shade = 196 + r() * 44
        for (const dx of [-SIZE, 0, SIZE]) {
          const sx = x + dx + gap / 2
          const sy = y + gap / 2
          const sw = w - gap
          const sh = h - gap
          ctx.fillStyle = gray(shade)
          ctx.fillRect(sx, sy, sw, sh)
          // vát cạnh: mép trên-trái sáng, dưới-phải tối → phiến đá nổi khối
          ctx.fillStyle = gray(255, 0.22)
          ctx.fillRect(sx, sy, sw, 3)
          ctx.fillRect(sx, sy, 3, sh)
          ctx.fillStyle = gray(0, 0.16)
          ctx.fillRect(sx, sy + sh - 3, sw, 3)
          ctx.fillRect(sx + sw - 3, sy, 3, sh)
        }
        x += w
      }
    }
    blotches(ctx, r, 40, { min: 10, max: 40, alpha: 0.07 })
    for (let i = 0; i < 9; i++) crack(ctx, r, r() * SIZE, r() * SIZE, 20 + r() * 30, 110, 1)
    grain(ctx, 22, 7)
  },

  /**
   * Ngói âm dương: các rãnh ngói âm (lòng máng, tối giữa) xen hàng ngói dương (ống tròn, sáng gờ),
   * chạy dọc theo v; mỗi hàng chồng mí có bóng đổ dưới đầu viên ngói.
   */
  roof(ctx) {
    const r = rng(3)
    const cols = 6
    const w = SIZE / cols
    const rows = 4
    const h = SIZE / rows
    ctx.fillStyle = gray(200)
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let i = 0; i < cols; i++) {
      const x0 = i * w
      // Ngói âm (lòng máng): tối ở giữa, sáng ra hai mép
      const gc = ctx.createLinearGradient(x0, 0, x0 + w, 0)
      gc.addColorStop(0, gray(215))
      gc.addColorStop(0.5, gray(168))
      gc.addColorStop(1, gray(215))
      ctx.fillStyle = gc
      ctx.fillRect(x0, 0, w, SIZE)
    }
    // Đầu viên ngói chồng mí: dải bóng dưới mép + gờ sáng
    for (let row = 0; row < rows; row++) {
      const y = row * h
      for (let i = 0; i < cols; i++) {
        const tone = r() * 14 - 7
        ctx.fillStyle = gray(128 + tone, 0.5)
        ctx.fillRect(i * w, y + h - 7, w, 7)
        ctx.fillStyle = gray(255, 0.35)
        ctx.fillRect(i * w, y, w, 2)
      }
    }
    // Ngói dương (ống tròn) nằm trên khe giữa hai rãnh âm
    const cw = w * 0.42
    for (let i = 0; i <= cols; i++) {
      const cx = i * w
      for (let row = 0; row < rows; row++) {
        const y = row * h
        const g = ctx.createLinearGradient(cx - cw / 2, 0, cx + cw / 2, 0)
        g.addColorStop(0, gray(95))
        g.addColorStop(0.3, gray(250))
        g.addColorStop(0.55, gray(222))
        g.addColorStop(1, gray(110))
        ctx.fillStyle = g
        ctx.fillRect(cx - cw / 2, y, cw, h)
        // đầu ống ngói: vòng tròn sáng + bóng
        ctx.fillStyle = gray(70, 0.45)
        ctx.beginPath()
        ctx.ellipse(cx, y + h - 2, cw / 2, 5, 0, 0, Math.PI)
        ctx.fill()
        ctx.fillStyle = gray(255, 0.25)
        ctx.fillRect(cx - cw / 2 + 2, y + 1, cw - 4, 2)
      }
    }
    blotches(ctx, r, 26, { min: 15, max: 50, alpha: 0.07, light: 0.35 })
    grain(ctx, 14, 3)
  },

  /** Vân gỗ: thớ lượn sóng chạy theo u (lặp tuần hoàn), có mắt gỗ với vòng vân né quanh */
  wood(ctx) {
    const r = rng(11)
    ctx.fillStyle = gray(212)
    ctx.fillRect(0, 0, SIZE, SIZE)
    // Dải sáng tối lớn của thớ gỗ
    for (let y = 0; y < SIZE; y += 16) {
      ctx.fillStyle = gray(r() < 0.5 ? 255 : 0, 0.04 + r() * 0.05)
      ctx.fillRect(0, y, SIZE, 8 + r() * 10)
    }
    const knots = [
      { x: SIZE * 0.3, y: SIZE * 0.35, r: 14 },
      { x: SIZE * 0.75, y: SIZE * 0.72, r: 10 },
    ]
    const TAU = Math.PI * 2
    for (let y = 2; y < SIZE; y += 4 + r() * 3) {
      const ph1 = r() * TAU
      const ph2 = r() * TAU
      const amp = 1.5 + r() * 2.5
      ctx.strokeStyle = gray(r() < 0.75 ? 70 : 255, 0.08 + r() * 0.14)
      ctx.lineWidth = 0.8 + r() * 1.4
      ctx.beginPath()
      for (let x = 0; x <= SIZE; x += 4) {
        // sóng có chu kỳ chia hết SIZE → lặp liền mép trái/phải
        let yy = y + Math.sin((x / SIZE) * TAU * 2 + ph1) * amp + Math.sin((x / SIZE) * TAU * 5 + ph2) * amp * 0.4
        for (const k of knots) {
          const dx = x - k.x
          const dy = yy - k.y
          const d2 = dx * dx + dy * dy
          // thớ gỗ uốn tránh mắt gỗ
          yy += (Math.sign(dy) || 1) * k.r * 2.2 * Math.exp(-d2 / (k.r * k.r * 6))
        }
        if (x === 0) ctx.moveTo(x, yy)
        else ctx.lineTo(x, yy)
      }
      ctx.stroke()
    }
    for (const k of knots) {
      for (let i = 4; i > 0; i--) {
        ctx.strokeStyle = gray(60, 0.18)
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.ellipse(k.x, k.y, (k.r * i) / 3, (k.r * i) / 5, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.fillStyle = gray(80, 0.45)
      ctx.beginPath()
      ctx.ellipse(k.x, k.y, k.r * 0.45, k.r * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    grain(ctx, 14, 11)
  },

  /** Tường vôi: nền trắng ngà, loang mảng sáng tối nhẹ, vệt ố mưa mờ chảy dọc */
  plaster(ctx) {
    const r = rng(5)
    ctx.fillStyle = gray(236)
    ctx.fillRect(0, 0, SIZE, SIZE)
    blotches(ctx, r, 34, { min: 40, max: 130, alpha: 0.06, light: 0.45 })
    blotches(ctx, r, 60, { min: 6, max: 22, alpha: 0.05, light: 0.3 })
    // Vệt ố dọc (lặp theo trục dọc nhờ vẽ quấn)
    for (let i = 0; i < 7; i++) {
      const x = r() * SIZE
      const y = r() * SIZE
      const w = 6 + r() * 16
      const len = 80 + r() * 160
      wrap((dx, dy) => {
        const g = ctx.createLinearGradient(0, y + dy, 0, y + dy + len)
        g.addColorStop(0, gray(90, 0.07))
        g.addColorStop(1, gray(90, 0))
        ctx.fillStyle = g
        ctx.fillRect(x + dx - w / 2, y + dy, w, len)
      })
    }
    for (let i = 0; i < 4; i++) crack(ctx, r, r() * SIZE, r() * SIZE, 25 + r() * 25, 130, 0.8)
    grain(ctx, 10, 5)
  },

  /** Đá granite: mảng sắc độ lớn + hạt mica đen, hạt fenspat trắng, vài đường nứt */
  granite(ctx) {
    const r = rng(9)
    ctx.fillStyle = gray(204)
    ctx.fillRect(0, 0, SIZE, SIZE)
    blotches(ctx, r, 30, { min: 30, max: 110, alpha: 0.1, light: 0.5 })
    for (let i = 0; i < 2600; i++) {
      const x = r() * SIZE
      const y = r() * SIZE
      const t = r()
      const v = t < 0.45 ? 60 + r() * 60 : t < 0.8 ? 150 + r() * 50 : 238 + r() * 17
      ctx.fillStyle = gray(v, 0.55 + r() * 0.45)
      const s = 1 + r() * (t < 0.45 ? 3 : 2.2)
      ctx.fillRect(x, y, s, s * (0.6 + r() * 0.8))
    }
    for (let i = 0; i < 6; i++) crack(ctx, r, r() * SIZE, r() * SIZE, 40 + r() * 60, 80, 1.3)
    grain(ctx, 20, 13)
  },

  /** Cỏ: các cụm sáng tối + hàng nghìn ngọn cỏ ngắn nghiêng ngẫu nhiên */
  grass(ctx) {
    const r = rng(17)
    ctx.fillStyle = gray(205)
    ctx.fillRect(0, 0, SIZE, SIZE)
    blotches(ctx, r, 40, { min: 25, max: 90, alpha: 0.12, light: 0.5 })
    for (let i = 0; i < 4200; i++) {
      const x = r() * SIZE
      const y = r() * SIZE
      const len = 4 + r() * 9
      const a = -Math.PI / 2 + (r() - 0.5) * 1.1
      ctx.strokeStyle = gray(r() < 0.5 ? 130 + r() * 50 : 225 + r() * 30, 0.5)
      ctx.lineWidth = 1 + r()
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
      ctx.stroke()
    }
    grain(ctx, 26, 17)
  },

  /** Vải dệt: sợi dọc/ngang đan xen, nếp vải mềm theo chiều dọc */
  cloth(ctx) {
    const r = rng(19)
    ctx.fillStyle = gray(234)
    ctx.fillRect(0, 0, SIZE, SIZE)
    for (let i = 0; i < SIZE; i += 4) {
      ctx.fillStyle = gray(0, 0.05)
      ctx.fillRect(i, 0, 1, SIZE)
      ctx.fillStyle = gray(0, 0.035)
      ctx.fillRect(0, i + 2, SIZE, 1)
    }
    // Nếp vải: dải gradient dọc, tuần hoàn theo u
    for (let i = 0; i < 5; i++) {
      const x = r() * SIZE
      const w = 30 + r() * 60
      for (const dx of [-SIZE, 0, SIZE]) {
        const g = ctx.createLinearGradient(x + dx - w, 0, x + dx + w, 0)
        g.addColorStop(0, gray(0, 0))
        g.addColorStop(0.5, gray(0, 0.06))
        g.addColorStop(1, gray(0, 0))
        ctx.fillStyle = g
        ctx.fillRect(x + dx - w, 0, w * 2, SIZE)
      }
    }
    grain(ctx, 8, 19)
  },

  /** Đốm sương: tròn mềm trắng, alpha giảm dần ra mép (dùng cho sprite sương thung lũng, quầng sáng) */
  mist(ctx) {
    ctx.clearRect(0, 0, SIZE, SIZE)
    const r = rng(23)
    // vài đốm chồng nhau → mép sương không tròn xoe
    for (let i = 0; i < 7; i++) {
      const cx = SIZE / 2 + (r() - 0.5) * SIZE * 0.3
      const cy = SIZE / 2 + (r() - 0.5) * SIZE * 0.2
      const rad = SIZE * (0.22 + r() * 0.16)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
      g.addColorStop(0, 'rgba(255,255,255,0.32)')
      g.addColorStop(0.6, 'rgba(255,255,255,0.12)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SIZE, SIZE)
    }
  },

  /** Quầng sáng tròn mờ dần đều (alpha) */
  halo(ctx) {
    ctx.clearRect(0, 0, SIZE, SIZE)
    const c = SIZE / 2
    const g = ctx.createRadialGradient(c, c, 0, c, c, c)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.15, 'rgba(255,255,255,0.6)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.16)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, SIZE, SIZE)
  },
}

export const TEXTURE_NAMES = Object.keys(PAINTERS)

export function getTexture(name) {
  if (cache.has(name)) return cache.get(name)
  const painter = PAINTERS[name]
  const cv = painter ? canvas() : null
  if (!cv) {
    cache.set(name, null)
    return null
  }
  painter(cv.ctx)
  const tex = new CanvasTexture(cv.c)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  cache.set(name, tex)
  return tex
}
