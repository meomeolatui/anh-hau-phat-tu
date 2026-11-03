import { describe, expect, it } from 'vitest'
import { NGU_CUNG, ROOT_MIDI, midiToHz, musicEnabled, nguCungMidi, startMusic, stopMusic } from './music'

describe('nhạc nền', () => {
  it('thang ngũ cung: Hò Xự Xang Xê Cống, lên quãng tám đúng', () => {
    expect(NGU_CUNG).toEqual([0, 2, 5, 7, 9])
    expect(nguCungMidi(0)).toBe(ROOT_MIDI)
    expect(nguCungMidi(5)).toBe(ROOT_MIDI + 12)
    expect(nguCungMidi(-1)).toBe(ROOT_MIDI - 12 + 9)
    expect(NGU_CUNG).toHaveLength(5)
    expect(midiToHz(69)).toBeCloseTo(440)
  })

  it('tôn trọng cài đặt âm thanh', () => {
    expect(musicEnabled({ sound: true, bgm: true })).toBe(true)
    expect(musicEnabled({ sound: false, bgm: true })).toBe(false)
    expect(musicEnabled({ sound: true, bgm: false })).toBe(false)
    // Chế độ YouTube: trình phát nhúng phát nhạc, bộ tự soạn im lặng
    expect(musicEnabled({ sound: true, bgm: true, bgmSource: 'youtube' })).toBe(false)
  })

  it('không lỗi khi môi trường không có âm thanh (jsdom)', () => {
    expect(() => {
      startMusic()
      stopMusic()
    }).not.toThrow()
  })
})
