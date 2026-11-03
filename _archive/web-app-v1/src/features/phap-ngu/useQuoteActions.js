import { useCallback } from 'react'
import { useToast } from '../../components/ui/toast-context'
import { isFavorite, toggleFavorite } from '../../lib/actions'
import { getState } from '../../lib/store'
import { copyText } from './clipboard'
import { formatQuoteForCopy } from './quote-utils'

/** Các thao tác dùng chung cho mọi thẻ pháp ngữ (sao chép, yêu thích) kèm thông báo nhẹ. */
export function useQuoteActions() {
  const toast = useToast()

  const copy = useCallback(
    async (quote) => {
      const ok = await copyText(formatQuoteForCopy(quote))
      if (ok) {
        toast({ title: 'Đã sao chép lời dạy', description: 'Bạn có thể dán vào tin nhắn hoặc ghi chú.' })
        return
      }
      toast({
        title: 'Chưa sao chép được',
        description: 'Trình duyệt chưa cho phép. Bạn thử bôi đen đoạn chữ rồi sao chép thủ công nhé.',
        tone: 'warning',
      })
    },
    [toast],
  )

  const toggleFav = useCallback(
    (quote) => {
      const was = isFavorite(getState(), 'quotes', quote.id)
      toggleFavorite('quotes', quote.id)
      toast(
        was
          ? { title: 'Đã bỏ khỏi mục Yêu thích', tone: 'info' }
          : { title: 'Đã lưu vào mục Yêu thích', description: 'Xem lại bất cứ lúc nào ở thẻ “Yêu thích”.' },
      )
    },
    [toast],
  )

  return { copy, toggleFav }
}
