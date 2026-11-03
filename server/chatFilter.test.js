// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { cleanChat, isProfane } from './chatFilter.js'

describe('lọc lời lẽ trong chat', () => {
  it('che từ thô tục, kể cả viết tắt, lặp chữ, chèn dấu chấm', () => {
    for (const t of ['đéo', 'ĐÉOOOO', 'đ.ị.t', 'dm', 'vcl quá', 'thằng óc chó', 'loz']) expect(isProfane(t), t).toBe(true)
    expect(cleanChat('đẹp vcl')).toBe('đẹp ***')
  })

  it('KHÔNG che từ thường dễ trùng khi bỏ dấu', () => {
    for (const t of ['chùa lớn quá', 'các bạn ơi', 'buổi sáng an lành', 'đeo nón lá', 'dù mà mệt vẫn leo', 'cái đĩa', 'lon nước ngọt', 'A Di Đà Phật'])
      expect(isProfane(t), t).toBe(false)
  })

  it('giữ dấu và emoji, gộp khoảng trắng, cắt độ dài, bỏ ký tự điều khiển', () => {
    expect(cleanChat('  Chúc   bình an 🙏 \n')).toBe('Chúc bình an 🙏')
    expect(cleanChat('a'.repeat(500), 140)).toHaveLength(140)
    expect(cleanChat('xin\u0007chào')).toBe('xin chào')
  })
})
