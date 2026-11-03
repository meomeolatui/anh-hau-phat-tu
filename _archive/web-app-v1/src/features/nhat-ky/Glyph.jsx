import { createElement } from 'react'
import { iconFor } from './ui'

/** Icon lucide theo tên lưu trong dữ liệu — tách thành component để không tạo component mới mỗi lần render. */
export default function Glyph({ name, ...props }) {
  return createElement(iconFor(name), { 'aria-hidden': true, ...props })
}
