import { describe, expect, it } from 'vitest'
import { backupFileName, dataSummary, formatBytes, isResetConfirmed } from './backup'
import { DEFAULT_STATE } from '../../lib/store'

describe('backupFileName', () => {
  it('đặt tên theo ngày địa phương', () => {
    expect(backupFileName(new Date(2026, 10, 2, 23, 59))).toBe('anh-hau-phat-tu-2026-11-02.json')
  })
})

describe('isResetConfirmed', () => {
  it('chỉ chấp nhận đúng chữ XOA (không phân biệt hoa thường, dấu)', () => {
    expect(isResetConfirmed('XOA')).toBe(true)
    expect(isResetConfirmed(' xoa ')).toBe(true)
    expect(isResetConfirmed('XOÁ')).toBe(true)
    expect(isResetConfirmed('xoá')).toBe(true)
    expect(isResetConfirmed('XO')).toBe(false)
    expect(isResetConfirmed('')).toBe(false)
    expect(isResetConfirmed(undefined)).toBe(false)
  })
})

describe('formatBytes', () => {
  it('đổi đơn vị dễ đọc', () => {
    expect(formatBytes(820)).toBe('820 B')
    expect(formatBytes(2048)).toBe('2 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3 MB')
    expect(formatBytes(-5)).toBe('0 B')
  })
})

describe('dataSummary', () => {
  it('đếm dữ liệu đang lưu', () => {
    const state = {
      ...DEFAULT_STATE,
      logs: { '2026-11-01': {}, '2026-11-02': {} },
      sessions: [{ id: 1 }],
      pilgrimage: { visited: { a: {} }, wishlist: [] },
    }
    expect(dataSummary(state)).toEqual({ days: 2, sessions: 1, vows: 0, visited: 1 })
  })
})
