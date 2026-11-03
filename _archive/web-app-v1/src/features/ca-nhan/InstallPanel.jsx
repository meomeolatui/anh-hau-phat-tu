import { CircleCheckBig, EllipsisVertical, MonitorSmartphone, Share, SquarePlus } from 'lucide-react'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/ui/toast-context'
import { useInstallPrompt } from './useInstallPrompt'
import Section from './Section'

/** Hướng dẫn / nút cài ứng dụng lên màn hình chính để dùng như app, kể cả khi không có mạng. */
export default function InstallPanel() {
  const toast = useToast()
  const { mode, install } = useInstallPrompt()

  const onInstall = async () => {
    const outcome = await install()
    if (outcome === 'accepted') toast({ title: 'Đã cài ứng dụng', description: 'Biểu tượng hoa sen sẽ xuất hiện trên màn hình chính.' })
  }

  return (
    <Section
      id="cai-ung-dung"
      icon={MonitorSmartphone}
      title="Cài lên màn hình chính"
      description="Mở nhanh như ứng dụng thật, dùng được cả khi mất mạng."
    >
      {mode === 'installed' && (
        <p className="flex items-center gap-2 rounded-2xl bg-jade-50 p-4 text-sm font-medium text-jade-800 dark:bg-jade-900/30 dark:text-jade-100">
          <CircleCheckBig className="h-5 w-5" aria-hidden />
          Ứng dụng đã được cài trên thiết bị này.
        </p>
      )}

      {mode === 'prompt' && (
        <Button size="lg" onClick={onInstall}>
          <SquarePlus className="h-5 w-5" aria-hidden />
          Cài lên màn hình chính
        </Button>
      )}

      {mode === 'ios' && (
        <ol className="space-y-3 text-sm text-stone-700 dark:text-stone-300">
          <Step n={1}>
            Mở trang này bằng <strong>Safari</strong>, chạm nút <strong>Chia sẻ</strong>{' '}
            <Share className="inline h-4 w-4 align-text-bottom text-sky-600" aria-hidden />
          </Step>
          <Step n={2}>
            Chọn <strong>Thêm vào MH chính</strong>{' '}
            <SquarePlus className="inline h-4 w-4 align-text-bottom" aria-hidden />
          </Step>
          <Step n={3}>
            Chạm <strong>Thêm</strong>. Biểu tượng hoa sen sẽ nằm trên màn hình chính.
          </Step>
        </ol>
      )}

      {mode === 'manual' && (
        <div className="space-y-2 text-sm text-stone-700 dark:text-stone-300">
          <p>
            Trên Android (Chrome): chạm menu{' '}
            <EllipsisVertical className="inline h-4 w-4 align-text-bottom" aria-hidden /> rồi chọn{' '}
            <strong>Cài đặt ứng dụng</strong> hoặc <strong>Thêm vào màn hình chính</strong>.
          </p>
          <p>
            Trên máy tính (Chrome, Edge): bấm biểu tượng cài đặt ở cuối thanh địa chỉ.
          </p>
        </div>
      )}
    </Section>
  )
}

function Step({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-jade-100 text-xs font-semibold text-jade-800 dark:bg-jade-900/60 dark:text-jade-200">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  )
}
