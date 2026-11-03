import { useEffect, useRef, useState } from 'react'
import { Flame, HandHeart } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { emit, setPlayerAnim } from '../runtime'
import { addMerit, addStat, consumeItem, cooldownLeft, markCooldown, useGame } from '../state'
import { haptic, playBell } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { INCENSE_COOLDOWN } from './constants'

const HOLD_MS = 1400

/**
 * Thắp hương: chọn số nén → giữ để châm hương → vái ba vái → cắm hương.
 * Nhang lấy từ túi đồ (mua ở sạp chân núi); có thể dâng kèm một bó hoa nếu có.
 * params: { spotId, name, stand?, face? }
 */
export default function ThapHuong({ params, onClose }) {
  const { spotId, name, stand, face } = params
  useActivityPose({ anim: 'pray', stand, face })
  const inventory = useGame((s) => s.save.inventory)
  const [sticks, setSticks] = useState(() => (inventory.nhang >= 3 ? 3 : 1))
  const [withFlower, setWithFlower] = useState(false)
  const [step, setStep] = useState('chon') // chon → cham → vai → xong
  const [hold, setHold] = useState(0)
  const [bows, setBows] = useState(0)
  const [wish, setWish] = useState('')
  const [earned, setEarned] = useState(0)
  const holdStart = useRef(null)
  const raf = useRef(0)
  const left = cooldownLeft(`huong:${spotId}`, INCENSE_COOLDOWN)

  // Giữ nút để châm hương (thao tác chậm rãi, có chủ ý)
  const startHold = () => {
    holdStart.current = performance.now()
    setPlayerAnim('incense')
    const tick = () => {
      const p = Math.min(1, (performance.now() - holdStart.current) / HOLD_MS)
      setHold(p)
      if (p >= 1) {
        haptic(25)
        setStep('vai')
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }
  const stopHold = () => {
    cancelAnimationFrame(raf.current)
    if (step === 'cham') setHold(0)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const bow = () => {
    const n = bows + 1
    setBows(n)
    haptic(15)
    setPlayerAnim('incense')
    if (n < 3) return
    // Cắm hương, hoàn tất
    playBell({ pitch: 262 })
    const flower = withFlower && consumeItem('hoa')
    const amount = left > 0 ? 0 : (sticks === 3 ? 15 : 8) + (flower ? 5 : 0)
    if (amount) addMerit(amount, 'Thắp hương', stand)
    addStat('huong')
    markCooldown(`huong:${spotId}`)
    emit('incense-lit', { spotId })
    setEarned(amount)
    setPlayerAnim('pray')
    setStep('xong')
  }

  return (
    <Panel title="Thắp hương" subtitle={name} onClose={onClose}>
      {step === 'chon' && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Hương là lòng thành. Thắp ít mà tâm chuyên chú vẫn quý hơn đốt nhiều.</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Số nén hương">
            {[1, 3].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={sticks === n}
                onClick={() => setSticks(n)}
                className={cn(
                  'rounded-2xl border-2 p-3 text-left transition',
                  sticks === n ? 'border-jade-600 bg-jade-50' : 'border-stone-200 bg-white hover:border-stone-300',
                )}
              >
                <span className="block font-semibold">{n} nén</span>
                <span className="text-xs text-stone-500">{n === 1 ? 'Nhất tâm hướng về Tam Bảo' : 'Kính Phật, Pháp, Tăng'}</span>
              </button>
            ))}
          </div>
          {left > 0 && (
            <p className="rounded-xl bg-saffron-50 px-3 py-2 text-xs text-saffron-800">
              Hương bạn thắp ở đây vẫn đang cháy (còn khoảng {Math.ceil(left / 60000)} phút). Bạn vẫn có thể thắp thêm, nhưng sẽ không cộng công đức.
            </p>
          )}
          {inventory.hoa > 0 && (
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={withFlower} onChange={(e) => setWithFlower(e.target.checked)} className="h-4 w-4 accent-jade-700" />
              Dâng kèm một bó hoa (còn {inventory.hoa} bó)
            </label>
          )}
          {inventory.nhang < sticks ? (
            <p className="rounded-xl bg-stone-100 px-3 py-2 text-sm text-stone-700">
              Bạn còn {inventory.nhang} nén nhang. Làm công quả dưới chân núi để có xu, rồi ghé sạp nhang cô Năm thỉnh thêm nhé.
            </p>
          ) : (
            <ActionButton
              className="w-full"
              onClick={() => {
                // Lấy nhang ra khỏi túi khi bắt đầu thắp
                if (consumeItem('nhang', sticks)) setStep('cham')
              }}
            >
              <Flame className="h-5 w-5" /> Lấy {sticks} nén nhang (còn {inventory.nhang})
            </ActionButton>
          )}
        </div>
      )}

      {step === 'cham' && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-stone-600">Nhấn giữ để châm hương vào ngọn nến.</p>
          <button
            type="button"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && !e.repeat && startHold()}
            onKeyUp={stopHold}
            className="relative mx-auto grid h-28 w-28 touch-none place-items-center rounded-full bg-gradient-to-b from-saffron-300 to-saffron-500 text-white shadow-lg select-none"
            aria-label="Nhấn giữ để châm hương"
          >
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(255 255 255 / 0.35)" strokeWidth="6" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray={289} strokeDashoffset={289 * (1 - hold)} />
            </svg>
            <Flame className={cn('h-10 w-10 transition', hold > 0 && 'scale-110')} />
          </button>
        </div>
      )}

      {step === 'vai' && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Nâng hương ngang trán, vái ba vái. Bạn có thể thầm khấn nguyện điều lành.</p>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-stone-600">Lời nguyện (riêng tư, không lưu lại)</span>
            <textarea
              value={wish}
              onChange={(e) => setWish(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Nguyện cho cha mẹ được bình an…"
              className="w-full resize-none rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:border-jade-500 focus:outline-none"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5" aria-label={`Đã vái ${bows} trên 3`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={cn('h-3 w-3 rounded-full', i < bows ? 'bg-saffron-500' : 'bg-stone-300')} />
              ))}
            </div>
            <ActionButton tone="saffron" onClick={bow}>
              <HandHeart className="h-5 w-5" /> Vái ({bows + 1}/3)
            </ActionButton>
          </div>
        </div>
      )}

      {step === 'xong' && (
        <div className="space-y-4 text-center">
          <p className="font-serif text-lg text-stone-800">Nguyện hương thơm lan khắp mười phương.</p>
          {earned > 0 ? (
            <p className="text-sm text-jade-700">+{earned} công đức</p>
          ) : (
            <p className="text-sm text-stone-500">Hương đã được cắm vào lư.</p>
          )}
          <p className="text-xs text-stone-500">Ngoài đời, hãy giữ lòng thành và làm thêm một việc tốt hôm nay nhé.</p>
          <ActionButton className="w-full" onClick={onClose}>
            Xong
          </ActionButton>
        </div>
      )}
    </Panel>
  )
}
