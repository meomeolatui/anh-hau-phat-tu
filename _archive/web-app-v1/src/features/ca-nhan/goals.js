/**
 * Mục tiêu hằng ngày: giới hạn hợp lệ, các mức gợi ý, và kiểm tra dữ liệu nhập.
 * Dùng chung cho màn chào mừng (onboarding) và trang Hồ sơ để hai nơi luôn nhất quán.
 */

export const GOAL_FIELDS = [
  { key: 'niem', label: 'Niệm Phật', unit: 'câu', min: 1, max: 100000 },
  { key: 'thienMin', label: 'Thiền', unit: 'phút', min: 1, max: 480 },
  { key: 'thienHanh', label: 'Thiện hạnh', unit: 'việc', min: 1, max: 20 },
]

export const GOAL_PRESETS = [
  {
    id: 'nhe-nhang',
    label: 'Nhẹ nhàng',
    desc: 'Cho người mới bắt đầu hoặc bận rộn',
    goals: { niem: 108, thienMin: 5, thienHanh: 1 },
  },
  {
    id: 'deu-dan',
    label: 'Đều đặn',
    desc: 'Nhịp tu tập vừa phải, bền lâu',
    goals: { niem: 1080, thienMin: 15, thienHanh: 1 },
  },
  {
    id: 'tinh-tan',
    label: 'Tinh tấn',
    desc: 'Khi đã quen và có nhiều thời gian',
    goals: { niem: 3000, thienMin: 30, thienHanh: 2 },
  },
]

const fieldOf = (key) => GOAL_FIELDS.find((f) => f.key === key)

/**
 * Đọc giá trị người dùng gõ vào. Chấp nhận dấu chấm/khoảng trắng phân cách hàng nghìn
 * kiểu Việt Nam ("1.080") vì người lớn tuổi hay gõ như vậy.
 * @returns {{ value: number|null, error: string|null }}
 */
export function parseGoal(key, raw) {
  const field = fieldOf(key)
  if (!field) return { value: null, error: 'Mục tiêu không xác định.' }
  const range = `từ ${field.min.toLocaleString('vi-VN')} đến ${field.max.toLocaleString('vi-VN')} ${field.unit}`
  const clean = String(raw ?? '').replace(/[.\s]/g, '')
  if (!clean) return { value: null, error: `Hãy nhập một số ${range}.` }
  if (!/^\d+$/.test(clean)) return { value: null, error: `Chỉ nhập số nguyên ${range}.` }
  const value = Number(clean)
  if (value < field.min || value > field.max) return { value: null, error: `Hãy chọn trong khoảng ${range}.` }
  return { value, error: null }
}

/**
 * Kiểm tra cả bộ mục tiêu dạng chuỗi.
 * @returns {{ goals: object|null, errors: Record<string,string> }} goals = null nếu còn lỗi
 */
export function validateGoals(draft) {
  const goals = {}
  const errors = {}
  for (const { key } of GOAL_FIELDS) {
    const { value, error } = parseGoal(key, draft[key])
    if (error) errors[key] = error
    else goals[key] = value
  }
  return { goals: Object.keys(errors).length ? null : goals, errors }
}

/** id của mức gợi ý trùng khớp với bộ mục tiêu, hoặc 'custom'. */
export function matchPreset(goals) {
  const hit = GOAL_PRESETS.find((p) => GOAL_FIELDS.every(({ key }) => p.goals[key] === goals?.[key]))
  return hit ? hit.id : 'custom'
}

/** Chuyển mục tiêu số → chuỗi để đưa vào ô nhập. */
export function goalsToDraft(goals) {
  return Object.fromEntries(GOAL_FIELDS.map(({ key }) => [key, String(goals?.[key] ?? '')]))
}
