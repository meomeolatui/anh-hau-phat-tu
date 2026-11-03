import { describe, expect, it, vi, afterEach } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import NhatKy from '../../pages/NhatKy'
import { ToastProvider } from '../../components/ui/Toast'
import { getState } from '../../lib/store'
import { addDaysKey, todayKey } from '../../lib/date'
import { addGoodDeed, addNiem, addVow, setDayNote } from '../../lib/actions'
import { SAVE_DELAY } from './ReflectionCard'

function renderPage(url = '/nhat-ky') {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/nhat-ky" element={<NhatKy />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

const today = () => getState().logs[todayKey()]

afterEach(() => {
  vi.useRealTimers()
})

describe('Trang Nhật ký — tab Hôm nay', () => {
  it('ghi một việc lành kèm nhóm đã chọn', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Nhật ký thiện hạnh' })).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Hiếu thảo' }))
    await user.type(screen.getByLabelText('Việc lành bạn đã làm'), 'Gọi điện cho mẹ{Enter}')
    expect(today().thienHanh).toHaveLength(1)
    expect(today().thienHanh[0]).toMatchObject({ text: 'Gọi điện cho mẹ', category: 'hieu-thao' })
    const list = screen.getByRole('list', { name: 'Danh sách việc lành' })
    expect(within(list).getByText('Gọi điện cho mẹ')).toBeInTheDocument()
  })

  it('xoá việc lành rồi hoàn tác', async () => {
    addGoodDeed({ text: 'Nhặt rác ở công viên', category: 'bao-ve-su-song' })
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Xoá việc lành: Nhặt rác ở công viên' }))
    expect(today().thienHanh).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: /Hoàn tác/ }))
    expect(today().thienHanh).toHaveLength(1)
    expect(today().thienHanh[0]).toMatchObject({ text: 'Nhặt rác ở công viên', category: 'bao-ve-su-song' })
  })

  it('bấm "Mình đã làm" ghi nhanh gợi ý và khoá nút', async () => {
    const user = userEvent.setup()
    renderPage()
    const buttons = screen.getAllByRole('button', { name: /^Mình đã làm:/ })
    expect(buttons).toHaveLength(3)
    await user.click(buttons[0])
    expect(today().thienHanh).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /^Đã ghi:/ })[0]).toBeDisabled()
  })

  it('chọn cảm nhận trong ngày', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('radio', { name: 'An lạc' }))
    expect(today().mood).toBe(5)
    await user.click(screen.getByRole('button', { name: 'Bỏ chọn' }))
    expect(today().mood).toBeNull()
  })

  it('ghi chú tự lưu sau khi ngừng gõ', () => {
    vi.useFakeTimers()
    renderPage()
    fireEvent.change(screen.getByLabelText('Ghi chú của bạn'), { target: { value: 'Hôm nay lòng nhẹ nhàng' } })
    expect(screen.getByText('Đang lưu…')).toBeInTheDocument()
    expect(today()?.note ?? '').toBe('')
    act(() => vi.advanceTimersByTime(SAVE_DELAY + 50))
    expect(today().note).toBe('Hôm nay lòng nhẹ nhàng')
    expect(screen.getByText('Đã lưu')).toBeInTheDocument()
  })

  it('mở ngày cũ từ URL và ghi vào đúng ngày đó', async () => {
    const yesterday = addDaysKey(todayKey(), -1)
    setDayNote('Ghi chú hôm qua', yesterday)
    const user = userEvent.setup()
    renderPage(`/nhat-ky?ngay=${yesterday}`)
    expect(screen.getByText('Đang xem ngày đã qua')).toBeInTheDocument()
    expect(screen.getByLabelText('Ghi chú của bạn')).toHaveValue('Ghi chú hôm qua')
    await user.type(screen.getByLabelText('Việc lành bạn đã làm'), 'Thăm bà{Enter}')
    expect(getState().logs[yesterday].thienHanh[0].text).toBe('Thăm bà')
    expect(today()).toBeUndefined()
    await user.click(screen.getByRole('button', { name: 'Về hôm nay' }))
    expect(screen.queryByText('Đang xem ngày đã qua')).not.toBeInTheDocument()
  })

  it('ngày tương lai trên URL quy về hôm nay', () => {
    renderPage(`/nhat-ky?ngay=${addDaysKey(todayKey(), 3)}`)
    expect(screen.queryByText('Đang xem ngày đã qua')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ngày sau' })).toBeDisabled()
  })
})

describe('Trang Nhật ký — tab Thống kê', () => {
  it('hiển thị số liệu, lịch nhiệt và dòng thời gian', async () => {
    addNiem(1080)
    addGoodDeed({ text: 'Nhường chỗ trên xe buýt', category: 'tu-bi' })
    setDayNote('Một ngày bình yên')
    const user = userEvent.setup()
    renderPage('/nhat-ky?tab=thong-ke')
    expect(screen.getByRole('radio', { name: 'Thống kê' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('grid', { name: /Lịch nhiệt/ })).toBeInTheDocument()
    expect(screen.getAllByText('1.080').length).toBeGreaterThan(0)
    expect(screen.getByText('Từ bi – giúp người')).toBeInTheDocument()
    expect(screen.getByText('Một ngày bình yên')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: '12 tháng' }))
    expect(screen.getByRole('radio', { name: '12 tháng' })).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getAllByRole('button', { name: /^Mở và chỉnh sửa nhật ký/ })[0])
    expect(screen.getByLabelText('Ghi chú của bạn')).toHaveValue('Một ngày bình yên')
  })

  it('trạng thái rỗng khi chưa có dữ liệu', () => {
    renderPage('/nhat-ky?tab=thong-ke')
    expect(screen.getByText('Trang nhật ký còn trắng')).toBeInTheDocument()
    expect(screen.getAllByText('Chưa có số liệu trong khoảng này').length).toBe(2)
  })
})

describe('Trang Nhật ký — tab Sổ nguyện', () => {
  it('viết lời hồi hướng từ mẫu rồi xoá có xác nhận', async () => {
    const user = userEvent.setup()
    renderPage('/nhat-ky?tab=so-nguyen')
    expect(screen.getByText('Sổ còn trống')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Hồi hướng' }))
    await user.click(screen.getByRole('button', { name: 'Cho cha mẹ' }))
    await user.click(screen.getByRole('button', { name: 'Lưu vào sổ' }))
    expect(getState().vows).toHaveLength(1)
    expect(getState().vows[0].type).toBe('hoi-huong')

    await user.click(screen.getByRole('button', { name: 'Xoá dòng này' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Xoá' }))
    expect(getState().vows).toHaveLength(0)
  })

  it('lọc theo loại', async () => {
    addVow({ text: 'Con nguyện nói lời hiền', type: 'nguyen' })
    addVow({ text: 'Con xin sám hối vì nóng giận', type: 'sam-hoi' })
    const user = userEvent.setup()
    renderPage('/nhat-ky?tab=so-nguyen')
    await user.click(screen.getByRole('radio', { name: 'Sám hối (1)' }))
    expect(screen.getByText('Con xin sám hối vì nóng giận')).toBeInTheDocument()
    expect(screen.queryByText('Con nguyện nói lời hiền')).not.toBeInTheDocument()
  })
})
