import { describe, expect, it, vi } from 'vitest'
import { shareOrCopy, sutraUrl } from './share'

const data = { title: 'Tâm Kinh', text: 'Tâm Kinh', url: 'https://x.vn/kinh/bat-nha-tam-kinh' }

describe('shareOrCopy', () => {
  it('dùng bảng chia sẻ của hệ thống khi có', async () => {
    const nav = { share: vi.fn().mockResolvedValue(undefined), clipboard: { writeText: vi.fn() } }
    await expect(shareOrCopy(data, nav)).resolves.toBe('shared')
    expect(nav.share).toHaveBeenCalledWith(data)
    expect(nav.clipboard.writeText).not.toHaveBeenCalled()
  })
  it('người dùng huỷ chia sẻ → không chép, không báo lỗi', async () => {
    const abort = Object.assign(new Error('huỷ'), { name: 'AbortError' })
    const nav = { share: vi.fn().mockRejectedValue(abort), clipboard: { writeText: vi.fn() } }
    await expect(shareOrCopy(data, nav)).resolves.toBe('cancelled')
    expect(nav.clipboard.writeText).not.toHaveBeenCalled()
  })
  it('chia sẻ lỗi khác → chép liên kết thay thế', async () => {
    const nav = { share: vi.fn().mockRejectedValue(new Error('NotAllowed')), clipboard: { writeText: vi.fn().mockResolvedValue() } }
    await expect(shareOrCopy(data, nav)).resolves.toBe('copied')
    expect(nav.clipboard.writeText).toHaveBeenCalledWith(data.url)
  })
  it('không có share lẫn clipboard → unsupported', async () => {
    await expect(shareOrCopy(data, {})).resolves.toBe('unsupported')
  })
  it('lỗi chép clipboard được ném ra cho nơi gọi xử lý', async () => {
    const nav = { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } }
    await expect(shareOrCopy(data, nav)).rejects.toThrow('denied')
  })
})

describe('sutraUrl', () => {
  it('ghép đường dẫn tuyệt đối tới bài kinh', () => {
    expect(sutraUrl('ke-hoi-huong', 'https://a.b')).toBe('https://a.b/kinh/ke-hoi-huong')
  })
})
