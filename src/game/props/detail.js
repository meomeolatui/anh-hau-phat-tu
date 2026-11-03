import { useGame } from '../state'

/**
 * Mức chi tiết hình học theo cài đặt chất lượng: 0 = thấp (bỏ chi tiết nhỏ), 1 = tự động, 2 = cao.
 * Hình học gộp (merge) nên số draw call không đổi — chỉ số đỉnh thay đổi.
 */
export function useDetail() {
  const q = useGame((s) => s.save.settings.quality)
  return q === 'low' ? 0 : q === 'high' ? 2 : 1
}
