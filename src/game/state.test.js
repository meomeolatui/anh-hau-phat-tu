import { describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEY,
  addLantern,
  addMerit,
  addStat,
  claimQuest,
  cooldownLeft,
  discoverStele,
  discoverZone,
  ensureDaily,
  getGame,
  markCooldown,
  mergeDefaults,
  persistNow,
} from './state'
import { dailyQuestsFor, levelFor, LEVELS, QUESTS } from './progression'
import { on } from './runtime'

describe('progression', () => {
  it('cấp độ theo công đức, có tiến độ tới cấp sau', () => {
    expect(levelFor(0)).toMatchObject({ index: 0, title: LEVELS[0].title })
    const lv = levelFor(200)
    expect(lv.index).toBe(1)
    expect(lv.progress).toBeCloseTo(0.5)
    expect(levelFor(999999).next).toBeNull()
  })

  it('nhiệm vụ ngày ổn định theo ngày, luôn có một việc niệm Phật, không trùng loại', () => {
    const a = dailyQuestsFor('2026-11-03')
    expect(dailyQuestsFor('2026-11-03')).toEqual(a)
    expect(a).toHaveLength(4)
    expect(QUESTS[a[0]].stat).toBe('niem')
    const stats = a.map((id) => QUESTS[id].stat)
    expect(new Set(stats).size).toBe(stats.length)
  })
})

describe('state — công đức & nhiệm vụ', () => {
  it('cộng công đức, phát sự kiện nổi chữ và lên cấp', () => {
    const merits = []
    const levels = []
    const off1 = on('merit', (m) => merits.push(m))
    const off2 = on('levelup', (l) => levels.push(l))
    addMerit(120, 'Thắp hương')
    off1()
    off2()
    expect(getGame().save.merit).toBe(120)
    expect(merits[0]).toMatchObject({ amount: 120, label: 'Thắp hương' })
    expect(levels[0].index).toBe(1)
  })

  it('bỏ qua công đức không hợp lệ', () => {
    addMerit(-5)
    addMerit(NaN)
    expect(getGame().save.merit).toBe(0)
  })

  it('thống kê làm tiến nhiệm vụ; nhận thưởng một lần khi xong', () => {
    ensureDaily('2026-11-03')
    const quest = getGame().save.daily.list[0]
    const def = QUESTS[quest.id]
    expect(claimQuest(quest.id)).toBe(false)
    addStat(def.stat, def.target + 50)
    expect(getGame().save.daily.list[0].progress).toBe(def.target)
    expect(claimQuest(quest.id)).toBe(true)
    expect(getGame().save.merit).toBe(def.reward)
    expect(claimQuest(quest.id)).toBe(false)
  })

  it('từ chối khoá thống kê không tồn tại', () => {
    expect(() => addStat('khong-co')).toThrow()
  })
})

describe('state — khám phá, thời gian hồi, lưu trữ', () => {
  it('khám phá khu vực và bia chỉ tính một lần', () => {
    expect(discoverZone('chua-ba')).toBe(true)
    expect(discoverZone('chua-ba')).toBe(false)
    expect(discoverStele('bia-cong')).toBe(true)
    expect(discoverStele('bia-cong')).toBe(false)
    expect(getGame().save.stats.bia).toBe(1)
  })

  it('thời gian hồi tính theo mốc đã đánh dấu', () => {
    const now = new Date('2026-11-03T08:00:00Z')
    markCooldown('huong:a', now)
    expect(cooldownLeft('huong:a', 600000, now.getTime() + 60000)).toBe(540000)
    expect(cooldownLeft('huong:a', 600000, now.getTime() + 700000)).toBe(0)
    expect(cooldownLeft('chua-co', 600000)).toBe(0)
  })

  it('đèn hoa đăng giữ hồ và giới hạn số lượng', () => {
    vi.useFakeTimers()
    for (let i = 0; i < 15; i++) {
      vi.advanceTimersByTime(10)
      addLantern(`Nguyện ${i}`, 'chua-ba')
    }
    vi.useRealTimers()
    const list = getGame().save.lanterns
    expect(list).toHaveLength(12)
    expect(list[0]).toMatchObject({ text: 'Nguyện 14', pondId: 'chua-ba' })
  })

  it('lưu xuống localStorage và trộn được dữ liệu cũ thiếu trường', () => {
    addMerit(10)
    persistNow()
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.merit).toBe(10)
    const merged = mergeDefaults(getGame().save, { merit: 5, stats: { niem: 3 } })
    expect(merged.stats).toMatchObject({ niem: 3, huong: 0 })
    expect(merged.settings.sound).toBe(true)
  })
})
