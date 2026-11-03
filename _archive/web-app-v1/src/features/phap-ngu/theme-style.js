/** Màu nhấn theo chủ đề pháp ngữ — giúp mắt nhận ra nhóm lời dạy khi lướt danh sách. */
export const THEME_TONE = {
  tam: 'jade',
  'tu-bi': 'lotus',
  'nhan-qua': 'saffron',
  'tinh-tan': 'jade',
  'vo-thuong': 'stone',
  'tri-tue': 'saffron',
  'nhan-nhuc': 'lotus',
  'an-lac': 'jade',
}

const ACCENT = {
  jade: 'bg-jade-500',
  lotus: 'bg-lotus-400',
  saffron: 'bg-saffron-400',
  stone: 'bg-stone-400',
}

export function toneOf(themeId) {
  return THEME_TONE[themeId] ?? 'jade'
}

/** Lớp nền cho vạch màu nhỏ ở đầu thẻ. */
export function accentClass(themeId) {
  return ACCENT[toneOf(themeId)]
}
