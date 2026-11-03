import { useEffect, useRef, useState } from 'react'
import { Flower2, Sparkles } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { setPlayerAnim } from '../runtime'
import { addLantern, addMerit, addStat, cooldownLeft, markCooldown, updateSave } from '../state'
import { haptic, playBell } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { cleanWish, HOA_DANG_COOLDOWN, HOA_DANG_MERIT, LANTERN_COLORS, MAX_WISH, WISH_TEMPLATES } from './hoaDangLogic'

/**
 * Thả đèn hoa đăng: viết lời nguyện ngắn, chọn màu đèn, thả xuống hồ sen.
 * params: { pondId, stand, face }
 */
export default function HoaDang({ params, onClose }) {
  const { pondId = 'chan-nui', stand, face } = params
  useActivityPose({ anim: 'pray', stand, face })
  const [text, setText] = useState('')
  const [color, setColor] = useState(LANTERN_COLORS[0].id)
  const [step, setStep] = useState('viet') // viet → xong
  const [earned, setEarned] = useState(0)
  const [left] = useState(() => cooldownLeft(`hoaDang:${pondId}`, HOA_DANG_COOLDOWN))
  const animTimer = useRef(0)
  useEffect(() => () => clearTimeout(animTimer.current), [])

  const wish = cleanWish(text)

  const release = () => {
    if (!wish) return
    const lantern = addLantern(wish, pondId)
    // Lưu thêm màu đèn vào bản ghi vừa tạo (state.js chỉ lưu lời nguyện)
    updateSave((s) => ({ ...s, lanterns: s.lanterns.map((l) => (l.id === lantern.id ? { ...l, color } : l)) }))
    addStat('hoaDang')
    const key = `hoaDang:${pondId}`
    let amount = 0
    if (cooldownLeft(key, HOA_DANG_COOLDOWN) === 0) {
      amount = HOA_DANG_MERIT
      addMerit(amount, 'Thả đèn hoa đăng', stand)
      markCooldown(key)
    }
    setEarned(amount)
    // Cúi xuống đặt đèn lên mặt nước rồi đứng dậy chắp tay
    setPlayerAnim('kneel')
    animTimer.current = setTimeout(() => setPlayerAnim('pray'), 1600)
    playBell({ pitch: 392 })
    haptic([10, 40, 10])
    setStep('xong')
  }

  if (step === 'xong') {
    return (
      <Panel title="Thả đèn hoa đăng" subtitle="Hồ sen" onClose={onClose}>
        <div className="space-y-4 text-center">
          <Flower2 className="mx-auto h-10 w-10 text-lotus-500" aria-hidden />
          <p className="font-serif text-lg leading-relaxed text-stone-800">“{wish}”</p>
          <p className="text-sm text-stone-600">Ngọn đèn nhỏ đang trôi ra giữa hồ, mang theo lời nguyện của bạn.</p>
          {earned > 0 ? (
            <p className="text-sm text-jade-700">+{earned} công đức</p>
          ) : (
            <p className="text-xs text-stone-500">Bạn vừa thả đèn cách đây không lâu nên lần này không cộng thêm công đức.</p>
          )}
          <p className="text-xs text-stone-500">Lời nguyện thành thật nhất là lời nguyện mình bắt tay làm được từ hôm nay.</p>
          <ActionButton className="w-full" onClick={onClose}>
            Xong
          </ActionButton>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Thả đèn hoa đăng" subtitle="Gửi một lời nguyện lành theo dòng nước" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 flex items-end justify-between text-xs font-medium text-stone-600">
            <span>Lời nguyện (hiện trên đèn khi có người đi ngang)</span>
            <span className={cn('tabular-nums', text.length >= MAX_WISH && 'text-lotus-600')}>
              {text.length}/{MAX_WISH}
            </span>
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_WISH))}
            rows={2}
            maxLength={MAX_WISH}
            placeholder="Nguyện cho cha mẹ được bình an…"
            className="w-full resize-none rounded-xl border border-stone-300 bg-white px-3 py-2 font-serif text-base focus:border-jade-500 focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-1.5" aria-label="Lời nguyện gợi ý">
          {WISH_TEMPLATES.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setText(w)}
              className="rounded-full bg-lotus-50 px-3 py-1.5 text-left text-xs text-lotus-800 transition hover:bg-lotus-100"
            >
              {w}
            </button>
          ))}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-stone-600">Màu đèn</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Màu đèn">
            {LANTERN_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={color === c.id}
                aria-label={c.label}
                title={c.label}
                onClick={() => setColor(c.id)}
                className={cn(
                  'grid h-11 w-11 place-items-center rounded-full border-2 transition',
                  color === c.id ? 'scale-110 border-jade-600 shadow-md' : 'border-white/0 hover:scale-105',
                )}
                style={{ background: `radial-gradient(circle at 50% 40%, #fff8dc 0 22%, ${c.petal} 24% 100%)` }}
              />
            ))}
          </div>
        </div>

        {left > 0 && (
          <p className="rounded-xl bg-saffron-50 px-3 py-2 text-xs text-saffron-800">
            Đèn bạn thả còn đang trôi gần bờ (khoảng {Math.ceil(left / 60000)} phút). Bạn vẫn có thể thả thêm, nhưng sẽ không cộng công đức.
          </p>
        )}

        <ActionButton tone="lotus" className="w-full" onClick={release} disabled={!wish}>
          <Sparkles className="h-5 w-5" /> Thả đèn
        </ActionButton>
      </div>
    </Panel>
  )
}
