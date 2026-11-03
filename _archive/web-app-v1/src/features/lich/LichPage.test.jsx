import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../components/ui/Toast'
import { getState } from '../../lib/store'
import { addGoodDeed } from '../../lib/actions'
import Lich from '../../pages/Lich'

function renderPage(path = '/lich') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Lich />
      </MemoryRouter>
    </ToastProvider>,
  )
}

const selectedCell = () => screen.getByRole('grid').querySelector('[role="gridcell"][aria-selected="true"] button')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Trang Lịch âm', () => {
  it('hiển thị lưới tháng và đánh dấu hôm nay', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Lịch âm & ngày chay' })).toBeInTheDocument()
    const grid = screen.getByRole('grid')
    expect(within(grid).getAllByRole('row')).toHaveLength(7) // 1 hàng tiêu đề + 6 tuần
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(42)
    const today = grid.querySelector('[aria-current="date"]')
    expect(today).not.toBeNull()
    expect(today.getAttribute('tabindex')).toBe('0')
  })

  it('mở thẳng một ngày qua ?ngay= và hiện chi tiết ngày vía', () => {
    renderPage('/lich?ngay=2026-02-17')
    expect(screen.getByRole('button', { name: /Tháng 2, 2026/ })).toBeInTheDocument()
    expect(selectedCell()).toHaveAttribute('data-key', '2026-02-17')
    expect(screen.getByRole('heading', { level: 2, name: '17 tháng 2, 2026' })).toBeInTheDocument()
    expect(screen.getAllByText('Mùng 1 tháng Giêng năm Bính Ngọ').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tết Nguyên Đán · Vía Phật Di Lặc').length).toBeGreaterThan(0)
  })

  it('bỏ qua tham số ngày không hợp lệ', () => {
    renderPage('/lich?ngay=2026-02-30')
    expect(screen.getByRole('grid').querySelector('[aria-current="date"]')).toHaveAttribute('tabindex', '0')
  })

  it('di chuyển ngày chọn bằng phím mũi tên, sang cả tháng khác', async () => {
    const user = userEvent.setup()
    renderPage('/lich?ngay=2026-02-28')
    selectedCell().focus()
    await user.keyboard('{ArrowRight}')
    expect(selectedCell()).toHaveAttribute('data-key', '2026-03-01')
    expect(screen.getByRole('button', { name: /Tháng 3, 2026/ })).toBeInTheDocument()
    expect(document.activeElement).toBe(selectedCell())
    await user.keyboard('{ArrowUp}')
    expect(selectedCell()).toHaveAttribute('data-key', '2026-02-22')
    await user.keyboard('{PageDown}')
    expect(selectedCell()).toHaveAttribute('data-key', '2026-03-22')
  })

  it('nút tháng trước/sau đổi tháng đang xem', async () => {
    const user = userEvent.setup()
    renderPage('/lich?ngay=2026-01-31')
    await user.click(screen.getByRole('button', { name: 'Tháng sau' }))
    expect(screen.getByRole('button', { name: /Tháng 2, 2026/ })).toBeInTheDocument()
    expect(selectedCell()).toHaveAttribute('data-key', '2026-02-28')
    await user.click(screen.getByRole('button', { name: 'Tháng trước' }))
    await user.click(screen.getByRole('button', { name: 'Tháng trước' }))
    expect(screen.getByRole('button', { name: /Tháng 12, 2025/ })).toBeInTheDocument()
  })

  it('chọn tháng/năm nhanh trong hộp thoại', async () => {
    const user = userEvent.setup()
    renderPage('/lich?ngay=2026-02-17')
    await user.click(screen.getByRole('button', { name: /chọn tháng, năm khác/ }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Năm sau' }))
    await user.click(within(dialog).getByRole('button', { name: 'Tháng 5' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tháng 5, 2027/ })).toBeInTheDocument()
  })

  it('đổi lối ăn chay ngay tại trang', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.selectOptions(screen.getByLabelText('Theo dõi ngày chay'), 'thap-trai')
    expect(getState().settings.fasting).toBe('thap-trai')
    expect(screen.getByRole('list', { name: 'Ngày chay trong tháng' }).children).toHaveLength(10)
  })

  it('hiện hoạt động tu tập của ngày được chọn', () => {
    addGoodDeed({ text: 'Đưa bà cụ qua đường' })
    renderPage()
    expect(screen.getByText('Đưa bà cụ qua đường')).toBeInTheDocument()
  })

  it('đổi Âm → Dương và báo lỗi tháng nhuận không tồn tại', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('radio', { name: /Âm → Dương/ }))
    const year = screen.getByLabelText('Năm âm lịch')
    await user.clear(year)
    await user.type(year, '2026')
    expect(screen.getByText('Thứ Ba, 17/02/2026')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Tháng nhuận'))
    expect(screen.getByText(/không có tháng 1 nhuận/)).toBeInTheDocument()
  })

  it('xuất tệp .ics bằng Blob', async () => {
    const user = userEvent.setup()
    const createObjectURL = vi.fn(() => 'blob:lich')
    const revokeObjectURL = vi.fn()
    // jsdom chưa có createObjectURL — gắn tạm rồi gỡ ở cuối test
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    renderPage()
    await user.click(screen.getByRole('button', { name: /Thêm vào lịch điện thoại/ }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Tải tệp lịch/ }))
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0]
    expect(blob.type).toBe('text/calendar;charset=utf-8')
    const text = await blob.text()
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(text).toContain('DTSTART;VALUE=DATE:')
    expect(click).toHaveBeenCalled()
    expect(await screen.findByText('Đã tạo tệp lịch')).toBeInTheDocument()
    delete URL.createObjectURL
    delete URL.revokeObjectURL
  })
})
