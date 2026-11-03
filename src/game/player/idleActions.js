import { COSTUMES } from '../shop/wardrobe'

/**
 * Động tác khi đứng yên một lúc (không bấm gì): tuỳ bộ đồ đang mặc.
 *  - Tề Thiên / Bát Giới / Sa Tăng (có binh khí): múa gậy
 *  - Cà sa (mọi màu, cả cà sa gấm): ngắm quanh rồi lạy bốn phương
 *  - Thần Tài: chắp tay vái chúc phúc
 *  - Đồ thường: đứng ngắm cảnh
 * Chỉ là hoạt ảnh — không cộng công đức, xu. Mọi thao tác di chuyển/nhảy huỷ ngay.
 */

/** Đứng yên bao lâu (giây) thì bắt đầu; xong một lượt thì nghỉ thêm REST_AFTER rồi mới làm lại */
export const IDLE_DELAY = 6
export const REST_AFTER = 8
const TURN = 0.8 // giây xoay người 90° giữa hai phương

/** Kịch bản: các đoạn { anim, dur, turn? } — turn = góc xoay người (rad) rải đều trong đoạn */
export const IDLE_SCRIPTS = {
  'mua-gay': [{ anim: 'twirl', dur: 6.5 }],
  'lay-bon-phuong': [
    { anim: 'look', dur: 3.5 },
    { anim: 'bow', dur: 3 },
    ...[1, 2, 3].flatMap(() => [
      { anim: 'idle', dur: TURN, turn: Math.PI / 2 },
      { anim: 'bow', dur: 3 },
    ]),
    // Quay về hướng ban đầu
    { anim: 'idle', dur: TURN, turn: Math.PI / 2 },
  ],
  'chuc-phuc': [{ anim: 'vai', dur: 4.5 }],
  'ngam-canh': [{ anim: 'look', dur: 5 }],
}

export function idleActionFor(costumeId) {
  const c = COSTUMES[costumeId]
  if (!c) return 'ngam-canh'
  if (c.back) return 'mua-gay'
  if (c.kasaya) return 'lay-bon-phuong'
  if (costumeId === 'than-tai') return 'chuc-phuc'
  return 'ngam-canh'
}

export const scriptLength = (kind) => IDLE_SCRIPTS[kind].reduce((s, seg) => s + seg.dur, 0)

/**
 * Trạng thái động tác tại thời điểm t (giây) của kịch bản.
 * @returns {{ anim: string, turnRate: number } | null} null = đã xong; turnRate = rad/giây cần xoay lúc này
 */
export function idleSegmentAt(kind, t) {
  let start = 0
  for (const seg of IDLE_SCRIPTS[kind]) {
    if (t < start + seg.dur) return { anim: seg.anim, turnRate: seg.turn ? seg.turn / seg.dur : 0 }
    start += seg.dur
  }
  return null
}

/**
 * Một bước cho người chơi đứng yên.
 * @param {{ wait: number, kind: string|null, t: number }} st  trạng thái (sửa tại chỗ)
 * @param {boolean} still  đang đứng yên tự do (không bấm, không bận, không mệt)
 * @returns {{ anim: string, turnRate: number } | null} null = không có động tác (dùng tư thế thường)
 */
export function stepIdle(st, still, costumeId, dt) {
  if (!still) {
    st.wait = 0
    st.kind = null
    st.t = 0
    return null
  }
  if (!st.kind) {
    st.wait += dt
    if (st.wait < IDLE_DELAY) return null
    st.kind = idleActionFor(costumeId)
    st.t = 0
  }
  st.t += dt
  const seg = idleSegmentAt(st.kind, st.t)
  if (!seg) {
    // Xong một lượt: nghỉ REST_AFTER giây (đếm lại từ IDLE_DELAY − REST_AFTER… tức chờ đủ REST_AFTER) rồi lặp
    st.kind = null
    st.t = 0
    st.wait = IDLE_DELAY - REST_AFTER
    return null
  }
  return seg
}
