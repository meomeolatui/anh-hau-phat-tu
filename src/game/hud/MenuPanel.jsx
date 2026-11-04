import { useState } from 'react'
import Sheet from './Sheet'
import WardrobeList from '../shop/WardrobeList'
import { emit } from '../runtime'
import { openPanel, resetSave, setScreen, updateSettings, useGame } from '../state'
import { SPAWN } from '../world/layout'
import { cn } from '../../lib/cn'

function Choice({ label, value, options, onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="flex flex-wrap gap-1 rounded-2xl bg-stone-200/70 p-1" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn('rounded-xl px-3 py-1.5 text-xs font-medium', value === o.value ? 'bg-white text-jade-800 shadow-sm' : 'text-stone-600')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const CONTROLS = [
  ['Di chuyển', 'W A S D / phím mũi tên · Cần điều khiển bên trái (cảm ứng)'],
  ['Chạy', 'Giữ Shift · Đẩy hết cần điều khiển'],
  ['Nhảy', 'Phím Space · Nút mũi tên lên góc dưới phải (cảm ứng)'],
  ['Xoay camera', 'Di chuột (chuột khoá vào khung hình) · Kéo chuột · Vuốt nửa phải màn hình'],
  ['Hiện / ẩn con trỏ chuột', 'Giữ Alt: con trỏ lướt tự do, thả ra là khoá lại · Bấm chuột trái (hiện) / bấm vào khung hình (khoá lại) · Esc mở Menu'],
  ['Phóng to/nhỏ', 'Lăn chuột · Chụm hai ngón'],
  ['Góc nhìn thứ nhất / thứ ba', 'Phím C · Nút hình con mắt góc trên'],
  ['Tương tác', 'E hoặc Enter · Chạm nút gợi ý'],
  ['Nhiệm vụ / Bản đồ', 'Q / M'],
  ['Thể lực', 'Chạy, leo dốc tốn sức · Đứng yên hồi chậm · Ngồi ghế đá hồi nhanh'],
]

export default function MenuPanel() {
  const settings = useGame((s) => s.save.settings)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <Sheet title="Tạm nghỉ" subtitle="Anh Hậu Phật Tử — hành hương núi Bà Đen">
      <div className="divide-y divide-stone-200 rounded-2xl bg-white px-4">
        <Choice label="Âm thanh" value={settings.sound} options={[{ value: true, label: 'Bật' }, { value: false, label: 'Tắt' }]} onChange={(v) => updateSettings({ sound: v })} />
        <Choice label="Nhạc nền" value={settings.bgm} options={[{ value: true, label: 'Bật' }, { value: false, label: 'Tắt' }]} onChange={(v) => updateSettings({ bgm: v })} />
        <div className="flex items-center justify-between gap-3 py-2.5">
          <label htmlFor="bgmvol" className="text-sm font-medium text-stone-700">
            Âm lượng nhạc nền
          </label>
          <input id="bgmvol" type="range" min={0} max={1} step={0.05} value={settings.bgmVolume ?? 0.5} onChange={(e) => updateSettings({ bgmVolume: Number(e.target.value) })} className="w-40 accent-jade-600" />
        </div>
        <Choice label="Âm thanh nền (gió, chim, dế)" value={settings.music} options={[{ value: true, label: 'Bật' }, { value: false, label: 'Tắt' }]} onChange={(v) => updateSettings({ music: v })} />
        <Choice
          label="Khoá chuột vào khung hình (di chuột là xoay camera)"
          value={settings.mouseLock ?? true}
          options={[
            { value: true, label: 'Bật' },
            { value: false, label: 'Tắt' },
          ]}
          onChange={(v) => updateSettings({ mouseLock: v })}
        />
        <Choice
          label="Thời gian trong game"
          value={settings.timeMode}
          options={[
            { value: 'real', label: 'Theo giờ thật' },
            { value: 'day', label: 'Ban ngày' },
            { value: 'dusk', label: 'Hoàng hôn' },
            { value: 'night', label: 'Ban đêm' },
          ]}
          onChange={(v) => updateSettings({ timeMode: v })}
        />
        <Choice
          label="Chất lượng hình ảnh"
          value={settings.quality}
          options={[
            { value: 'low', label: 'Nhẹ' },
            { value: 'auto', label: 'Tự động' },
            { value: 'high', label: 'Đẹp' },
          ]}
          onChange={(v) => updateSettings({ quality: v })}
        />
        <div className="flex items-center justify-between gap-3 py-2.5">
          <label htmlFor="sens" className="text-sm font-medium text-stone-700">
            Độ nhạy camera
          </label>
          <input id="sens" type="range" min={0.4} max={2} step={0.1} value={settings.sensitivity} onChange={(e) => updateSettings({ sensitivity: Number(e.target.value) })} className="w-40 accent-jade-600" />
        </div>
        <Choice label="Đảo trục dọc" value={settings.invertY} options={[{ value: false, label: 'Không' }, { value: true, label: 'Có' }]} onChange={(v) => updateSettings({ invertY: v })} />
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-stone-500 uppercase">Tủ đồ</h3>
      <div className="rounded-2xl bg-white p-3">
        <WardrobeList />
      </div>

      <h3 className="mt-6 mb-2 text-sm font-semibold tracking-wide text-stone-500 uppercase">Điều khiển</h3>
      <dl className="space-y-1.5 rounded-2xl bg-white p-4 text-sm">
        {CONTROLS.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="font-medium text-stone-700">{k}</dt>
            <dd className="text-right text-stone-500">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            emit('teleport', { position: SPAWN.position, rotY: SPAWN.rotY })
            openPanel(null)
          }}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-medium hover:bg-stone-50"
        >
          Về cổng chân núi
        </button>
        <button type="button" onClick={() => setScreen('title')} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium hover:bg-stone-50">
          Về màn hình chính
        </button>
      </div>

      <p className="mt-6 rounded-2xl bg-jade-50 p-4 text-sm leading-relaxed text-jade-900">
        Cảnh vật trong game được <b>phỏng theo</b> núi Bà Đen (Tây Ninh), không mô phỏng chính xác. Công đức trong game chỉ là điểm số trò chơi; tu tập thật
        là sống hiền thiện mỗi ngày. Khi có điều kiện, hãy đến chùa thật, giữ lễ nghi và thưa hỏi chư Tăng Ni.
      </p>

      <div className="mt-4 text-center">
        {!confirmReset ? (
          <button type="button" onClick={() => setConfirmReset(true)} className="text-xs text-stone-400 underline hover:text-red-600">
            Xoá toàn bộ dữ liệu chơi
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm">
            <p className="text-red-800">Xoá nhân vật, công đức và tiến độ trên thiết bị này? Không thể hoàn tác.</p>
            <div className="mt-2 flex justify-center gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-xl bg-white px-3 py-1.5">
                Huỷ
              </button>
              <button type="button" onClick={resetSave} className="rounded-xl bg-red-600 px-3 py-1.5 text-white">
                Xoá dữ liệu
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}
