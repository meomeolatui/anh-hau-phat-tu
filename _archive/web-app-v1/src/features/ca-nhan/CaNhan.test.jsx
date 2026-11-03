import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import CaNhan from '../../pages/CaNhan'
import { ToastProvider } from '../../components/ui/Toast'
import { addNiem, completeOnboarding } from '../../lib/actions'
import { getState } from '../../lib/store'

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter>
        <CaNhan />
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('Trang Hồ sơ & cài đặt', () => {
  it('hiện tổng kết và cột mốc', () => {
    addNiem(1200)
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Hồ sơ & cài đặt' })).toBeInTheDocument()
    expect(screen.getByText('1.200')).toBeInTheDocument()
    expect(screen.getByText(/1\/9 cột mốc/)).toBeInTheDocument()
  })

  it('lưu hồ sơ', async () => {
    const user = userEvent.setup()
    renderPage()
    const form = screen.getByRole('region', { name: 'Hồ sơ' })
    await user.type(within(form).getByLabelText('Tên gọi'), 'Minh An')
    await user.click(within(form).getByRole('button', { name: 'Nam mô Đại Bi Quán Thế Âm Bồ Tát' }))
    await user.click(within(form).getByRole('button', { name: 'Lưu hồ sơ' }))
    expect(getState().profile).toMatchObject({ name: 'Minh An', mantra: 'Nam mô Đại Bi Quán Thế Âm Bồ Tát' })
    expect(await screen.findByText('Đã lưu hồ sơ')).toBeInTheDocument()
  })

  it('kiểm tra mục tiêu trước khi lưu', async () => {
    const user = userEvent.setup()
    renderPage()
    const form = screen.getByRole('region', { name: 'Mục tiêu hằng ngày' })
    const input = within(form).getByLabelText('Thiền')
    await user.clear(input)
    await user.type(input, '999')
    await user.click(within(form).getByRole('button', { name: 'Lưu mục tiêu' }))
    expect(within(form).getByRole('alert')).toHaveTextContent('480')
    expect(getState().profile.goals.thienMin).toBe(15)

    await user.click(within(form).getByRole('radio', { name: /Nhẹ nhàng/ }))
    await user.click(within(form).getByRole('button', { name: 'Lưu mục tiêu' }))
    expect(getState().profile.goals).toMatchObject({ niem: 108, thienMin: 5 })
  })

  it('đổi giao diện, cỡ chữ và lối ăn chay', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('radio', { name: 'Tối' }))
    expect(getState().settings.theme).toBe('dark')
    await user.click(screen.getByRole('button', { name: 'Tăng cỡ chữ' }))
    expect(getState().settings.readerFontSize).toBe(21)
    await user.selectOptions(screen.getByLabelText('Lối ăn chay'), 'thap-trai')
    expect(getState().settings.fasting).toBe('thap-trai')
  })

  it('xoá toàn bộ dữ liệu chỉ khi gõ đúng XOA', async () => {
    const user = userEvent.setup()
    completeOnboarding({ name: 'An' })
    addNiem(100)
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Xoá toàn bộ dữ liệu' }))
    const dialog = screen.getByRole('dialog', { name: 'Xoá toàn bộ dữ liệu?' })
    const confirm = within(dialog).getByRole('button', { name: 'Xoá vĩnh viễn' })
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Gõ XOA để xác nhận'), 'XOA')
    await user.click(confirm)
    expect(getState().logs).toEqual({})
    expect(getState().profile.onboarded).toBe(false)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('báo lỗi khi khôi phục từ tệp không hợp lệ', async () => {
    const user = userEvent.setup()
    addNiem(100)
    renderPage()
    const file = new File(['{"hello":1}'], 'sai.json', { type: 'application/json' })
    await user.upload(screen.getByLabelText('Chọn tệp sao lưu'), file)
    const dialog = await screen.findByRole('dialog', { name: 'Khôi phục từ bản sao lưu?' })
    await user.click(within(dialog).getByRole('button', { name: 'Khôi phục' }))
    expect(await screen.findByText(/không phải bản sao lưu/)).toBeInTheDocument()
    expect(getState().logs).not.toEqual({})
  })

  it('khôi phục được từ bản sao lưu hợp lệ', async () => {
    const user = userEvent.setup()
    renderPage()
    const backup = JSON.stringify({
      app: 'anh-hau-phat-tu',
      data: { version: 1, logs: { '2026-01-01': { niem: 7, thienMin: 0, tung: 0, thienHanh: [] } }, profile: { name: 'Từ tệp' } },
    })
    await user.upload(screen.getByLabelText('Chọn tệp sao lưu'), new File([backup], 'ok.json', { type: 'application/json' }))
    const dialog = await screen.findByRole('dialog', { name: 'Khôi phục từ bản sao lưu?' })
    await user.click(within(dialog).getByRole('button', { name: 'Khôi phục' }))
    expect(getState().profile.name).toBe('Từ tệp')
    expect(screen.getByRole('region', { name: 'Hồ sơ' }).querySelector('input')).toHaveValue('Từ tệp')
  })
})
