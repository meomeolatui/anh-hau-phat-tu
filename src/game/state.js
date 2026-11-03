import { useSyncExternalStore } from 'react'
import { todayKey } from '../lib/date'
import { emit, runtime } from './runtime'
import { dailyQuestsFor, levelFor, QUESTS } from './progression'
import { DEFAULT_SAVE, mergeDefaults } from './saveDefaults'

export { DEFAULT_SAVE, mergeDefaults }

/**
 * Trạng thái game lưu bền (localStorage) + trạng thái UI.
 * Dữ liệu "nóng" theo từng khung hình (vị trí nhân vật...) nằm ở runtime.js, không ở đây.
 *
 * Quy ước: selector của useGame phải trả về tham chiếu sẵn có hoặc giá trị nguyên thuỷ.
 */

export const STORAGE_KEY = 'ahpt-game:v1'

const DEFAULT_UI = {
  screen: 'title', // 'title' | 'create' | 'game'
  activity: null, // { id, params }
  prompt: null, // { id, label, verb } tương tác gần nhất
  zone: null, // { id, name }
  panel: null, // 'menu' | 'quests' | 'map' | 'help' | null
  holding: null, // 'broom' khi đang cầm chổi quét lá · 'tea' khi bưng khay trà
  teaCups: 0, // số chén trà còn trên khay
  tryOn: null, // { costume?, hat? } đồ đang mặc thử ở sạp y phục (chưa mua) — chỉ hiển thị, không lưu
  chat: false, // đang mở ô chat (online)
  emotes: false, // đang mở bảng biểu cảm
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return mergeDefaults(DEFAULT_SAVE, raw ? JSON.parse(raw) : null)
  } catch (err) {
    console.error('[game] Không đọc được dữ liệu lưu, dùng mặc định.', err)
    return structuredClone(DEFAULT_SAVE)
  }
}

let state = { save: load(), ui: { ...DEFAULT_UI } }
const listeners = new Set()
let persistTimer = null
/** 'local' = lưu localStorage (chơi một mình) · 'server' = chơi online, máy chủ giữ bản lưu (net/online.js đồng bộ) */
let persistMode = 'local'

function persistSoon() {
  // Gom nhiều thay đổi liên tiếp (vd. quét lá) thành một lần ghi
  clearTimeout(persistTimer)
  persistTimer = setTimeout(persistNow, 400)
}

export function persistNow() {
  clearTimeout(persistTimer)
  if (persistMode !== 'local') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.save))
  } catch (err) {
    console.error('[game] Không lưu được dữ liệu.', err)
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', persistNow)
}

function set(next) {
  if (next === state) return
  const saveChanged = next.save !== state.save
  state = next
  if (saveChanged) persistSoon()
  listeners.forEach((l) => l())
}

