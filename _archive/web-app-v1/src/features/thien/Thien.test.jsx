import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../components/ui/Toast'
import { getState } from '../../lib/store'
import { todayKey } from '../../lib/date'
import Thien from '../../pages/Thien'
import { DEFAULT_PREFS, savePrefs } from './prefs'

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <Thien />
      </ToastProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Trang Thiền định', () => {
  it('hiển thị thiết lập, thống kê và trạng thái rỗng', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Thiền định' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Bắt đầu ngồi/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Thư giãn 4–7–8/ })).toBeInTheDocument()
    expect(screen.getByText('Chưa có buổi ngồi nào')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Biểu đồ số phút thiền/ })).toBeInTheDocument()
  })

  it('đổi thời lượng và kiểu thở thì lưu lại cho lần sau', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '30′' }))
    fireEvent.click(screen.getByRole('radio', { name: /Hộp 4–4–4–4/ }))
    const saved = JSON.parse(localStorage.getItem('ahpt:thien-prefs'))
    expect(saved).toMatchObject({ minutes: 30, pattern: 'hop-4-4-4-4' })
  })

  it('ngồi trọn buổi thì ghi nhật ký, chọn cảm nhận và nối ghi chú', () => {
    vi.useFakeTimers()
    savePrefs({ ...DEFAULT_PREFS, minutes: 1, prepSec: 0 })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu ngồi/ }))
    expect(screen.getByRole('dialog', { name: 'Đang ngồi thiền' })).toBeInTheDocument()
    expect(screen.getByText('Hít vào…')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(61_000)
    })

    expect(screen.getByText('Buổi ngồi đã trọn')).toBeInTheDocument()
    const key = todayKey()
    expect(getState().logs[key].thienMin).toBe(1)
    expect(getState().sessions[0]).toMatchObject({ type: 'thien', duration: 60 })

    fireEvent.click(screen.getByRole('radio', { name: 'An lạc' }))
    expect(getState().logs[key].mood).toBe(5)

    fireEvent.change(screen.getByLabelText(/Ghi chú ngắn/), { target: { value: 'Tâm lắng dịu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn tất' }))
    expect(getState().logs[key].note).toMatch(/Thiền 1 phút\] Tâm lắng dịu$/)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('tạm dừng thì đồng hồ đứng yên', () => {
    vi.useFakeTimers()
    savePrefs({ ...DEFAULT_PREFS, minutes: 5, prepSec: 0 })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu ngồi/ }))
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng' }))
    act(() => {
      vi.advanceTimersByTime(120_000)
    })
    expect(screen.getByRole('timer', { name: /Còn lại/ })).toHaveTextContent('04:50')
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeInTheDocument()
  })

  it('rời trang giữa chừng sau hơn 1 phút vẫn ghi lại phần đã ngồi', () => {
    vi.useFakeTimers()
    savePrefs({ ...DEFAULT_PREFS, minutes: 20, prepSec: 0 })
    const { unmount } = renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu ngồi/ }))
    act(() => {
      vi.advanceTimersByTime(3 * 60_000 + 5_000)
    })
    unmount()
    expect(getState().sessions[0]).toMatchObject({ type: 'thien', duration: 185 })
    expect(getState().logs[todayKey()].thienMin).toBe(3)
  })

  it('kết thúc sớm dưới 1 phút thì không ghi nhật ký', () => {
    vi.useFakeTimers()
    savePrefs({ ...DEFAULT_PREFS, minutes: 10, prepSec: 10 })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu ngồi/ }))
    expect(screen.getByText('Chuẩn bị')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu ngay/ }))

    act(() => {
      vi.advanceTimersByTime(20_000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc buổi ngồi' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('dưới 1 phút')
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc' }))

    expect(screen.getByText(/chưa ghi vào nhật ký/)).toBeInTheDocument()
    expect(getState().sessions).toHaveLength(0)
  })
})
