/**
 * Nhiễu giá trị 2D xác định (không random, không phụ thuộc trình duyệt) — dùng cho chi tiết địa hình,
 * mảng màu đất/cỏ, rải đá. Thuần JS để test được.
 */

function hash(i, j) {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967295
}

/** Nhiễu giá trị trơn trong [0, 1] với bước lưới 1 */
export function valueNoise(x, z) {
  const i = Math.floor(x)
  const j = Math.floor(z)
  const fx = x - i
  const fz = z - j
  const u = fx * fx * (3 - 2 * fx)
  const v = fz * fz * (3 - 2 * fz)
  const a = hash(i, j)
  const b = hash(i + 1, j)
  const c = hash(i, j + 1)
  const d = hash(i + 1, j + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

/** Nhiễu nhiều tầng (fbm) trong [0, 1]; scale = bước sóng tầng thô nhất (mét) */
export function fbm(x, z, scale = 10, octaves = 3) {
  let sum = 0
  let amp = 1
  let norm = 0
  let f = 1 / scale
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * f + o * 17.3, z * f - o * 9.1) * amp
    norm += amp
    amp *= 0.5
    f *= 2.1
  }
  return sum / norm
}
