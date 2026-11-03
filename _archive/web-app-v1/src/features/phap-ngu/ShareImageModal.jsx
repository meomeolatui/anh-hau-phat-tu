import { useEffect, useRef, useState } from 'react'
import { Check, Download, LoaderCircle, Share2, TriangleAlert } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toast-context'
import { themeLabel } from '../../data/quotes'
import { cn } from '../../lib/cn'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  SHARE_TEMPLATES,
  canvasToBlob,
  drawShareCard,
  ensureFonts,
  getTemplate,
  shareFileName,
  templateSwatch,
} from './share-card'

function supportsFileShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function'
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Thu hồi sau một nhịp để trình duyệt kịp bắt đầu tải
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function TemplatePicker({ value, onChange }) {
  const onKeyDown = (e) => {
    const i = SHARE_TEMPLATES.findIndex((t) => t.id === value)
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!delta) return
    e.preventDefault()
    const next = SHARE_TEMPLATES[(i + delta + SHARE_TEMPLATES.length) % SHARE_TEMPLATES.length]
    onChange(next.id)
    e.currentTarget.querySelector(`[data-id="${next.id}"]`)?.focus()
  }
  return (
    <div role="radiogroup" aria-label="Mẫu nền ảnh" className="grid grid-cols-2 gap-2" onKeyDown={onKeyDown}>
      {SHARE_TEMPLATES.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            data-id={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-2.5 text-left text-sm font-medium transition',
              active
                ? 'border-jade-500 bg-jade-50 text-jade-900 dark:border-jade-400 dark:bg-jade-900/40 dark:text-jade-50'
                : 'border-stone-200 text-stone-700 hover:border-stone-300 dark:border-white/10 dark:text-stone-300 dark:hover:border-white/20',
            )}
          >
            <span
              className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1 ring-black/5"
              style={{ backgroundImage: templateSwatch(t) }}
              aria-hidden
            >
              {active && <Check className="h-4 w-4" style={{ color: t.text }} />}
            </span>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/** Hộp thoại tạo ảnh pháp ngữ: xem trước trên canvas, chọn mẫu nền, tải PNG hoặc chia sẻ trực tiếp. */
export default function ShareImageModal({ quote, onClose }) {
  const toast = useToast()
  const canvasRef = useRef(null)
  const [templateId, setTemplateId] = useState('jade')
  const [status, setStatus] = useState('drawing')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!quote) return undefined
    let cancelled = false
    const render = async () => {
      setStatus('drawing')
      await ensureFonts([quote.text, quote.gloss, quote.source].filter(Boolean).join(' '))
      if (cancelled) return
      try {
        const ctx = canvasRef.current?.getContext?.('2d')
        if (!ctx) throw new Error('Canvas không khả dụng')
        drawShareCard(ctx, { quote, template: getTemplate(templateId), themeLabel: themeLabel(quote.theme) })
        setStatus('ready')
      } catch {
        setStatus('error')
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [quote, templateId])

  const makeBlob = async () => {
    if (!canvasRef.current || status !== 'ready') return null
    try {
      return await canvasToBlob(canvasRef.current)
    } catch {
      toast({ title: 'Chưa tạo được ảnh', description: 'Bạn thử lại sau giây lát nhé.', tone: 'warning' })
      return null
    }
  }

  const download = async () => {
    setBusy(true)
    const blob = await makeBlob()
    setBusy(false)
    if (!blob) return
    triggerDownload(blob, shareFileName(quote))
    toast({ title: 'Đã lưu ảnh về máy', description: 'Ảnh nằm trong thư mục Tải xuống của bạn.' })
  }

  const share = async () => {
    setBusy(true)
    const blob = await makeBlob()
    if (!blob) {
      setBusy(false)
      return
    }
    const file = new File([blob], shareFileName(quote), { type: 'image/png' })
    try {
      if (!navigator.canShare({ files: [file] })) {
        triggerDownload(blob, file.name)
        toast({ title: 'Máy chưa hỗ trợ chia sẻ ảnh', description: 'Ảnh đã được tải về để bạn gửi thủ công.', tone: 'info' })
        return
      }
      await navigator.share({ files: [file], title: 'Pháp ngữ', text: `“${quote.text}” — ${quote.source}` })
    } catch (err) {
      // Người dùng tự đóng bảng chia sẻ thì không cần báo lỗi
      if (err?.name !== 'AbortError') {
        toast({ title: 'Chưa chia sẻ được', description: 'Bạn có thể tải ảnh về rồi gửi thủ công.', tone: 'warning' })
      }
    } finally {
      setBusy(false)
    }
  }

  const disabled = busy || status !== 'ready'

  return (
    <Modal
      open={!!quote}
      onClose={onClose}
      size="lg"
      title="Tạo ảnh chia sẻ"
      description="Ảnh khổ 1080×1350, vừa vặn để đăng mạng xã hội hoặc gửi tặng người thân."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          {supportsFileShare() && (
            <Button variant="outline" onClick={share} disabled={disabled}>
              <Share2 className="h-4 w-4" aria-hidden />
              Chia sẻ
            </Button>
          )}
          <Button onClick={download} disabled={disabled}>
            <Download className="h-4 w-4" aria-hidden />
            Tải ảnh PNG
          </Button>
        </>
      }
    >
      {quote && (
        <div className="grid gap-6 sm:grid-cols-[minmax(0,16rem)_1fr]">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[16rem] overflow-hidden rounded-2xl bg-stone-100 shadow-soft ring-1 ring-black/5 dark:bg-night-3 dark:ring-white/10">
            <canvas
              ref={canvasRef}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label={`Ảnh xem trước: “${quote.text}” — ${quote.source}`}
            />
            {status === 'drawing' && (
              <div className="absolute inset-0 grid place-items-center bg-white/60 text-sm text-stone-600 backdrop-blur-sm dark:bg-night-2/60 dark:text-stone-300">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  Đang chuẩn bị ảnh…
                </span>
              </div>
            )}
            {status === 'error' && (
              <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-stone-600 dark:text-stone-300">
                <span>
                  <TriangleAlert className="mx-auto mb-2 h-6 w-6 text-saffron-600" aria-hidden />
                  Trình duyệt này chưa hỗ trợ vẽ ảnh. Bạn vẫn có thể dùng nút “Sao chép”.
                </span>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">Chọn mẫu nền</p>
              <TemplatePicker value={templateId} onChange={setTemplateId} />
            </div>
            <div className="rounded-2xl bg-paper-2 p-4 text-sm leading-relaxed text-stone-600 dark:bg-white/5 dark:text-stone-400">
              <p className="font-medium text-stone-800 dark:text-stone-200">Chia sẻ một lời dạy là trao một hạt giống lành.</p>
              <p className="mt-1">
                Hãy ghi kèm vài dòng cảm nhận của riêng bạn — người nhận sẽ thấy gần gũi hơn một tấm ảnh đẹp.
              </p>
            </div>
            <p className="sr-only" aria-live="polite">
              {status === 'ready' ? 'Ảnh đã sẵn sàng' : status === 'error' ? 'Không vẽ được ảnh' : 'Đang chuẩn bị ảnh'}
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
