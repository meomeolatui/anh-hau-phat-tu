/** Ghép className, bỏ qua giá trị falsy. */
export function cn(...parts) {
  return parts.flat().filter(Boolean).join(' ')
}
