import { DEFAULT_SAVE, mergeDefaults } from '../src/game/saveDefaults.js'
import { ITEMS } from '../src/game/shop/items.js'
import { COSTUMES, HATS } from '../src/game/shop/wardrobe.js'

/**
 * Luật kiểm tra bản lưu do game gửi lên (máy chủ là nguồn sự thật cho công đức, xu, túi đồ, tủ đồ).
 *
 * Máy chủ không mô phỏng lại từng hoạt động, mà so bản mới với bản trước:
 *  - Công đức chỉ tăng, và không nhanh hơn "xô" cho phép (dung tích cap, nạp perSec mỗi giây).
 *  - Xu: phần tăng ròng + phần đã tiêu phải ≤ xô xu; phần tiêu phải khớp đúng giá các món mới mua
 *    (bảng giá dùng chung với game: shop/items.js, shop/wardrobe.js). Túi đồ chỉ tăng bằng cách mua.
 *  - Trang phục đang mặc phải là đồ đã có.
 * Vi phạm → sửa về mức hợp lệ và báo lại cho game (game thay bằng bản của máy chủ).
 */

export const RATES = {
  // Thiền 60 phút trả 600 công đức một lần khi xong → dung tích đủ chứa
  merit: { cap: 800, perSec: 4 },
  xu: { cap: 40, perSec: 0.5 },
}

const MAX_SAVE_BYTES = 64 * 1024
const int0 = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0)
const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : null)

export function fullBuckets(now) {
  return { merit: RATES.merit.cap, xu: RATES.xu.cap, at: now }
}

/** Nạp lại xô theo thời gian đã trôi */
export function refill(b, now) {
  const dt = Math.max(0, (now - (b?.at ?? now)) / 1000)
  return {
    merit: Math.min(RATES.merit.cap, (b?.merit ?? RATES.merit.cap) + dt * RATES.merit.perSec),
    xu: Math.min(RATES.xu.cap, (b?.xu ?? RATES.xu.cap) + dt * RATES.xu.perSec),
    at: now,
  }
}

/** Chuẩn hoá cấu trúc & kiểu dữ liệu, cắt bớt mảng/chuỗi quá dài */
export function sanitize(raw) {
  const s = mergeDefaults(DEFAULT_SAVE, raw && typeof raw === 'object' ? raw : null)
  s.version = DEFAULT_SAVE.version
  s.merit = int0(s.merit)
  s.xu = int0(s.xu)
  s.inventory = Object.fromEntries(Object.keys(DEFAULT_SAVE.inventory).map((k) => [k, int0(s.inventory?.[k])]))
  const owned = Array.isArray(s.wardrobe?.owned) ? s.wardrobe.owned : []
  s.wardrobe = {
    owned: [...new Set(owned.filter((id) => COSTUMES[id] || HATS[id]))],
    costume: COSTUMES[s.wardrobe?.costume] ? s.wardrobe.costume : null,
    hat: HATS[s.wardrobe?.hat] ? s.wardrobe.hat : null,
  }
  if (s.profile && typeof s.profile === 'object') {
    const p = s.profile
    s.profile = {
      name: str(p.name, 24) ?? 'Phật tử',
      role: str(p.role, 16) ?? 'phat-tu',
      outfit: str(p.outfit, 16),
      skin: str(p.skin, 16),
      hair: str(p.hair, 16),
      createdAt: str(p.createdAt, 40),
    }
  } else s.profile = null
  for (const k of Object.keys(DEFAULT_SAVE.stats)) s.stats[k] = int0(s.stats?.[k])
  s.lanterns = Array.isArray(s.lanterns) ? s.lanterns.slice(-30) : []
  s.discovered = {
    zones: Array.isArray(s.discovered?.zones) ? s.discovered.zones.slice(0, 50).map((z) => String(z).slice(0, 32)) : [],
    steles: Array.isArray(s.discovered?.steles) ? s.discovered.steles.slice(0, 200).map((z) => String(z).slice(0, 48)) : [],
  }
  s.daily = s.daily && typeof s.daily === 'object' ? s.daily : structuredClone(DEFAULT_SAVE.daily)
  if (!Array.isArray(s.daily.list)) s.daily.list = []
  s.daily.list = s.daily.list.slice(0, 10)
  if (!Array.isArray(s.lastPosition) || s.lastPosition.length !== 4 || !s.lastPosition.every(Number.isFinite)) s.lastPosition = null
  return s
}

