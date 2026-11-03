import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '../../components/ui/Toast'
import Kinh from '../../pages/Kinh'
import KinhDetail from '../../pages/KinhDetail'
import { getState } from '../../lib/store'
import { setBookmark, toggleFavorite } from '../../lib/actions'
import { getSutra } from '../../data/sutras'
import { lineSeconds } from './reader'

function renderAt(path) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/kinh" element={<Kinh />} />
          <Route path="/kinh/:id" element={<KinhDetail />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Trang thư viện /kinh', () => {
  it('hiển thị các bài và lọc theo từ khoá không dấu', () => {
    renderAt('/kinh')
    expect(screen.getByRole('heading', { level: 1, name: 'Kinh tụng' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kệ Sám Hối' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Tìm bài kinh, chú, kệ'), { target: { value: 'vang sanh' } })
    expect(screen.getByRole('link', { name: 'Chú Vãng Sanh' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Kệ Sám Hối' })).not.toBeInTheDocument()
  })

  it('báo trạng thái rỗng khi không có kết quả và cho xoá tìm kiếm', () => {
    renderAt('/kinh?q=khongcobainay')
    expect(screen.getByText('Chưa tìm thấy bài phù hợp')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xoá tìm kiếm & bộ lọc' }))
    expect(screen.getByRole('link', { name: 'Kệ Sám Hối' })).toBeInTheDocument()
  })

  it('lọc theo loại bằng nhóm lựa chọn', () => {
    renderAt('/kinh')
    const group = screen.getByRole('radiogroup', { name: 'Lọc theo loại bài' })
    fireEvent.click(within(group).getByRole('radio', { name: /^Chú/ }))
    expect(screen.getByRole('link', { name: 'Chú Vãng Sanh' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Bát Nhã Tâm Kinh' })).not.toBeInTheDocument()
  })

  it('có mục Đọc tiếp và Yêu thích khi có dữ liệu', () => {
    setBookmark('bat-nha-tam-kinh', 5)
    toggleFavorite('sutras', 'ke-hoi-huong')
    renderAt('/kinh')
    expect(screen.getByRole('heading', { name: 'Đọc tiếp' })).toBeInTheDocument()
    expect(screen.getByText(/Tiếp tục từ dòng 6\//)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bài yêu thích' })).toBeInTheDocument()
  })

  it('bấm tim trên thẻ để yêu thích', () => {
    renderAt('/kinh')
    fireEvent.click(screen.getAllByRole('button', { name: 'Thêm "Kệ Khai Kinh" vào yêu thích' })[0])
    expect(getState().favorites.sutras).toContain('ke-khai-kinh')
  })
})

describe('Trình đọc /kinh/:id', () => {
  it('id không tồn tại → trạng thái rỗng và nút quay lại', () => {
    renderAt('/kinh/khong-co-bai-nay')
    expect(screen.getByText('Bài kinh này chưa có trong thư viện')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Về thư viện kinh/ })).toHaveAttribute('href', '/kinh')
  })

  it('hiển thị kinh văn, đổi cỡ chữ và yêu thích', () => {
    renderAt('/kinh/bat-nha-tam-kinh')
    expect(screen.getByRole('heading', { level: 1, name: 'Bát Nhã Tâm Kinh' })).toBeInTheDocument()
    expect(screen.getByText(/Quán Tự Tại Bồ Tát hành thâm/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tăng cỡ chữ' }))
    expect(getState().settings.readerFontSize).toBe(22)

    fireEvent.click(screen.getByRole('button', { name: 'Thêm "Bát Nhã Tâm Kinh" vào yêu thích' }))
    expect(getState().favorites.sutras).toEqual(['bat-nha-tam-kinh'])
  })

  it('chuyển sang tab Lược giải', () => {
    renderAt('/kinh/ke-sam-hoi')
    fireEvent.click(screen.getByRole('tab', { name: 'Lược giải' }))
    expect(screen.getByRole('tab', { name: 'Lược giải' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText(/hôm nay con xin thành tâm sám hối/)).toBeInTheDocument()
  })

  it('bấm vào một dòng để đặt mốc đọc', () => {
    renderAt('/kinh/ke-hoi-huong')
    fireEvent.click(screen.getByRole('button', { name: /^Dòng 3:/ }))
    expect(getState().bookmarks['ke-hoi-huong']).toBe(2)
    expect(screen.getByRole('button', { name: /^Dòng 3:/ })).toHaveAttribute('aria-current', 'true')
  })

  it('mở đúng dòng từ tham số ?dong=', () => {
    renderAt('/kinh/bat-nha-tam-kinh?dong=4')
    expect(screen.getByRole('button', { name: /^Dòng 4:/ })).toHaveAttribute('aria-current', 'true')
  })

  it('Tụng theo tự chuyển dòng theo nhịp và lưu mốc', () => {
    vi.useFakeTimers()
    renderAt('/kinh/ke-hoi-huong')
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu tụng theo' }))
    const first = getSutra('ke-hoi-huong').sections[0].lines[0]
    act(() => {
      vi.advanceTimersByTime(lineSeconds(first, 'vua') * 1000 + 10)
    })
    expect(screen.getByRole('button', { name: /^Dòng 2:/ })).toHaveAttribute('aria-current', 'true')
    expect(getState().bookmarks['ke-hoi-huong']).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng tụng theo' }))
    expect(screen.getByRole('button', { name: 'Bắt đầu tụng theo' })).toBeInTheDocument()
  })

  it('Hoàn thành thời tụng → xác nhận rồi ghi phiên tụng', () => {
    renderAt('/kinh/ke-khai-kinh')
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành thời tụng' }))
    expect(screen.getByRole('dialog', { name: 'Hoàn thành thời tụng?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận' }))

    const { sessions, logs } = getState()
    expect(sessions[0]).toMatchObject({ type: 'tung', ref: 'ke-khai-kinh' })
    expect(Object.values(logs)[0].tung).toBe(1)
    expect(screen.getByRole('dialog', { name: 'Thời tụng đã viên mãn' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tụng Kệ Hồi Hướng/ })).toHaveAttribute('href', '/kinh/ke-hoi-huong')
    expect(screen.getByText('Đã ghi nhận thời tụng')).toBeInTheDocument()
  })

  it('nghi thức hiển thị bài được dẫn chiếu kèm liên kết mở riêng', () => {
    renderAt('/kinh/nghi-thuc-niem-phat')
    expect(screen.getByText(/Quán Tự Tại Bồ Tát hành thâm/)).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /Mở bài riêng/ })
    expect(links.map((a) => a.getAttribute('href'))).toContain('/kinh/bat-nha-tam-kinh')
  })
})
