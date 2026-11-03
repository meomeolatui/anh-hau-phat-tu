/** Sinh số giả ngẫu nhiên xác định từ seed (LCG) — để rừng, lá, hồ sen giống nhau mỗi lần tải */
export function seeded(seed) {
  let s = seed >>> 0 || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}
