import { BookOpenText, Flower2, Library, ScrollText, Sparkles } from 'lucide-react'
import { SUTRA_CATEGORIES } from '../../data/sutras'

/** Màu & biểu tượng cho từng loại bài — giữ một nơi để thẻ, huy hiệu và trình đọc nhất quán. */
export const CATEGORY_META = {
  kinh: {
    tone: 'jade',
    icon: BookOpenText,
    chip: 'bg-jade-100 text-jade-800 dark:bg-jade-900/60 dark:text-jade-200',
    glow: 'from-jade-200/70 via-jade-50/0 dark:from-jade-700/30',
    accent: 'text-jade-600 dark:text-jade-400',
  },
  chu: {
    tone: 'lotus',
    icon: Sparkles,
    chip: 'bg-lotus-100 text-lotus-800 dark:bg-lotus-900/50 dark:text-lotus-200',
    glow: 'from-lotus-200/70 via-lotus-50/0 dark:from-lotus-800/30',
    accent: 'text-lotus-600 dark:text-lotus-300',
  },
  ke: {
    tone: 'saffron',
    icon: Flower2,
    chip: 'bg-saffron-100 text-saffron-800 dark:bg-saffron-900/50 dark:text-saffron-200',
    glow: 'from-saffron-200/70 via-saffron-50/0 dark:from-saffron-800/30',
    accent: 'text-saffron-600 dark:text-saffron-300',
  },
  'nghi-thuc': {
    tone: 'stone',
    icon: ScrollText,
    chip: 'bg-stone-200/70 text-stone-800 dark:bg-white/10 dark:text-stone-200',
    glow: 'from-stone-200/80 via-stone-50/0 dark:from-white/10',
    accent: 'text-stone-600 dark:text-stone-300',
  },
}

export const ALL_ICON = Library

export function categoryMeta(id) {
  return CATEGORY_META[id] ?? CATEGORY_META.kinh
}

export function categoryLabel(id) {
  return SUTRA_CATEGORIES.find((c) => c.id === id)?.label ?? 'Kinh'
}
