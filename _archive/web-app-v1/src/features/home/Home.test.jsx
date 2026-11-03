import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Home from '../../pages/Home'
import { addGoodDeed, addNiem, updateProfile, updateSettings } from '../../lib/actions'
import { getState } from '../../lib/store'
import { quoteOfDay } from '../../data/quotes'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Trang Hôm nay', () => {
  it('hiện lời chào, ngày âm lịch và đặt tiêu đề tài liệu', () => {
    updateProfile({ name: 'Minh An' })
    renderHome()
    expect(screen.getByRole('heading', { level: 1, name: 'Hôm nay' })).toBeInTheDocument()
    expect(screen.getByText('Minh An')).toBeInTheDocument()
    expect(screen.getByText(/^Ngày \d+ tháng .+ năm .+/)).toBeInTheDocument()
    expect(document.title).toContain('Hôm nay')
  })

  it('vòng thời khoá phản ánh nhật ký hôm nay', () => {
    addNiem(540)
    addGoodDeed({ text: 'Nhường ghế trên xe buýt' })
    renderHome()
    expect(screen.getByRole('progressbar', { name: /Niệm Phật: 540 trên 1\.080 câu/ })).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByRole('progressbar', { name: /Thiện hạnh: 1 trên 1 việc/ })).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByRole('link', { name: /Niệm tiếp/ })).toHaveAttribute('href', '/niem-phat')
  })

  it('chuỗi ngày tính cả hôm nay khi đã tu tập', () => {
    addNiem(10)
    renderHome()
    const strip = screen.getByRole('list', { name: /7 ngày gần nhất: 1 ngày có tu tập/ })
    expect(within(strip).getAllByRole('listitem')).toHaveLength(7)
  })

  it('hiện pháp ngữ hôm nay và cho lưu yêu thích', async () => {
    const user = userEvent.setup()
    renderHome()
    const quote = quoteOfDay(new Date())
    expect(screen.getByText(quote.text, { exact: false })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lưu lại' }))
    expect(getState().favorites.quotes).toContain(quote.id)
    expect(screen.getByRole('button', { name: 'Đã lưu' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('liệt kê 3 ngày lễ sắp tới và nhắc chọn lối chay khi chưa theo dõi', () => {
    updateSettings({ fasting: 'none' })
    renderHome()
    expect(screen.getAllByText(/âm lịch$/)).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Chọn trong Cài đặt' })).toHaveAttribute('href', '/ca-nhan#cai-dat')
  })

  it('có gợi ý ngữ cảnh và lối tắt tới các tính năng', () => {
    renderHome()
    expect(screen.getByText('Gợi ý cho bạn')).toBeInTheDocument()
    const nav = screen.getByRole('heading', { name: 'Khám phá' }).parentElement
    for (const href of ['/kinh', '/hanh-huong', '/hoc-phat', '/phap-ngu', '/nhat-ky', '/lich']) {
      expect(within(nav).getAllByRole('link').some((a) => a.getAttribute('href') === href)).toBe(true)
    }
  })
})
