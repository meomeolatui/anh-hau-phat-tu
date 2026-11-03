import {
  BookOpen,
  CalendarDays,
  CircleDot,
  GraduationCap,
  House,
  MapPin,
  NotebookPen,
  Quote,
  Timer,
  UserRound,
} from 'lucide-react'

/**
 * Cấu hình điều hướng duy nhất cho Sidebar (desktop) và BottomNav (di động).
 * `mobile: true` → hiện trực tiếp ở thanh dưới; còn lại nằm trong ngăn "Thêm".
 */
export const NAV_GROUPS = [
  {
    label: 'Tu tập',
    items: [
      { to: '/', label: 'Hôm nay', icon: House, mobile: true, end: true },
      { to: '/niem-phat', label: 'Niệm Phật', icon: CircleDot, mobile: true },
      { to: '/thien', label: 'Thiền định', icon: Timer, mobile: true },
      { to: '/kinh', label: 'Kinh tụng', icon: BookOpen, mobile: true },
    ],
  },
  {
    label: 'Đời sống',
    items: [
      { to: '/nhat-ky', label: 'Nhật ký thiện hạnh', icon: NotebookPen },
      { to: '/lich', label: 'Lịch âm & ngày vía', icon: CalendarDays },
      { to: '/hanh-huong', label: 'Hành hương', icon: MapPin },
    ],
  },
  {
    label: 'Học hỏi',
    items: [
      { to: '/phap-ngu', label: 'Pháp ngữ', icon: Quote },
      { to: '/hoc-phat', label: 'Học Phật', icon: GraduationCap },
    ],
  },
  {
    label: 'Cá nhân',
    items: [{ to: '/ca-nhan', label: 'Hồ sơ & cài đặt', icon: UserRound }],
  },
]

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)
