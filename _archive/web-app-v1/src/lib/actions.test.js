import { describe, expect, it } from 'vitest'
import {
  addGoodDeed,
  addNiem,
  exportData,
  importData,
  ImportError,
  markVisited,
  recordSession,
  removeGoodDeed,
  resetAll,
  toggleFavorite,
  toggleWishlist,
} from './actions'
import { getState, mergeDefaults, DEFAULT_STATE, STORAGE_KEY } from './store'
import { todayKey } from './date'

describe('actions', () => {
  it('cộng câu niệm vào ngày hôm nay và lưu localStorage', () => {
    addNiem(108)
    addNiem(54)
    expect(getState().logs[todayKey()].niem).toBe(162)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).logs[todayKey()].niem).toBe(162)
  })

  it('bỏ qua số câu niệm không hợp lệ', () => {
    addNiem(0)
    addNiem(NaN)
    expect(getState().logs[todayKey()]).toBeUndefined()
  })

  it('ghi phiên thiền và cộng phút vào ngày', () => {
    recordSession({ type: 'thien', duration: 600 })
    expect(getState().sessions[0]).toMatchObject({ type: 'thien', duration: 600 })
    expect(getState().logs[todayKey()].thienMin).toBe(10)
  })

  it('thêm và xoá thiện hạnh', () => {
    const deed = addGoodDeed({ text: '  Giúp mẹ nấu cơm  ', category: 'hieu' })
    expect(getState().logs[todayKey()].thienHanh[0].text).toBe('Giúp mẹ nấu cơm')
    removeGoodDeed(deed.id)
    expect(getState().logs[todayKey()].thienHanh).toHaveLength(0)
    expect(addGoodDeed({ text: '   ' })).toBeNull()
  })

  it('bật/tắt yêu thích', () => {
    toggleFavorite('quotes', 'q1')
    expect(getState().favorites.quotes).toEqual(['q1'])
    toggleFavorite('quotes', 'q1')
    expect(getState().favorites.quotes).toEqual([])
  })

  it('đánh dấu đã viếng sẽ gỡ khỏi danh sách muốn đi', () => {
    toggleWishlist('tran-quoc')
    markVisited('tran-quoc', { date: '2026-10-01' })
    expect(getState().pilgrimage.wishlist).toEqual([])
    expect(getState().pilgrimage.visited['tran-quoc'].date).toBe('2026-10-01')
  })

  it('sao lưu rồi khôi phục giữ nguyên dữ liệu', () => {
    addNiem(1080)
    const backup = exportData()
    resetAll()
    expect(getState().logs).toEqual({})
    importData(backup)
    expect(getState().logs[todayKey()].niem).toBe(1080)
  })

  it('từ chối file không hợp lệ', () => {
    expect(() => importData('không phải json')).toThrow(ImportError)
    expect(() => importData('{"foo":1}')).toThrow(ImportError)
  })
})

describe('mergeDefaults', () => {
  it('bổ sung field mới mà không ghi đè dữ liệu cũ', () => {
    const merged = mergeDefaults(DEFAULT_STATE, { profile: { name: 'Hậu' }, logs: { '2026-01-01': { niem: 1 } } })
    expect(merged.profile.name).toBe('Hậu')
    expect(merged.profile.goals.niem).toBe(1080)
    expect(merged.logs['2026-01-01'].niem).toBe(1)
    expect(merged.settings.theme).toBe('system')
  })
})
