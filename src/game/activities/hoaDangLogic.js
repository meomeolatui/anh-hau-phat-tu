import { hashString } from '../progression'
import { seeded } from '../../lib/random'

/**
 * Logic thuần cho đèn hoa đăng: lời nguyện mẫu, màu đèn, chuyển động trôi trên mặt hồ.
 */

export const HOA_DANG_COOLDOWN = 3 * 60 * 1000
export const HOA_DANG_MERIT = 10
export const MAX_WISH = 120

export const WISH_TEMPLATES = [
  'Nguyện cha mẹ luôn mạnh khoẻ, bình an.',
  'Nguyện gia đình hoà thuận, thương yêu nhau.',
  'Tưởng nhớ người thân đã khuất, nguyện được an lành.',
  'Nguyện con biết nói lời hiền, làm việc lành.',
  'Nguyện mọi người bớt khổ đau, thêm an vui.',
  'Nguyện muôn loài được an ổn, thế giới hoà bình.',
]

export const LANTERN_COLORS = [
  { id: 'sen-hong', label: 'Sen hồng', petal: '#f2a2bd' },
  { id: 'vang-nghe', label: 'Vàng nghệ', petal: '#f6c453' },
  { id: 'trang-nga', label: 'Trắng ngà', petal: '#f4efe2' },
  { id: 'do-son', label: 'Đỏ son', petal: '#e2574c' },
  { id: 'tim-sen', label: 'Tím sen', petal: '#b99ad9' },
]

/** Màu cánh sen theo id màu (đèn cũ chưa có màu → chọn theo id đèn cho đa dạng) */
export function lanternPetal(colorId, lanternId = '') {
  const found = LANTERN_COLORS.find((c) => c.id === colorId)
  if (found) return found.petal
  return LANTERN_COLORS[hashString(String(lanternId)) % LANTERN_COLORS.length].petal
}

/** Chuẩn hoá lời nguyện: bỏ khoảng trắng thừa, cắt 120 ký tự */
export function cleanWish(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_WISH)
}

/* ---------- Trôi lững lờ ---------- */

/** Biên an toàn từ mép hồ (m) */
export const POND_MARGIN = 0.6

/**
 * Tham số trôi xác định theo id đèn (mỗi lần tải giống nhau).
 * @param {string} id
 * @param {number} w bề ngang hồ
 * @param {number} d bề sâu hồ
 */
export function driftParams(id, w, d) {
  const r = seeded(hashString(String(id)))
  const hx = Math.max(0.2, w / 2 - POND_MARGIN)
  const hz = Math.max(0.2, d / 2 - POND_MARGIN)
  const bx = (r() * 2 - 1) * hx * 0.6
  const bz = (r() * 2 - 1) * hz * 0.6
  return {
    hx,
    hz,
    bx,
    bz,
    ax: Math.min(hx - Math.abs(bx), 0.4 + r() * hx * 0.5),
    az: Math.min(hz - Math.abs(bz), 0.3 + r() * hz * 0.4),
    fx: 0.025 + r() * 0.035,
    fz: 0.02 + r() * 0.03,
    px: r() * Math.PI * 2,
    pz: r() * Math.PI * 2,
    spin: (r() - 0.5) * 0.12,
    bob: r() * Math.PI * 2,
  }
}

/** Vị trí cục bộ (x, z) quanh tâm hồ tại thời điểm t (giây) — luôn nằm trong hồ */
export function driftAt(p, t) {
  const x = p.bx + p.ax * Math.sin(t * p.fx * Math.PI * 2 + p.px)
  const z = p.bz + p.az * Math.sin(t * p.fz * Math.PI * 2 + p.pz)
  return [Math.min(p.hx, Math.max(-p.hx, x)), Math.min(p.hz, Math.max(-p.hz, z))]
}

/** Điểm thả đèn: mép hồ gần người chơi nhất (toạ độ cục bộ) */
export function launchPoint(localPlayerX, localPlayerZ, w, d) {
  const hx = Math.max(0.2, w / 2 - POND_MARGIN)
  const hz = Math.max(0.2, d / 2 - POND_MARGIN)
  const x = Math.min(hx, Math.max(-hx, localPlayerX))
  const z = Math.min(hz, Math.max(-hz, localPlayerZ))
  // Đẩy ra mép gần nhất
  return hx - Math.abs(x) < hz - Math.abs(z) ? [Math.sign(x || 1) * hx, z] : [x, Math.sign(z || 1) * hz]
}

/** Tầm hiện lời nguyện khi người chơi lại gần một đèn */
export const NEAR_RADIUS = 2.6
/** Một đèn chỉ nhắc lại lời nguyện sau 45 giây */
export const NEAR_REPEAT_MS = 45000
/** Đèn mới thả trôi từ mép hồ ra trong 6 giây */
export const LAUNCH_MS = 6000
