import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../components/ui/Toast'
import { getState } from '../../lib/store'
import { todayKey } from '../../lib/date'
import NiemPhat from '../../pages/NiemPhat'
import { PREFS_KEY, saveSession } from './storage'

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <NiemPhat />
      </ToastProvider>
    </MemoryRouter>,
  )
}

const pad = () => screen.getByRole('button', { name: /^Lần hạt/ })
const todayNiem = () => getState().logs[todayKey()]?.niem ?? 0

function tapN(n) {
  const el = pad()
  for (let i = 0; i < n; i++) fireEvent.click(el)
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Trang Niệm Phật', () => {
  it('hiển thị câu niệm mặc định và đếm khi chạm vùng lần hạt', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Niệm Phật' })).toBeInTheDocument()
    expect(within(pad()).getByText('Nam mô A Di Đà Phật')).toBeInTheDocument()
    tapN(3)
    expect(pad()).toHaveAccessibleName(/Đã niệm 3 câu, hạt 3 trên 108/)
  })

  it('ghi số câu vào nhật ký khi rời trang (không mất số đếm)', () => {
    const { unmount } = renderPage()
    tapN(5)
    expect(todayNiem()).toBe(0)
    unmount()
    expect(todayNiem()).toBe(5)
  })

  it('tự ghi định kỳ sau khoảng 2 giây', () => {
    vi.useFakeTimers()
    renderPage()
    tapN(4)
    act(() => {
      vi.advanceTimersByTime(2100)
    })
    expect(todayNiem()).toBe(4)
  })

  it('tròn chuỗi 21 hạt thì ghi ngay và báo tròn chuỗi', () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ size: 21 }))
    renderPage()
    tapN(21)
    expect(todayNiem()).toBe(21)
    expect(pad()).toHaveAccessibleName(/hạt 0 trên 21, 1 vòng/)
    expect(screen.getAllByText(/Tròn chuỗi thứ 1/).length).toBeGreaterThan(0)
  })

  it('kết thúc phiên lưu lịch sử mà không cộng trùng vào ngày', () => {
    renderPage()
    tapN(7)
    fireEvent.click(screen.getByRole('button', { name: /Kết thúc phiên/ }))
    const s = getState().sessions[0]
    expect(s).toMatchObject({ type: 'niem', count: 7, ref: 'Nam mô A Di Đà Phật' })
    expect(todayNiem()).toBe(7)
    expect(pad()).toHaveAccessibleName(/Đã niệm 0 câu/)
    expect(screen.getByText(/Đã lưu phiên niệm Phật/)).toBeInTheDocument()
  })

  it('đặt lại chuỗi đưa về hạt mẫu nhưng giữ số câu', () => {
    renderPage()
    tapN(10)
    fireEvent.click(screen.getByRole('button', { name: /Đặt lại chuỗi/ }))
    expect(pad()).toHaveAccessibleName(/Đã niệm 10 câu, hạt 0 trên 108/)
  })

  it('lần hạt bằng phím Space khi không focus vào ô nào', () => {
    renderPage()
    fireEvent.keyDown(document.body, { key: ' ' })
    fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(pad()).toHaveAccessibleName(/Đã niệm 2 câu/)
  })

  it('khôi phục phiên đang dở và ghi bù số câu chưa lưu', () => {
    saveSession({ total: 12, bead: 12, rounds: 0, pending: 3, activeMs: 9000, startedAt: Date.now() - 10_000, lastAt: Date.now() - 1000 })
    renderPage()
    expect(todayNiem()).toBe(3)
    expect(pad()).toHaveAccessibleName(/Đã niệm 12 câu/)
    expect(screen.getByText('Tiếp tục phiên đang dở')).toBeInTheDocument()
  })

  it('đổi câu niệm và ghi vào hồ sơ', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /đổi câu niệm/ }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('radio', { name: /Địa Tạng Vương/ }))
    expect(getState().profile.mantra).toBe('Nam mô Địa Tạng Vương Bồ Tát')
    expect(within(pad()).getByText('Nam mô Địa Tạng Vương Bồ Tát')).toBeInTheDocument()
  })

  it('chế độ nhịp mõ tự đếm theo BPM và dừng được', () => {
    vi.useFakeTimers()
    localStorage.setItem(PREFS_KEY, JSON.stringify({ mode: 'mo', bpm: 60 }))
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu niệm theo mõ/ }))
    act(() => {
      vi.advanceTimersByTime(3050)
    })
    // Nhịp đầu phát ngay khi bấm + 3 nhịp trong 3 giây
    expect(screen.getByRole('button', { name: /Đã niệm 4 câu/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Tạm dừng$/ }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('button', { name: /Đã niệm 4 câu/ })).toBeInTheDocument()
  })
})
