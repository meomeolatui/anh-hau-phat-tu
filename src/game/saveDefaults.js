/**
 * Cấu trúc dữ liệu lưu của người chơi (thuần JS — dùng chung cho game và máy chủ online).
 * Máy chủ tạo hồ sơ mới & kiểm tra bản lưu dựa trên DEFAULT_SAVE này.
 */

export const DEFAULT_SAVE = {
  version: 1,
  profile: null, // { name, role: 'phat-tu'|'chu-tieu'|'ni-co', outfit, skin, hair, createdAt }
  merit: 0, // công đức — điểm trò chơi
  /** Xu: tiền trong game, chỉ kiếm bằng công quả dưới chân núi (không nạp tiền thật) */
  xu: 10,
  /** Túi đồ: nhang (nén), hoa (bó), den (đèn hoa đăng) — người mới được tặng sẵn ít nhang */
  inventory: { nhang: 6, hoa: 0, den: 1 },
  /** Tủ đồ: trang phục & mũ mão đã mua ở sạp y phục (xem shop/wardrobe.js); costume/hat = đang mặc/đội (null = đồ thường) */
  wardrobe: { owned: [], costume: null, hat: null },
  /** Bộ đếm hoạt động trọn đời */
  stats: {
    niem: 0, // câu niệm Phật
    huong: 0, // lần thắp hương
    la: 0, // lá đã quét
    chuong: 0, // lần thỉnh chuông
    lay: 0, // lạy Phật
    thienPhut: 0, // phút thiền
    kinh: 0, // thời kinh
    hoaDang: 0, // đèn hoa đăng
    bia: 0, // bia pháp ngữ đã đọc (số lượng khác nhau)
    nghe: 0, // lần nghe chuyện / hỏi đạo
    capTreo: 0, // chuyến cáp treo
    rac: 0, // món rác đã nhặt
    tra: 0, // lần mời trà khách hành hương
  },
  /** Nhiệm vụ hằng ngày: { dateKey, list: [{ id, progress, claimed }] } */
  daily: { dateKey: null, list: [] },
  /** Những thứ đã khám phá */
  discovered: { zones: [], steles: [] },
  /** Lần cuối làm các việc có thời gian hồi (vd. thắp hương mỗi lư 1 lần / 10 phút) — key → ISO */
  cooldowns: {},
  /** Lời nguyện gửi theo đèn hoa đăng gần đây (hiển thị trôi trên hồ) */
  lanterns: [],
  /** Vị trí cuối cùng để vào lại game đúng chỗ */
  lastPosition: null,
  settings: {
    sound: true,
    haptics: true,
    music: true,
    bgm: true, // nhạc nền (file public/nhac/khuc-nhac-thien-dinh.mp3 hoặc bản tự soạn)
    bgmVolume: 0.5,
    bgmSource: 'youtube', // 'youtube' (trình phát nhúng, cần mạng) | 'synth' (file mp3 của bạn hoặc bản tự soạn)
    quality: 'auto', // 'low' | 'high' | 'auto'
    timeMode: 'real', // 'real' | 'day' | 'dusk' | 'night'
    sensitivity: 1,
    invertY: false,
    mouseLock: true, // máy tính: khoá chuột vào khung hình — di chuột là xoay camera (Esc hiện chuột)
  },
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Ghép dữ liệu đã lưu vào khung mặc định (thêm trường mới, bỏ trường lạ ở cấp đã biết) */
export function mergeDefaults(defaults, saved) {
  if (!isPlainObject(saved)) return structuredClone(defaults)
  const out = {}
  for (const key of Object.keys(defaults)) {
    const d = defaults[key]
    const s = saved[key]
    if (s === undefined) out[key] = structuredClone(d)
    else if (isPlainObject(d) && Object.keys(d).length && isPlainObject(s)) out[key] = mergeDefaults(d, s)
    else out[key] = s
  }
  return out
}
