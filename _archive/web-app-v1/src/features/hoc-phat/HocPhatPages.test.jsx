import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '../../components/ui/Toast'
import HocPhat from '../../pages/HocPhat'
import HocPhatDetail from '../../pages/HocPhatDetail'
import { LESSONS, getLesson } from '../../data/lessons'
import { completeLesson } from '../../lib/actions'
import { getState } from '../../lib/store'

function renderAt(path) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/hoc-phat" element={<HocPhat />} />
          <Route path="/hoc-phat/:id" element={<HocPhatDetail />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

describe('Trang Học Phật', () => {
  it('hiện toàn bộ lộ trình và gợi ý bắt đầu từ bài đầu tiên', () => {
    renderAt('/hoc-phat')
    for (const l of LESSONS) expect(screen.getByRole('heading', { name: l.title })).toBeInTheDocument()
    expect(screen.getByLabelText(`Đã hoàn thành 0 trên ${LESSONS.length} bài`)).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /Bắt đầu học/ })
    expect(cta).toHaveAttribute('href', `/hoc-phat/${LESSONS[0].id}`)
  })

  it('lọc theo cấp độ', () => {
    renderAt('/hoc-phat')
    fireEvent.click(screen.getByRole('radio', { name: 'Nâng cao' }))
    expect(screen.queryByRole('heading', { name: LESSONS[0].title })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sáu Ba-la-mật' })).toBeInTheDocument()
  })

  it('phản ánh bài đã học và gợi ý học tiếp', () => {
    completeLesson(LESSONS[0].id, 1)
    renderAt('/hoc-phat')
    expect(screen.getByLabelText(`Đã hoàn thành 1 trên ${LESSONS.length} bài`)).toBeInTheDocument()
    expect(screen.getAllByText('Thuần thục').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Học tiếp/ })).toHaveAttribute('href', `/hoc-phat/${LESSONS[1].id}`)
  })
})

describe('Trang chi tiết bài học', () => {
  it('báo không tìm thấy với id không tồn tại', () => {
    renderAt('/hoc-phat/khong-co-bai-nay')
    expect(screen.getByText('Không tìm thấy bài học')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Về lộ trình Học Phật/ })).toHaveAttribute('href', '/hoc-phat')
  })

  it('hiện nội dung, điểm cốt lõi, mục lục và điều hướng bài trước/sau', () => {
    const lesson = getLesson('tam-bao-quy-y')
    renderAt('/hoc-phat/tam-bao-quy-y')
    expect(screen.getByRole('heading', { level: 1, name: lesson.title })).toBeInTheDocument()
    for (const s of lesson.sections) expect(screen.getByRole('heading', { level: 2, name: new RegExp(s.heading) })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Điểm cốt lõi' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Chuyển bài' })
    expect(within(nav).getByRole('link', { name: /Đức Phật Thích Ca Mâu Ni/ })).toBeInTheDocument()
    expect(screen.getByText(/tham khảo nhập môn/)).toBeInTheDocument()
  })

  it('làm trắc nghiệm bằng bàn phím, chấm điểm và lưu điểm cao nhất', () => {
    const lesson = getLesson('tam-bao-quy-y')
    renderAt('/hoc-phat/tam-bao-quy-y')
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu làm bài/ }))

    lesson.quiz.forEach((item, i) => {
      const question = screen.getByRole('heading', { level: 3, name: item.q })
      // Câu đầu trả lời sai để kiểm tra phản hồi, các câu sau trả lời đúng
      const choice = i === 0 ? (item.answer + 1) % 4 : item.answer
      fireEvent.keyDown(question, { key: String(choice + 1) })
      if (i === 0) expect(screen.getByText(/Chưa đúng — đáp án đúng là/)).toBeInTheDocument()
      else expect(screen.getByText('Chính xác!')).toBeInTheDocument()
      const isLast = i === lesson.quiz.length - 1
      fireEvent.click(screen.getByRole('button', { name: isLast ? /Xem kết quả/ : /Câu tiếp theo/ }))
    })

    const total = lesson.quiz.length
    expect(screen.getByText(`${total - 1}/${total}`)).toBeInTheDocument()
    expect(screen.getByText('Đã hoàn thành bài học')).toBeInTheDocument()
    expect(getState().lessons.completed['tam-bao-quy-y'].score).toBeCloseTo((total - 1) / total)

    // Làm lại với điểm thấp hơn không làm mất điểm cao nhất
    fireEvent.click(screen.getByRole('button', { name: /Làm lại/ }))
    lesson.quiz.forEach((item, i) => {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Đáp án ${((item.answer + 1) % 4) + 1}:`) }))
      fireEvent.click(screen.getByRole('button', { name: i === total - 1 ? /Xem kết quả/ : /Câu tiếp theo/ }))
    })
    expect(screen.getByText(`0/${total}`)).toBeInTheDocument()
    expect(getState().lessons.completed['tam-bao-quy-y'].score).toBeCloseTo((total - 1) / total)
  })

  it('không cho sang câu khi chưa chọn đáp án', () => {
    renderAt('/hoc-phat/ngu-gioi')
    fireEvent.click(screen.getByRole('button', { name: /Bắt đầu làm bài/ }))
    expect(screen.getByRole('button', { name: /Câu tiếp theo/ })).toBeDisabled()
  })
})