export function getGame() {
  return state
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Hook đọc state: useGame((s) => s.save.merit) */
export function useGame(selector) {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}

/** Tương thích với lib/sound.js (đọc settings.sound / settings.haptics) */
export function getState() {
  return state.save
}

export function updateSave(fn) {
  set({ ...state, save: fn(state.save) })
}

export function updateUi(patch) {
  set({ ...state, ui: { ...state.ui, ...patch } })
}

/* ================= Chơi online: bản lưu từ máy chủ ================= */

export function getPersistMode() {
  return persistMode
}

/** Vào chế độ online: dùng bản lưu của máy chủ (không ghi đè bản chơi một mình trong localStorage) */
export function enterServerSave(save) {
  persistNow()
  persistMode = 'server'
  replaceSave(save)
}

/** Máy chủ gửi bản lưu chuẩn (lúc vào hoặc khi sửa bản vượt luật) → thay toàn bộ, giữ trạng thái giao diện */
export function replaceSave(save) {
  set({ ...state, save: mergeDefaults(DEFAULT_SAVE, save) })
}

/** Thoát online (đăng xuất / chơi một mình): quay lại bản lưu trên máy */
export function leaveServerSave() {
  if (persistMode === 'local') return
  persistMode = 'local'
  set({ ...state, save: load() })
}

/* ================= Hồ sơ & màn hình ================= */

export function setScreen(screen) {
  updateUi({ screen })
}

export function createProfile(profile) {
  updateSave((s) => ({ ...s, profile: { ...profile, createdAt: new Date().toISOString() } }))
  ensureDaily()
  updateUi({ screen: 'game' })
}

export function updateProfile(patch) {
  updateSave((s) => ({ ...s, profile: { ...s.profile, ...patch } }))
}

export function updateSettings(patch) {
  updateSave((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

/* ================= Công đức, thống kê, nhiệm vụ ================= */

/**
 * Cộng công đức (điểm trò chơi) và hiện chữ nổi.
 * @param {number} amount
 * @param {string} label  vd. 'Thắp hương'
 * @param {[number,number,number]} [position] vị trí thế giới để hiện chữ nổi
 */
export function addMerit(amount, label, position) {
  if (!Number.isFinite(amount) || amount <= 0) return
  const before = levelFor(state.save.merit)
  updateSave((s) => ({ ...s, merit: s.merit + Math.round(amount) }))
  emit('merit', { amount: Math.round(amount), label, position })
  const after = levelFor(state.save.merit)
  if (after.index > before.index) emit('levelup', after)
}

/** Tăng bộ đếm hoạt động + cập nhật tiến độ nhiệm vụ ngày có liên quan. */
export function addStat(key, n = 1) {
  if (!(key in DEFAULT_SAVE.stats)) throw new Error(`Không có thống kê "${key}"`)
  ensureDaily()
  updateSave((s) => {
    const list = s.daily.list.map((q) => {
      const def = QUESTS[q.id]
      if (!def || def.stat !== key || q.progress >= def.target) return q
      const progress = Math.min(def.target, q.progress + n)
      if (progress >= def.target) emit('quest-done', def)
      return { ...q, progress }
    })
    return { ...s, stats: { ...s.stats, [key]: s.stats[key] + n }, daily: { ...s.daily, list } }
  })
}

/** Tạo nhiệm vụ cho ngày hôm nay nếu chưa có. */
export function ensureDaily(dateKey = todayKey()) {
  if (state.save.daily.dateKey === dateKey) return
  const list = dailyQuestsFor(dateKey).map((id) => ({ id, progress: 0, claimed: false }))
  updateSave((s) => ({ ...s, daily: { dateKey, list } }))
}

export function claimQuest(id) {
  const q = state.save.daily.list.find((x) => x.id === id)
  const def = QUESTS[id]
  if (!q || !def || q.claimed || q.progress < def.target) return false
  updateSave((s) => ({
    ...s,
    daily: { ...s.daily, list: s.daily.list.map((x) => (x.id === id ? { ...x, claimed: true } : x)) },
  }))
  addMerit(def.reward, `Hoàn thành: ${def.title}`)
  return true
}

/* ================= Xu & túi đồ ================= */

/** Nhận xu (công quả). Hiện chữ nổi giống công đức. */
export function addXu(amount, label, position) {
  if (!Number.isFinite(amount) || amount <= 0) return
  updateSave((s) => ({ ...s, xu: s.xu + Math.round(amount) }))
  emit('xu', { amount: Math.round(amount), label, position })
}

/** Trả xu; trả về false nếu không đủ */
export function spendXu(amount) {
  if (!Number.isFinite(amount) || amount <= 0 || state.save.xu < amount) return false
  updateSave((s) => ({ ...s, xu: s.xu - amount }))
  return true
}

export function addItem(key, n = 1) {
  if (!(key in DEFAULT_SAVE.inventory)) throw new Error(`Không có vật phẩm "${key}"`)
  updateSave((s) => ({ ...s, inventory: { ...s.inventory, [key]: s.inventory[key] + n } }))
}

/** Dùng vật phẩm; trả về false nếu không đủ */
export function consumeItem(key, n = 1) {
  if ((state.save.inventory[key] ?? 0) < n) return false
  updateSave((s) => ({ ...s, inventory: { ...s.inventory, [key]: s.inventory[key] - n } }))
  return true
}

/** Mua `qty` gói vật phẩm với giá mỗi gói `price` xu, mỗi gói có `pack` đơn vị */
export function buyItem(key, { price, pack = 1 }, qty = 1) {
  if (!spendXu(price * qty)) return false
  addItem(key, pack * qty)
  return true
}

/* ================= Tủ đồ (trang phục, mũ mão) ================= */

/** Mua một món y phục (slot 'costume' | 'hat') rồi mặc luôn; false nếu thiếu xu hoặc đã có */
export function buyWear(slot, id, price) {
  if (state.save.wardrobe.owned.includes(id)) return false
  if (!spendXu(price)) return false
  updateSave((s) => ({ ...s, wardrobe: { ...s.wardrobe, owned: [...s.wardrobe.owned, id], [slot]: id } }))
  return true
}

/** Mặc / đội món đã có (id = null: cởi ra, về đồ thường) */
export function equipWear(slot, id) {
  if (id && !state.save.wardrobe.owned.includes(id)) return false
  updateSave((s) => ({ ...s, wardrobe: { ...s.wardrobe, [slot]: id } }))
  return true
}

/** Mặc thử (không lưu); null = thôi thử */
export function setTryOn(tryOn) {
  updateUi({ tryOn })
}

/* ================= Khám phá, thời gian hồi ================= */

export function discoverZone(id) {
  if (state.save.discovered.zones.includes(id)) return false
  updateSave((s) => ({ ...s, discovered: { ...s.discovered, zones: [...s.discovered.zones, id] } }))
  return true
}

export function discoverStele(id) {
  if (state.save.discovered.steles.includes(id)) return false
  updateSave((s) => ({ ...s, discovered: { ...s.discovered, steles: [...s.discovered.steles, id] } }))
  addStat('bia')
  return true
}

/** Còn bao nhiêu mili-giây nữa mới làm lại được việc `key` (0 = làm được). */
export function cooldownLeft(key, ms, now = Date.now()) {
  const at = state.save.cooldowns[key]
  if (!at) return 0
  return Math.max(0, new Date(at).getTime() + ms - now)
}

export function markCooldown(key, now = new Date()) {
  updateSave((s) => ({ ...s, cooldowns: { ...s.cooldowns, [key]: now.toISOString() } }))
}

/** Thả đèn hoa đăng trên hồ `pondId` (giữ 12 đèn gần nhất) */
export function addLantern(text, pondId = 'chan-nui') {
  const lantern = { id: `${Date.now().toString(36)}`, pondId, text: String(text || '').slice(0, 120), at: new Date().toISOString() }
  updateSave((s) => ({ ...s, lanterns: [lantern, ...s.lanterns].slice(0, 12) }))
  return lantern
}

export function saveLastPosition(pos) {
  updateSave((s) => ({ ...s, lastPosition: pos }))
}

/* ================= Hoạt động & bảng ================= */

/** Mở một hoạt động (overlay) — xem activities/index.js */
export function startActivity(id, params = {}) {
  updateUi({ activity: { id, params }, panel: null })
}

export function endActivity() {
  updateUi({ activity: null })
}

/** Cầm/cất đồ (hiện chỉ có chổi quét lá) — đồng bộ runtime (hoạt ảnh) và UI (nút trên HUD) */
export function setHolding(holding) {
  runtime.player.holding = holding
  updateUi({ holding })
}

export function openPanel(panel) {
  updateUi({ panel })
}

export function resetSave() {
  localStorage.removeItem(STORAGE_KEY)
  state = { save: structuredClone(DEFAULT_SAVE), ui: { ...DEFAULT_UI } }
  listeners.forEach((l) => l())
}

/** Chỉ dùng trong test */
export function __resetForTests() {
  clearTimeout(persistTimer)
  persistMode = 'local'
  state = { save: structuredClone(DEFAULT_SAVE), ui: { ...DEFAULT_UI } }
  listeners.forEach((l) => l())
}
