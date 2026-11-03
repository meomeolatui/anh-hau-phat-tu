/**
 * Giao thức chơi online (dùng chung cho game và máy chủ server/).
 *
 * Kết nối: WebSocket `/ws?token=<phiên đăng nhập>`; mọi gói tin là JSON { t: loại, ... }.
 *
 * Khách → máy chủ:
 *   { t:'look', look }                         ngoại hình (tên, vai, da, tóc, áo, trang phục, mũ)
 *   { t:'st', z, p:[x,y,z,rotY], a, s, h }     trạng thái ≤ 10 lần/giây: khu, vị trí, hoạt ảnh, tốc độ, đồ cầm
 *   { t:'chat', scope:'near'|'zone', text }    chat chữ
 *   { t:'emote', id }                          biểu cảm (EMOTES)
 *   { t:'ev', kind, spot, power? }             sự kiện chung (SHARED_EVENTS): thỉnh chuông, thắp hương…
 *   { t:'save', save }                         bản lưu (máy chủ kiểm tra, có thể sửa lại)
 *   { t:'report', id, reason }                 báo cáo người chơi
 *
 * Máy chủ → khách:
 *   { t:'welcome', id, name, save }            vào phòng thành công + bản lưu chuẩn trên máy chủ
 *   { t:'roster', z, players:[{ id, name, look }] }  danh sách người cùng khu khi vừa vào khu
 *   { t:'join', id, name, look } / { t:'leave', id } / { t:'look', id, look }
 *   { t:'snap', ps:[[id, x, y, z, rotY, anim, speed, holding], …] }  vị trí người gần (TICK_HZ)
 *   { t:'chat', id, name, scope, text, at }
 *   { t:'emote', id, emote } / { t:'ev', id, kind, spot, power }
 *   { t:'save', save, fixed:[lý do] }          máy chủ sửa bản lưu (vượt tốc độ cho phép…)
 *   { t:'notice', text } / { t:'kicked', reason }
 */

export const TICK_HZ = 10
/** Bán kính "gần đây" cho chat gần và sự kiện chung (m) */
export const NEAR_RADIUS = 30
/** Chỉ gửi vị trí những người trong bán kính này, tối đa MAX_VIEW người gần nhất */
export const VIEW_RADIUS = 80
export const MAX_VIEW = 40
export const CHAT_MAX = 140
/** Mỗi người tối đa một tin / CHAT_GAP_MS, một biểu cảm / EMOTE_GAP_MS */
export const CHAT_GAP_MS = 1500
export const EMOTE_GAP_MS = 1200

/** Biểu cảm & câu chào có sẵn: anim = hoạt ảnh nhân vật, ms = thời gian giữ động tác */
export const EMOTES = {
  'a-di-da': { label: 'A Di Đà Phật', anim: 'pray', ms: 2600 },
  'binh-an': { label: 'Chúc bình an', anim: 'vai', ms: 4500 },
  chao: { label: 'Xin chào', anim: 'wave', ms: 2600 },
  'cam-on': { label: 'Cảm ơn', anim: 'vai', ms: 1600 },
  'tuy-hy': { label: 'Tùy hỷ công đức', anim: 'pray', ms: 2600 },
  lay: { label: 'Lạy', anim: 'bow', ms: 3000 },
}

/** Sự kiện chung người khác thấy/nghe được */
export const SHARED_EVENTS = ['bell', 'incense']

/** Hoạt ảnh hợp lệ gửi qua mạng (chữ thường, gạch nối) */
export const ANIM_RE = /^[a-z-]{1,16}$/

/** Tên khu hợp lệ (id zone trong world/layout.js) */
export const ZONE_RE = /^[a-z-]{1,24}$/

/** Ngoại hình gửi cho người khác — chỉ lấy các trường cần để dựng nhân vật */
export function lookFromProfile(profile, wardrobe) {
  return {
    name: String(profile?.name ?? 'Phật tử').slice(0, 24),
    role: profile?.role ?? 'phat-tu',
    skin: profile?.skin ?? null,
    hair: profile?.hair ?? null,
    outfit: profile?.outfit ?? null,
    costume: wardrobe?.costume ?? null,
    hat: wardrobe?.hat ?? null,
  }
}
