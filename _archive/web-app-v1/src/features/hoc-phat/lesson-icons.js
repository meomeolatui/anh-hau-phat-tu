import { BookOpen, Flame, Gem, HandHeart, Heart, HeartHandshake, Lightbulb, Mountain, Route, ShieldCheck, Sprout, Sun } from 'lucide-react'

// Ánh xạ tên icon (lưu dạng chuỗi trong data/lessons.js) sang component —
// import tường minh để bundler loại bỏ các icon không dùng.
const ICONS = { Flame, Gem, HandHeart, Heart, HeartHandshake, Lightbulb, Mountain, Route, ShieldCheck, Sprout, Sun }

export function getLessonIcon(name) {
  return ICONS[name] ?? BookOpen
}

export function hasLessonIcon(name) {
  return Object.hasOwn(ICONS, name)
}

/** Màu theo cấp độ — dùng chung cho thẻ, nút mốc lộ trình và huy hiệu. */
export const LEVEL_STYLE = {
  'nhap-mon': {
    tone: 'jade',
    tile: 'from-jade-500 to-jade-700',
    soft: 'bg-jade-50 text-jade-700 dark:bg-jade-900/40 dark:text-jade-300',
    bar: 'bg-jade-500',
  },
  'can-ban': {
    tone: 'lotus',
    tile: 'from-lotus-400 to-lotus-600',
    soft: 'bg-lotus-50 text-lotus-700 dark:bg-lotus-900/30 dark:text-lotus-300',
    bar: 'bg-lotus-500',
  },
  'nang-cao': {
    tone: 'saffron',
    tile: 'from-saffron-400 to-saffron-600',
    soft: 'bg-saffron-50 text-saffron-800 dark:bg-saffron-900/30 dark:text-saffron-300',
    bar: 'bg-saffron-500',
  },
}

export function levelStyle(level) {
  return LEVEL_STYLE[level] ?? LEVEL_STYLE['nhap-mon']
}
