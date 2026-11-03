import { useCallback, useMemo, useRef, useState } from 'react'
import { Database, FileDown, FileUp, ShieldCheck, TriangleAlert, Trash } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { TextField } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toast-context'
import { exportData, ImportError, importData, resetAll } from '../../lib/actions'
import { formatNumber } from '../../lib/date'
import { backupFileName, dataSummary, downloadJson, formatBytes, isResetConfirmed, RESET_CONFIRM_WORD } from './backup'
import Section from './Section'

// File sao lưu thật hiếm khi quá vài trăm KB; chặn file lớn để tránh treo máy yếu
const MAX_IMPORT_BYTES = 5 * 1024 * 1024

/** Sao lưu, khôi phục và xoá toàn bộ dữ liệu trên thiết bị. */
export default function DataPanel({ state, onReplaced }) {
  const toast = useToast()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const summary = dataSummary(state)
  const size = useMemo(() => new TextEncoder().encode(JSON.stringify(state)).length, [state])

  const backup = () => {
    const fileName = backupFileName()
    try {
      downloadJson(exportData(), fileName)
      toast({ title: 'Đã tạo bản sao lưu', description: `Tệp ${fileName} nằm trong thư mục Tải xuống.` })
    } catch (err) {
      toast({ title: 'Không tạo được bản sao lưu', description: err.message, tone: 'warning' })
    }
  }

  const pickFile = async (e) => {
    const file = e.target.files?.[0]
    // Cho phép chọn lại cùng một file ở lần sau
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      toast({ title: 'Tệp quá lớn', description: 'Đây có vẻ không phải bản sao lưu của ứng dụng.', tone: 'warning' })
      return
    }
    try {
      setPending({ name: file.name, text: await file.text() })
    } catch {
      toast({ title: 'Không đọc được tệp', description: 'Hãy thử chọn lại tệp sao lưu.', tone: 'warning' })
    }
  }

  const closeRestore = useCallback(() => setPending(null), [])
  const closeReset = useCallback(() => {
    setResetOpen(false)
    setConfirmText('')
  }, [])

  const restore = () => {
    try {
      importData(pending.text)
    } catch (err) {
      // ImportError mang thông điệp thân thiện; lỗi khác thường do tệp bị hỏng giữa chừng
      const description = err instanceof ImportError ? err.message : 'Tệp sao lưu bị lỗi hoặc không đầy đủ.'
      toast({ title: 'Không khôi phục được', description, tone: 'warning' })
      setPending(null)
      return
    }
    setPending(null)
    onReplaced?.()
    toast({ title: 'Đã khôi phục dữ liệu', description: 'Nhật ký và cài đặt đã được thay bằng bản sao lưu.' })
  }

  const reset = () => {
    if (!isResetConfirmed(confirmText)) return
    resetAll()
    closeReset()
    onReplaced?.()
    toast({ title: 'Đã xoá toàn bộ dữ liệu', description: 'Ứng dụng trở về như lúc mới cài.', tone: 'info' })
  }

  return (
    <Section id="du-lieu" icon={Database} title="Dữ liệu của bạn">
      <p className="flex items-start gap-2 rounded-2xl bg-jade-50 p-4 text-sm text-jade-900 dark:bg-jade-900/30 dark:text-jade-100">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <span>
          Ứng dụng không có máy chủ, không cần tài khoản. Mọi dữ liệu chỉ nằm trong trình duyệt trên thiết bị này. Nếu xoá dữ
          liệu trình duyệt hoặc đổi máy, dữ liệu sẽ mất — hãy sao lưu định kỳ.
        </span>
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[
          ['Ngày có nhật ký', formatNumber(summary.days)],
          ['Phiên tu tập', formatNumber(summary.sessions)],
          ['Chùa đã viếng', formatNumber(summary.visited)],
          ['Dung lượng', formatBytes(size)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-stone-200/70 p-3 dark:border-white/10">
            <dt className="text-xs text-stone-500 dark:text-stone-400">{label}</dt>
            <dd className="mt-0.5 font-semibold text-stone-900 tabular-nums dark:text-stone-100">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={backup}>
          <FileDown className="h-4 w-4" aria-hidden />
          Sao lưu ra tệp
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <FileUp className="h-4 w-4" aria-hidden />
          Khôi phục từ tệp
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-label="Chọn tệp sao lưu"
          onChange={pickFile}
        />
        <Button variant="ghost" className="text-red-700 hover:bg-red-50 sm:ml-auto dark:text-red-400 dark:hover:bg-red-950/40" onClick={() => setResetOpen(true)}>
          <Trash className="h-4 w-4" aria-hidden />
          Xoá toàn bộ dữ liệu
        </Button>
      </div>

      <Modal
        open={Boolean(pending)}
        onClose={closeRestore}
        size="sm"
        title="Khôi phục từ bản sao lưu?"
        description={pending ? `Tệp: ${pending.name}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={closeRestore}>
              Huỷ
            </Button>
            <Button onClick={restore}>Khôi phục</Button>
          </>
        }
      >
        <p className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-saffron-600" aria-hidden />
          Toàn bộ dữ liệu hiện tại trên máy sẽ được thay bằng nội dung trong tệp. Nếu chưa chắc, hãy sao lưu dữ liệu hiện tại trước.
        </p>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={closeReset}
        size="sm"
        title="Xoá toàn bộ dữ liệu?"
        description="Nhật ký, phiên tu tập, sổ nguyện, hồ sơ và cài đặt sẽ bị xoá vĩnh viễn khỏi thiết bị này."
        footer={
          <>
            <Button variant="outline" onClick={closeReset}>
              Huỷ
            </Button>
            <Button variant="danger" onClick={reset} disabled={!isResetConfirmed(confirmText)}>
              Xoá vĩnh viễn
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            reset()
          }}
          className="space-y-4"
        >
          <Button variant="secondary" size="sm" onClick={backup}>
            <FileDown className="h-4 w-4" aria-hidden />
            Sao lưu trước khi xoá
          </Button>
          <TextField
            label={`Gõ ${RESET_CONFIRM_WORD} để xác nhận`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={RESET_CONFIRM_WORD}
          />
        </form>
      </Modal>
    </Section>
  )
}
