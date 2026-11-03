/**
 * Cấp độ, nhiệm vụ ngày. Công đức trong game chỉ là điểm số ghi nhận việc chơi —
 * tên cấp độ mang ý nghĩa khích lệ hành trình tu học, không phải "chứng đắc".
 */

export const LEVELS = [
  { title: 'Khách hành hương', min: 0 },
  { title: 'Sơ tâm', min: 100 },
  { title: 'Phát tâm', min: 300 },
  { title: 'Hoan hỷ', min: 700 },
  { title: 'Tinh tấn', min: 1400 },
  { title: 'Nhẫn hoà', min: 2500 },
  { title: 'Định tâm', min: 4000 },
  { title: 'Từ ái', min: 6000 },
  { title: 'Trí sáng', min: 9000 },
  { title: 'An lạc', min: 13000 },
  { title: 'Viên dung', min: 18000 },
]

/** @returns {{ index, title, min, next: number|null, progress: 0..1 }} */
export function levelFor(merit) {
  let index = 0
  for (let i = 0; i < LEVELS.length; i++) if (merit >= LEVELS[i].min) index = i
  const cur = LEVELS[index]
  const nxt = LEVELS[index + 1]
  const progress = nxt ? (merit - cur.min) / (nxt.min - cur.min) : 1
  return { index, title: cur.title, min: cur.min, next: nxt ? nxt.min : null, progress: Math.max(0, Math.min(1, progress)) }
}

/**
 * Kho nhiệm vụ ngày. stat = khoá trong save.stats; target = số lần cần; reward = công đức thưởng.
 */
export const QUESTS = {
  'niem-108': { title: 'Niệm tròn một chuỗi 108 hạt', stat: 'niem', target: 108, reward: 40 },
  'niem-324': { title: 'Niệm ba chuỗi hạt', stat: 'niem', target: 324, reward: 90 },
  'huong-1': { title: 'Thắp một nén hương', stat: 'huong', target: 1, reward: 15 },
  'huong-3': { title: 'Thắp hương ở ba lư hương', stat: 'huong', target: 3, reward: 45 },
  'la-30': { title: 'Quét 30 chiếc lá trong sân chùa', stat: 'la', target: 30, reward: 30 },
  'la-80': { title: 'Quét sạch 80 chiếc lá', stat: 'la', target: 80, reward: 70 },
  'chuong-1': { title: 'Thỉnh một hồi chuông', stat: 'chuong', target: 1, reward: 20 },
  'lay-3': { title: 'Lạy Phật ba lạy', stat: 'lay', target: 3, reward: 25 },
  'lay-9': { title: 'Lạy Phật chín lạy', stat: 'lay', target: 9, reward: 60 },
  'thien-5': { title: 'Ngồi thiền 5 phút', stat: 'thienPhut', target: 5, reward: 50 },
  'kinh-1': { title: 'Tụng một thời kinh', stat: 'kinh', target: 1, reward: 50 },
  'hoa-dang-1': { title: 'Thả một chiếc đèn hoa đăng', stat: 'hoaDang', target: 1, reward: 20 },
  'nghe-1': { title: 'Nghe một câu chuyện trên núi', stat: 'nghe', target: 1, reward: 20 },
  'bia-1': { title: 'Tìm và đọc một bia pháp ngữ', stat: 'bia', target: 1, reward: 30 },
  'rac-10': { title: 'Nhặt 10 món rác ở chân núi', stat: 'rac', target: 10, reward: 35 },
  'tra-3': { title: 'Mời trà ba khách hành hương', stat: 'tra', target: 3, reward: 40 },
}

const QUEST_IDS = Object.keys(QUESTS)

/** Hàm băm chuỗi đơn giản (FNV-1a) — để nhiệm vụ ổn định theo ngày */
export function hashString(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** 4 nhiệm vụ cho một ngày: luôn có 1 việc niệm Phật + 3 việc khác loại, không trùng thống kê. */
export function dailyQuestsFor(dateKey, count = 4) {
  let seed = hashString(dateKey)
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const picked = [rand() < 0.6 ? 'niem-108' : 'niem-324']
  const usedStats = new Set(['niem'])
  const pool = QUEST_IDS.filter((id) => QUESTS[id].stat !== 'niem')
  while (picked.length < count && pool.length) {
    const id = pool.splice(Math.floor(rand() * pool.length), 1)[0]
    if (usedStats.has(QUESTS[id].stat)) continue
    usedStats.add(QUESTS[id].stat)
    picked.push(id)
  }
  return picked
}
