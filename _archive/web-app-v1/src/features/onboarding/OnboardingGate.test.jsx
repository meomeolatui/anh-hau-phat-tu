import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingGate from './OnboardingGate'
import { getState } from '../../lib/store'
import { completeOnboarding } from '../../lib/actions'

describe('OnboardingGate', () => {
  it('không hiện gì khi đã chào mừng', () => {
    completeOnboarding({})
    render(<OnboardingGate />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('đi qua 3 bước và lưu tên, pháp danh, mục tiêu', async () => {
    const user = userEvent.setup()
    render(<OnboardingGate />)

    expect(screen.getByRole('dialog', { name: /Bước 1\/3/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }))

    expect(screen.getByRole('dialog', { name: /Bước 2\/3/ })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Tên gọi'), 'Minh An')
    await user.type(screen.getByLabelText('Pháp danh (nếu có)'), 'Diệu Hạnh')
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }))

    await user.click(screen.getByRole('radio', { name: /Tinh tấn/ }))
    await user.click(screen.getByRole('button', { name: 'Bắt đầu tu tập' }))

    const { profile } = getState()
    expect(profile).toMatchObject({ onboarded: true, name: 'Minh An', phapDanh: 'Diệu Hạnh' })
    expect(profile.goals).toMatchObject({ niem: 3000, thienMin: 30 })
    expect(profile.createdAt).toBeTruthy()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('nút Quay lại giữ dữ liệu đã nhập', async () => {
    const user = userEvent.setup()
    render(<OnboardingGate />)
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await user.type(screen.getByLabelText('Tên gọi'), 'An')
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await user.click(screen.getByRole('button', { name: /Quay lại/ }))
    expect(screen.getByLabelText('Tên gọi')).toHaveValue('An')
  })

  it('mục tiêu tự đặt sai thì báo lỗi, không đóng', async () => {
    const user = userEvent.setup()
    render(<OnboardingGate />)
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await user.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await user.click(screen.getByRole('radio', { name: /Tự đặt/ }))
    const input = screen.getByLabelText('Thiền (phút)')
    await user.clear(input)
    await user.type(input, '0')
    await user.click(screen.getByRole('button', { name: 'Bắt đầu tu tập' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/khoảng/)
    expect(getState().profile.onboarded).toBe(false)

    await user.clear(input)
    await user.type(input, '20')
    await user.click(screen.getByRole('button', { name: 'Bắt đầu tu tập' }))
    expect(getState().profile.goals.thienMin).toBe(20)
  })

  it('Bỏ qua vẫn hoàn tất với mục tiêu mặc định', async () => {
    const user = userEvent.setup()
    render(<OnboardingGate />)
    await user.click(screen.getByRole('button', { name: 'Bỏ qua' }))
    expect(getState().profile).toMatchObject({ onboarded: true, goals: { niem: 1080, thienMin: 15, thienHanh: 1 } })
  })
})
