import { Bell, Minus, Monitor, Moon, Plus, Settings, Sun } from 'lucide-react'
import Button from '../../components/ui/Button'
import Segmented from '../../components/ui/Segmented'
import { SelectField, Switch } from '../../components/ui/Field'
import { updateSettings } from '../../lib/actions'
import { haptic, playBell } from '../../lib/sound'
import { FASTING_SCHEMES, getFastingScheme } from '../../data/holidays'
import Section from './Section'

export const FONT_MIN = 16
export const FONT_MAX = 32

const THEME_OPTIONS = [
  { value: 'system', label: 'Theo máy', icon: Monitor },
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
]

const FASTING_OPTIONS = FASTING_SCHEMES.map((s) => ({ value: s.id, label: s.label }))

// Câu đầu Bát Nhã Tâm Kinh (phiên âm Hán-Việt) — đúng loại chữ người dùng sẽ đọc ở trang Kinh
const PREVIEW_TEXT = 'Quán Tự Tại Bồ Tát hành thâm Bát Nhã Ba La Mật Đa thời, chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.'

const clampFont = (n) => Math.min(FONT_MAX, Math.max(FONT_MIN, Math.round(n)))

/** Giao diện, âm thanh, rung, cỡ chữ đọc kinh, lối ăn chay. */
export default function SettingsPanel({ settings }) {
  const fontSize = clampFont(settings.readerFontSize || 20)
  const scheme = getFastingScheme(settings.fasting)
  const setFont = (n) => updateSettings({ readerFontSize: clampFont(n) })

  return (
    <Section id="cai-dat" icon={Settings} title="Cài đặt" description="Thay đổi được lưu ngay lập tức.">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
              Giao diện
            </p>
            <Segmented
              aria-label="Giao diện"
              options={THEME_OPTIONS}
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
            />
          </div>

          <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200/70 px-4 dark:divide-white/5 dark:border-white/10">
            <Switch
              checked={settings.sound}
              onChange={(sound) => updateSettings({ sound })}
              label="Âm thanh"
              description="Tiếng mõ, tiếng hạt chuỗi và chuông khi tu tập."
            />
            <Switch
              checked={settings.haptics}
              onChange={(haptics) => {
                updateSettings({ haptics })
                // Rung thử ngay để người dùng biết máy có hỗ trợ hay không
                haptic(20)
              }}
              label="Rung nhẹ"
              description="Rung khi lần hạt — chỉ có trên điện thoại hỗ trợ."
            />
            <div className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm text-stone-600 dark:text-stone-400">Kiểm tra âm thanh và rung</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  playBell()
                  haptic(30)
                }}
                disabled={!settings.sound && !settings.haptics}
              >
                <Bell className="h-4 w-4" aria-hidden />
                Thỉnh chuông thử
              </Button>
            </div>
          </div>

          <SelectField
            label="Lối ăn chay"
            hint={
              scheme.days.length
                ? `Các ngày âm lịch: ${scheme.days.join(', ')}${scheme.days.includes(30) ? ' (tháng thiếu thì ngày 29 thay cho ngày 30)' : ''}.`
                : 'Ứng dụng sẽ không nhắc ngày chay.'
            }
            options={FASTING_OPTIONS}
            value={scheme.id}
            onChange={(e) => updateSettings({ fasting: e.target.value })}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="reader-font" className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Cỡ chữ đọc kinh
            </label>
            <span className="text-sm font-semibold text-jade-700 tabular-nums dark:text-jade-300">{fontSize}px</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setFont(fontSize - 1)} disabled={fontSize <= FONT_MIN} aria-label="Giảm cỡ chữ">
              <Minus className="h-4 w-4" />
            </Button>
            <input
              id="reader-font"
              type="range"
              min={FONT_MIN}
              max={FONT_MAX}
              step={1}
              value={fontSize}
              onChange={(e) => setFont(Number(e.target.value))}
              aria-valuetext={`${fontSize} điểm ảnh`}
              className="h-2 flex-1 cursor-pointer accent-jade-600"
            />
            <Button variant="outline" size="icon" onClick={() => setFont(fontSize + 1)} disabled={fontSize >= FONT_MAX} aria-label="Tăng cỡ chữ">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <figure className="mt-4 rounded-2xl bg-paper-2/70 p-5 dark:bg-night-3">
            <figcaption className="mb-2 text-xs font-medium tracking-wide text-stone-500 uppercase dark:text-stone-400">Xem trước</figcaption>
            <p className="font-serif leading-relaxed text-stone-800 dark:text-stone-100" style={{ fontSize }}>
              {PREVIEW_TEXT}
            </p>
            <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Bát Nhã Ba La Mật Đa Tâm Kinh</p>
          </figure>
        </div>
      </div>
    </Section>
  )
}
