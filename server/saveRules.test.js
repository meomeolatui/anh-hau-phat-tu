// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEFAULT_SAVE } from '../src/game/saveDefaults.js'
import { IMPORT_CAPS, RATES, fullBuckets, importLocal, purchaseCost, sanitize, validateSave } from './saveRules.js'

const base = () => structuredClone({ ...DEFAULT_SAVE, profile: { name: 'Thử', role: 'phat-tu' } })
const T0 = 1_000_000

describe('kiểm tra bản lưu trên máy chủ', () => {
  it('chơi bình thường: công đức, xu tăng vừa phải được giữ nguyên', () => {
    const prev = base()
    const next = { ...base(), merit: 50, xu: prev.xu + 3, stats: { ...prev.stats, rac: 3 } }
    const r = validateSave(prev, next, fullBuckets(T0), T0 + 10_000)
    expect(r.fixed).toEqual([])
    expect(r.save.merit).toBe(50)
    expect(r.save.xu).toBe(prev.xu + 3)
  })

  it('công đức không được giảm, không tăng nhanh hơn tốc độ cho phép', () => {
    const prev = { ...base(), merit: 100 }
    expect(validateSave(prev, { ...base(), merit: 10 }, fullBuckets(T0), T0).save.merit).toBe(100)
    const r = validateSave(prev, { ...base(), merit: 999_999 }, fullBuckets(T0), T0)
    expect(r.fixed).toContain('cong-duc-qua-nhanh')
    expect(r.save.merit).toBe(100 + RATES.merit.cap)
    // Xô đã cạn: lần gửi ngay sau đó không được cộng thêm
    const r2 = validateSave(r.save, { ...r.save, merit: r.save.merit + 50 }, r.buckets, T0)
    expect(r2.save.merit).toBe(r.save.merit)
  })

  it('xô nạp lại theo thời gian: treo máy thiền 60 phút được nhận trọn 600 công đức', () => {
    const empty = { merit: 0, xu: 0, at: T0 }
    const r = validateSave(base(), { ...base(), merit: 600 }, empty, T0 + 60 * 60_000)
    expect(r.save.merit).toBe(600)
  })

  it('xu tăng quá nhanh bị chặn', () => {
    const prev = base()
    const r = validateSave(prev, { ...base(), xu: 5000 }, fullBuckets(T0), T0)
    expect(r.fixed).toContain('xu-qua-nhanh')
    expect(r.save.xu).toBe(prev.xu + RATES.xu.cap)
  })

  it('mua đồ: trừ xu đúng giá thì hợp lệ; tự thêm đồ không trả xu thì bị huỷ', () => {
    const prev = { ...base(), xu: 100 }
    const bought = { ...prev, xu: 100 - 25, wardrobe: { owned: ['ca-sa-do'], costume: 'ca-sa-do', hat: null } }
    const ok = validateSave(prev, bought, { merit: 0, xu: 0, at: T0 }, T0)
    expect(ok.fixed).toEqual([])
    expect(ok.save.wardrobe.costume).toBe('ca-sa-do')

    const cheat = { ...prev, xu: 100, wardrobe: { owned: ['te-thien', 'mao-te-thien'], costume: 'te-thien', hat: 'mao-te-thien' } }
    const bad = validateSave(prev, cheat, { merit: 0, xu: 0, at: T0 }, T0)
    expect(bad.fixed).toContain('mua-khong-du-xu')
    expect(bad.save.wardrobe.owned).toEqual([])
    expect(bad.save.wardrobe.costume).toBeNull()
    expect(bad.save.xu).toBe(100)
  })

  it('túi đồ chỉ tăng bằng cách mua; dùng bớt thì luôn được', () => {
    const prev = { ...base(), xu: 0 }
    const r = validateSave(prev, { ...prev, inventory: { nhang: 99, hoa: 0, den: 0 } }, { merit: 0, xu: 0, at: T0 }, T0)
    expect(r.save.inventory.nhang).toBe(prev.inventory.nhang)
    const used = validateSave(prev, { ...prev, inventory: { ...prev.inventory, nhang: 1 } }, { merit: 0, xu: 0, at: T0 }, T0)
    expect(used.save.inventory.nhang).toBe(1)
    expect(purchaseCost(prev, { ...sanitize(prev), inventory: { ...prev.inventory, nhang: prev.inventory.nhang + 3 } })).toBe(3)
  })

  it('chuẩn hoá: trường lạ, kiểu sai, mảng quá dài, đồ không tồn tại', () => {
    const s = sanitize({ merit: -5, xu: 'nhiều', hack: 1, wardrobe: { owned: ['khong-co', 'non-la'], hat: 'khong-co' }, lanterns: new Array(100).fill({}) })
    expect(s.merit).toBe(0)
    expect(s.xu).toBe(0)
    expect(s.hack).toBeUndefined()
    expect(s.wardrobe.owned).toEqual(['non-la'])
    expect(s.wardrobe.hat).toBeNull()
    expect(s.lanterns).toHaveLength(30)
  })

  it('lần đầu đăng nhập mang theo tiến trình chơi một mình nhưng có giới hạn', () => {
    const s = importLocal({ ...base(), merit: 1e9, xu: 1e9, wardrobe: { owned: ['non-la'], costume: null, hat: 'non-la' } })
    expect(s.merit).toBe(IMPORT_CAPS.merit)
    expect(s.xu).toBe(IMPORT_CAPS.xu)
    expect(s.wardrobe.hat).toBe('non-la')
  })
})
