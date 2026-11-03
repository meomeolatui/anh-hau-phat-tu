import { createElement } from 'react'
import { getLessonIcon } from './lesson-icons'

/** Icon của bài học theo tên lưu trong dữ liệu (tra bảng tĩnh, không tạo component mới mỗi lần render). */
export default function LessonIcon({ name, className }) {
  return createElement(getLessonIcon(name), { className, 'aria-hidden': true })
}
