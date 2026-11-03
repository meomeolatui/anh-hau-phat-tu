import {
  Feather,
  Flower2,
  Gift,
  HandHelping,
  HeartHandshake,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sunrise,
  Wind,
} from 'lucide-react'

/**
 * Dữ liệu (data/good-deeds.js) chỉ lưu tên icon dạng chuỗi để giữ thuần JSON;
 * ánh xạ sang component tại đây để chỉ import đúng những icon cần dùng.
 */
const ICONS = { Feather, Flower2, Gift, HandHelping, HeartHandshake, MessageCircleHeart, ShieldCheck, Sparkles, Sprout, Sunrise, Wind }

export function iconFor(name) {
  return ICONS[name] ?? Sparkles
}

/** Lớp màu theo tone — viết đủ chuỗi để Tailwind quét được. */
export const TONE = {
  jade: {
    chip: 'bg-jade-50 text-jade-800 ring-jade-200 dark:bg-jade-900/40 dark:text-jade-100 dark:ring-jade-800',
    chipActive: 'bg-jade-700 text-white ring-jade-700 dark:bg-jade-500 dark:text-jade-950 dark:ring-jade-500',
    icon: 'bg-jade-100 text-jade-700 dark:bg-jade-900/60 dark:text-jade-300',
    bar: 'bg-jade-500 dark:bg-jade-400',
  },
  lotus: {
    chip: 'bg-lotus-50 text-lotus-800 ring-lotus-200 dark:bg-lotus-900/30 dark:text-lotus-100 dark:ring-lotus-800',
    chipActive: 'bg-lotus-600 text-white ring-lotus-600 dark:bg-lotus-400 dark:text-lotus-900 dark:ring-lotus-400',
    icon: 'bg-lotus-100 text-lotus-700 dark:bg-lotus-900/40 dark:text-lotus-300',
    bar: 'bg-lotus-500 dark:bg-lotus-400',
  },
  saffron: {
    chip: 'bg-saffron-50 text-saffron-800 ring-saffron-200 dark:bg-saffron-900/30 dark:text-saffron-100 dark:ring-saffron-800',
    chipActive: 'bg-saffron-600 text-white ring-saffron-600 dark:bg-saffron-400 dark:text-saffron-900 dark:ring-saffron-400',
    icon: 'bg-saffron-100 text-saffron-700 dark:bg-saffron-900/40 dark:text-saffron-300',
    bar: 'bg-saffron-500 dark:bg-saffron-400',
  },
  stone: {
    chip: 'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-white/5 dark:text-stone-200 dark:ring-white/10',
    chipActive: 'bg-stone-700 text-white ring-stone-700 dark:bg-stone-200 dark:text-stone-900 dark:ring-stone-200',
    icon: 'bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300',
    bar: 'bg-stone-400 dark:bg-stone-500',
  },
}

export function toneOf(tone) {
  return TONE[tone] ?? TONE.stone
}

/** Màu theo mức cảm nhận 1..5 — dùng chung cho mặt cười ở bộ chọn và dòng thời gian. */
export const MOOD_TONE = {
  1: 'text-stone-500 dark:text-stone-400',
  2: 'text-lotus-600 dark:text-lotus-300',
  3: 'text-saffron-600 dark:text-saffron-300',
  4: 'text-jade-600 dark:text-jade-300',
  5: 'text-jade-700 dark:text-jade-200',
}
