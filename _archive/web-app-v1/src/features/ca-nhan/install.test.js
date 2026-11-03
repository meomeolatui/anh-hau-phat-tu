import { describe, expect, it } from 'vitest'
import { installMode, isIOSDevice, isStandaloneDisplay } from './install'

describe('isIOSDevice', () => {
  it('nhận ra iPhone và iPad đời mới', () => {
    expect(isIOSDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' })).toBe(true)
    expect(isIOSDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true)
  })

  it('không nhầm với Android hay máy Mac', () => {
    expect(isIOSDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 14)' })).toBe(false)
    expect(isIOSDevice({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false)
    expect(isIOSDevice(null)).toBe(false)
  })
})

describe('isStandaloneDisplay', () => {
  it('đọc display-mode hoặc navigator.standalone của iOS', () => {
    expect(isStandaloneDisplay({ matchMedia: () => ({ matches: true }) })).toBe(true)
    expect(isStandaloneDisplay({ navigator: { standalone: true }, matchMedia: () => ({ matches: false }) })).toBe(true)
    expect(isStandaloneDisplay({ matchMedia: () => ({ matches: false }) })).toBe(false)
    expect(isStandaloneDisplay(null)).toBe(false)
  })
})

describe('installMode', () => {
  it('ưu tiên: đã cài → nút cài → hướng dẫn iOS → hướng dẫn chung', () => {
    expect(installMode({ installed: true, canPrompt: true, ios: true })).toBe('installed')
    expect(installMode({ installed: false, canPrompt: true, ios: false })).toBe('prompt')
    expect(installMode({ installed: false, canPrompt: false, ios: true })).toBe('ios')
    expect(installMode({ installed: false, canPrompt: false, ios: false })).toBe('manual')
  })
})
