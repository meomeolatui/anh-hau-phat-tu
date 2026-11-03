import { Heart } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toast-context'
import { toggleWishlist } from '../../lib/actions'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/cn'

/**
 * Nút "Muốn đến". variant 'overlay': nút tròn nổi trên minh hoạ (thẻ chùa);
 * variant 'button': nút có chữ (trang chi tiết).
 */
export default function WishlistButton({ temple, variant = 'overlay', className }) {
  const wishlist = useStore((s) => s.pilgrimage.wishlist)
  const toast = useToast()
  const active = wishlist.includes(temple.id)

  const onClick = () => {
    toggleWishlist(temple.id)
    toast({
      title: active ? 'Đã bỏ khỏi danh sách Muốn đến' : 'Đã thêm vào danh sách Muốn đến',
      description: temple.name,
      tone: active ? 'info' : 'success',
    })
  }

  const label = active ? `Bỏ ${temple.name} khỏi danh sách Muốn đến` : `Thêm ${temple.name} vào danh sách Muốn đến`

  if (variant === 'button') {
    return (
      <Button variant={active ? 'lotus' : 'outline'} size="lg" onClick={onClick} aria-pressed={active} className={className}>
        <Heart className={cn('h-5 w-5', active && 'fill-current')} aria-hidden />
        {active ? 'Đã lưu Muốn đến' : 'Muốn đến'}
      </Button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={active ? 'Bỏ khỏi Muốn đến' : 'Thêm vào Muốn đến'}
      className={cn(
        'grid h-11 w-11 place-items-center rounded-full shadow-sm ring-1 backdrop-blur transition active:scale-90',
        active
          ? 'bg-lotus-600 text-white ring-lotus-500'
          : 'bg-white/85 text-stone-600 ring-black/5 hover:text-lotus-600 dark:bg-night/70 dark:text-stone-200 dark:ring-white/10',
        className,
      )}
    >
      <Heart className={cn('h-5 w-5', active && 'fill-current')} aria-hidden />
    </button>
  )
}
