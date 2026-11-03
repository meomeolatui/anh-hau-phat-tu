import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '../../components/ui/Toast'
import HanhHuong from '../../pages/HanhHuong'
import HanhHuongDetail from '../../pages/HanhHuongDetail'
import { TEMPLES } from '../../data/temples'
import { getState } from '../../lib/store'
import { markVisited } from '../../lib/actions'
import { todayKey } from '../../lib/date'

function renderAt(path) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/hanh-huong" element={<HanhHuong />} />
          <Route path="/hanh-huong/:id" element={<HanhHuongDetail />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('Trang Hành hương', () => {
  it('hiển thị thống kê và toàn bộ danh bạ', () => {
    renderAt('/hanh-huong')
    expect(screen.getByRole('heading', { level: 1, name: 'Hành hương' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: new RegExp(`Đã viếng 0/${TEMPLES.length}`) })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(TEMPLES.length)
    expect(screen.getByText(/Chưa có nơi nào/)).toBeInTheDocument()
  })

  it('tìm không dấu thu hẹp kết quả và báo trống khi không khớp', async () => {
    const user = userEvent.setup()
    renderAt('/hanh-huong')
    const search = screen.getByRole('searchbox', { name: 'Tìm chùa' })
    await user.type(search, 'thien mu')
    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Chùa Thiên Mụ' })).toBeInTheDocument()

    await user.type(search, ' xyz')
    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByText('Chưa tìm thấy ngôi chùa phù hợp')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Xoá bộ lọc' }))
    expect(screen.getAllByRole('article')).toHaveLength(TEMPLES.length)
  })

  it('đọc bộ lọc từ URL và lọc theo miền', () => {
    renderAt('/hanh-huong?mien=nam')
    const count = TEMPLES.filter((t) => t.region === 'nam').length
    expect(screen.getAllByRole('article')).toHaveLength(count)
    expect(screen.getByRole('radio', { name: 'Nam' })).toHaveAttribute('aria-checked', 'true')
  })

  it('bấm trái tim thêm vào danh sách Muốn đến', async () => {
    const user = userEvent.setup()
    renderAt('/hanh-huong')
    await user.click(screen.getByRole('button', { name: 'Thêm Chùa Hương vào danh sách Muốn đến' }))
    expect(getState().pilgrimage.wishlist).toEqual(['chua-huong'])
    const strip = screen.getByRole('region', { name: /Muốn đến/ })
    expect(within(strip).getByText('Chùa Hương')).toBeInTheDocument()
  })

  it('hiển thị nhật ký hành hương khi đã có chuyến đi', () => {
    markVisited('chua-thay', { date: '2026-03-15', note: 'Nghe tiếng chuông chiều' })
    renderAt('/hanh-huong')
    expect(screen.getByRole('heading', { name: 'Những nơi bạn đã đến' })).toBeInTheDocument()
    expect(screen.getByText(/Nghe tiếng chuông chiều/)).toBeInTheDocument()
  })
})

describe('Trang chi tiết chùa', () => {
  it('id không tồn tại → trạng thái rỗng', () => {
    renderAt('/hanh-huong/khong-co-chua-nay')
    expect(screen.getByText('Ngôi chùa này không có trong danh bạ')).toBeInTheDocument()
  })

  it('hiển thị thông tin và liên kết chỉ đường mở thẻ mới', () => {
    renderAt('/hanh-huong/chua-thien-mu')
    expect(screen.getByRole('heading', { level: 1, name: 'Chùa Thiên Mụ' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Chỉ đường/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link.getAttribute('href')).toContain('google.com/maps/search/?api=1&query=')
    expect(screen.getByRole('heading', { name: /Chùa gần đó|Cũng ở Huế/ })).toBeInTheDocument()
  })

  it('ghi dấu, sửa và gỡ ghi dấu chuyến đi', async () => {
    const user = userEvent.setup()
    renderAt('/hanh-huong/chua-tu-hieu')
    await user.type(screen.getByLabelText(/Cảm nhận/), 'Rừng thông rất yên')
    await user.click(screen.getByRole('button', { name: /Ghi dấu chuyến đi/ }))

    const visit = getState().pilgrimage.visited['chua-tu-hieu']
    expect(visit).toEqual({ date: todayKey(), note: 'Rừng thông rất yên' })
    expect(screen.getByText('Đã ghi dấu chuyến đi')).toBeInTheDocument()
    expect(screen.getByText('Rừng thông rất yên')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Gỡ ghi dấu' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Gỡ ghi dấu' }))
    expect(getState().pilgrimage.visited['chua-tu-hieu']).toBeUndefined()
  })

  it('không cho ghi ngày ở tương lai', async () => {
    const user = userEvent.setup()
    renderAt('/hanh-huong/chua-keo')
    const date = screen.getByLabelText('Ngày bạn đến')
    await user.clear(date)
    await user.type(date, '2999-01-01')
    await user.click(screen.getByRole('button', { name: /Ghi dấu chuyến đi/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/tương lai/)
    expect(getState().pilgrimage.visited['chua-keo']).toBeUndefined()
  })
})
