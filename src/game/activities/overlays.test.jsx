import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import LePhat from './LePhat'
import ThinhChuong from './ThinhChuong'
import ThienDinh from './ThienDinh'
import TungKinh from './TungKinh'
import HoaDang from './HoaDang'
import HoiChuyen from './HoiChuyen'
import CapTreo from './CapTreo'
import { getGame } from '../state'
import { runtime } from '../runtime'
import { DIALOGUES } from '../dialogues'
import { heardKey } from './hoiChuyenLogic'
import { stepRide } from '../ride'

const base = { name: 'Thử', stand: [0, 0, 0], face: [0, 0, -3] }

describe('Overlay hoạt động (khói)', () => {
  it('Lễ Phật: chọn số lạy rồi vào màn lạy', () => {
    render(<LePhat params={{ altarId: 'a', ...base }} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('radio', { name: /9 lạy/ }))
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu lễ/ }))
    expect(screen.getAllByRole('button', { name: /Lạy/ }).length).toBeGreaterThan(0)
    expect(runtime.player.locked).toBe(true)
  })

  it('Thỉnh chuông: hiện kệ chuông và nút kéo chày', () => {
    render(<ThinhChuong params={{ towerId: 't', ...base }} onClose={() => {}} />)
    expect(screen.getByText(/Văn chung thanh/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /kéo chày/ })).toBeInTheDocument()
  })

  it('Thiền: không bay camera ra xa (giữ khung hình gần thấy nhân vật); có lựa chọn thời thiền dài', () => {
    const { unmount } = render(<ThienDinh params={{ seatId: 's', sessions: [5, 15, 30, 60], ...base }} onClose={() => {}} />)
    expect(screen.getByRole('radio', { name: /60/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu thiền/ }))
    expect(runtime.camera.focus).toBeNull()
    unmount()
  })

  it('Tụng kinh: chọn Tâm Kinh hiện cuộn kinh', () => {
    render(<TungKinh params={{ lecternId: 'k', ...base }} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Bát Nhã Tâm Kinh/ }))
    expect(screen.getByText(/Quán Tự Tại Bồ Tát/)).toBeInTheDocument()
  })

  it('Hoa đăng: thả đèn lưu lời nguyện + màu, cộng thống kê', () => {
    render(<HoaDang params={{ pondId: 'chan-nui', stand: [0, 0, 0], face: [0, 0, 1] }} onClose={() => {}} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Nguyện bình an' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Vàng nghệ' }))
    fireEvent.click(screen.getByRole('button', { name: /Thả đèn/ }))
    const save = getGame().save
    expect(save.lanterns[0]).toMatchObject({ text: 'Nguyện bình an', pondId: 'chan-nui', color: 'vang-nghe' })
    expect(save.stats.hoaDang).toBe(1)
    expect(save.merit).toBe(10)
  })

  it('Hội thoại: nghe trọn một chủ đề lần đầu được ghi nhận', () => {
    vi.useFakeTimers()
    try {
      render(<HoiChuyen params={{ npcId: 'n', name: 'Chú tiểu Minh An', title: 'dẫn đường', dialogueId: 'chao-mung', face: [0, 0, -2] }} onClose={() => {}} />)
      const topic = DIALOGUES['chao-mung'].topics[0]
      fireEvent.click(screen.getByRole('button', { name: new RegExp(topic.label.slice(0, 10)) }))
      for (let i = 0; i < topic.lines.length * 2 + 2; i++) {
        const btn = screen.queryByRole('button', { name: /^(Tiếp|Hiện hết|Cảm ơn, mình hiểu rồi)$/ })
        if (!btn) break
        fireEvent.click(btn)
        act(() => vi.advanceTimersByTime(50))
      }
      const save = getGame().save
      expect(save.stats.nghe).toBe(1)
      expect(save.cooldowns[heardKey('chao-mung', topic.id)]).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })

  it('đủ 6 hội thoại, mỗi cái 3–5 chủ đề', () => {
    for (const id of ['chao-mung', 'nghi-chan', 'su-thay-chua-ba', 'chua-hang', 'dinh-nui', 'le-nghi']) {
      const d = DIALOGUES[id]
      expect(d?.greeting, id).toBeTruthy()
      expect(d.topics.length, id).toBeGreaterThanOrEqual(3)
      expect(d.topics.length, id).toBeLessThanOrEqual(5)
      for (const t of d.topics) expect(t.lines.length, `${id}/${t.id}`).toBeGreaterThan(0)
    }
  })

  it('Cáp treo: không chọn được ga đang đứng; lên cabin thì bắt đầu chuyến, chạy hết thì xuống đúng ga đến', () => {
    vi.useFakeTimers()
    let closed = false
    try {
      render(<CapTreo params={{ from: 'chan-nui' }} onClose={() => (closed = true)} />)
      expect(screen.getByRole('radio', { name: /Ga chân núi/ })).toBeDisabled()
      fireEvent.click(screen.getByRole('radio', { name: /Ga đỉnh núi/ }))
      fireEvent.click(screen.getByRole('button', { name: /Lên cabin/ }))
      expect(closed).toBe(true)
      // startRide chạy ở frame kế tiếp (sau khi bảng đóng)
      act(() => vi.advanceTimersByTime(50))
      expect(runtime.player.ride?.to).toBe('dinh-nui')
      expect(runtime.player.ride.legs).toHaveLength(2)
      expect(getGame().save.stats.capTreo).toBe(1)
      // Chạy hết chuyến → xuống ga đỉnh núi
      for (let i = 0; i < 4000 && runtime.player.ride; i++) stepRide(0.05)
      expect(runtime.player.ride).toBeNull()
      expect(runtime.player.position.toArray()).toEqual([20, 56, -228])
    } finally {
      runtime.player.ride = null
      runtime.player.locked = false
      vi.useRealTimers()
    }
  })
})