export function saveTooBig(raw) {
  try {
    return JSON.stringify(raw).length > MAX_SAVE_BYTES
  } catch {
    return true
  }
}

/** Giá phải trả cho phần túi đồ / tủ đồ tăng thêm từ prev → next */
export function purchaseCost(prev, next) {
  let cost = 0
  for (const [key, item] of Object.entries(ITEMS)) {
    const d = (next.inventory[key] ?? 0) - (prev.inventory[key] ?? 0)
    if (d > 0) cost += Math.ceil(d / item.pack) * item.price
  }
  for (const id of next.wardrobe.owned) {
    if (prev.wardrobe.owned.includes(id)) continue
    cost += (COSTUMES[id] ?? HATS[id]).price
  }
  return cost
}

/**
 * Kiểm tra bản lưu mới so với bản trước.
 * @returns {{ save, buckets, fixed: string[] }} save = bản hợp lệ để lưu; fixed = các điều đã phải sửa
 */
export function validateSave(prevRaw, nextRaw, buckets, now = Date.now()) {
  const prev = sanitize(prevRaw)
  const next = sanitize(nextRaw)
  const b = refill(buckets, now)
  const fixed = []

  // Công đức
  const dMerit = next.merit - prev.merit
  if (dMerit < 0) {
    next.merit = prev.merit
    fixed.push('cong-duc-giam')
  } else if (dMerit > b.merit) {
    next.merit = prev.merit + Math.floor(b.merit)
    b.merit -= Math.floor(b.merit)
    fixed.push('cong-duc-qua-nhanh')
  } else b.merit -= dMerit

  // Xu & mua sắm
  let spent = purchaseCost(prev, next)
  const earned = Math.max(0, next.xu - prev.xu + spent)
  const allowed = Math.min(earned, Math.floor(b.xu))
  if (allowed < earned) fixed.push('xu-qua-nhanh')
  if (prev.xu + allowed - spent < 0) {
    // Không đủ xu cho những món mới → huỷ phần mua thêm
    for (const key of Object.keys(ITEMS)) next.inventory[key] = Math.min(next.inventory[key], prev.inventory[key])
    next.wardrobe.owned = next.wardrobe.owned.filter((id) => prev.wardrobe.owned.includes(id))
    spent = 0
    fixed.push('mua-khong-du-xu')
  }
  if (fixed.includes('xu-qua-nhanh') || fixed.includes('mua-khong-du-xu')) next.xu = prev.xu + allowed - spent
  b.xu -= allowed

  // Chỉ mặc đồ đã có
  if (next.wardrobe.costume && !next.wardrobe.owned.includes(next.wardrobe.costume)) next.wardrobe.costume = null
  if (next.wardrobe.hat && !next.wardrobe.owned.includes(next.wardrobe.hat)) next.wardrobe.hat = null

  return { save: next, buckets: b, fixed }
}

/**
 * Lần đầu đăng nhập: cho mang theo tiến trình chơi một mình nhưng giới hạn
 * (tránh nhập bản lưu tự sửa với số liệu khổng lồ).
 */
export const IMPORT_CAPS = { merit: 3000, xu: 300, item: 60 }
export function importLocal(raw) {
  const s = sanitize(raw)
  s.merit = Math.min(s.merit, IMPORT_CAPS.merit)
  s.xu = Math.min(s.xu, IMPORT_CAPS.xu)
  for (const k of Object.keys(s.inventory)) s.inventory[k] = Math.min(s.inventory[k], IMPORT_CAPS.item)
  return s
}
