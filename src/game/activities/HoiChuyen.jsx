import { useEffect, useRef, useState } from 'react'
import { CircleCheck, ChevronRight, MessageCircle } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { useActivityKeys } from './useActivityKeys'
import { setPlayerAnim } from '../runtime'
import { addMerit, addStat, cooldownLeft, markCooldown, useGame } from '../state'
import { haptic } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { DIALOGUES } from '../dialogues'
import { FIRST_MERIT, HEARD_MS, heardKey, initialOf, REPEAT_COOLDOWN, REPEAT_MERIT, repeatKey, typedLength } from './hoiChuyenLogic'

const FALLBACK = { greeting: 'A Di Đà Phật! Chúc bạn một ngày an lành trên núi.', topics: [] }
const FOLLOW_UP = 'Bạn còn muốn hỏi gì nữa không?'
const TICK_MS = 30

/**
 * Trò chuyện với NPC: lời chào gõ chữ dần (chạm để hiện hết), chọn chủ đề, mỗi chủ đề nhiều câu ("Tiếp").
 * Lần đầu nghe trọn một chủ đề: +công đức và tính vào thống kê "nghe".
 * params: { npcId, name, title, dialogueId, face }
 */
export default function HoiChuyen({ params, onClose }) {
  const { name = 'Người hành hương', title, dialogueId, face } = params
  useActivityPose({ anim: 'pray', face })
  const dialogue = DIALOGUES[dialogueId] ?? FALLBACK
  const cooldowns = useGame((s) => s.save.cooldowns)
  const [topicId, setTopicId] = useState(null)
  const [lineIdx, setLineIdx] = useState(0)
  const [afterTopic, setAfterTopic] = useState(false)
  const [elapsed, setElapsed] = useState(0) // ms đã gõ của câu hiện tại
  const [skipped, setSkipped] = useState(false)
  const [reward, setReward] = useState(null) // { amount, first }
  const greetTimer = useRef(0)

  const topic = dialogue.topics.find((t) => t.id === topicId) ?? null
  const text = topic ? topic.lines[lineIdx] : afterTopic ? FOLLOW_UP : dialogue.greeting
  const shown = skipped ? text.length : typedLength(text, elapsed)
  const typing = shown < text.length
  const lastLine = topic && lineIdx >= topic.lines.length - 1

  // Chắp tay chào rồi đứng tự nhiên lắng nghe
  useEffect(() => {
    greetTimer.current = setTimeout(() => setPlayerAnim('idle'), 1800)
    return () => clearTimeout(greetTimer.current)
  }, [])

  // Hiệu ứng gõ chữ
  useEffect(() => {
    if (!typing) return
    const t = setInterval(() => setElapsed((ms) => ms + TICK_MS), TICK_MS)
    return () => clearInterval(t)
  }, [typing, text])

  const say = () => {
    setElapsed(0)
    setSkipped(false)
  }

  const openTopic = (id) => {
    setTopicId(id)
    setLineIdx(0)
    setReward(null)
    say()
  }

  const finishTopic = () => {
    const first = cooldownLeft(heardKey(dialogueId, topic.id), HEARD_MS) === 0
    if (first) {
      const amount = topic.reward ?? FIRST_MERIT
      addStat('nghe')
      addMerit(amount, 'Nghe chuyện trên núi', face)
      markCooldown(heardKey(dialogueId, topic.id))
      setReward({ amount, first: true })
      haptic(12)
    } else if (cooldownLeft(repeatKey(dialogueId, topic.id), REPEAT_COOLDOWN) === 0) {
      addMerit(REPEAT_MERIT, 'Nghe lại lời hay', face)
      markCooldown(repeatKey(dialogueId, topic.id))
      setReward({ amount: REPEAT_MERIT, first: false })
    } else setReward(null)
    setTopicId(null)
    setAfterTopic(true)
    say()
  }

  /** Chạm vào khung lời thoại / nút Tiếp / phím cách */
  const next = () => {
    if (typing) {
      setSkipped(true)
      return
    }
    if (!topic) return
    if (lastLine) finishTopic()
    else {
      setLineIdx((i) => i + 1)
      say()
    }
  }

  useActivityKeys((e, type) => {
    if (type !== 'down' || e.repeat) return
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      next()
    }
  })

  const heard = (id) => Boolean(cooldowns[heardKey(dialogueId, id)])

  return (
    <Panel title={name} subtitle={title} onClose={onClose}>
      <div className="flex gap-3">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-jade-500 to-jade-800 font-serif text-2xl font-semibold text-white shadow-md"
          aria-hidden
        >
          {initialOf(name)}
        </div>
        <button
          type="button"
          onClick={next}
          className="relative min-h-[5.5rem] flex-1 rounded-2xl rounded-tl-sm bg-stone-900/5 px-4 py-3 text-left text-[15px] leading-relaxed text-stone-800"
          aria-label={typing ? 'Hiện hết lời thoại' : topic ? 'Câu tiếp theo' : 'Lời thoại'}
        >
          <span aria-hidden>{text.slice(0, shown)}</span>
          <span className="sr-only" aria-live="polite">
            {text}
          </span>
          {typing && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-stone-400 align-middle" aria-hidden />}
          {topic && (
            <span className="absolute right-3 bottom-1.5 text-[11px] text-stone-400 tabular-nums">
              {lineIdx + 1}/{topic.lines.length}
            </span>
          )}
        </button>
      </div>

      {reward && !topic && (
        <p className="mt-2 text-right text-xs text-jade-700">
          +{reward.amount} công đức{reward.first ? ' · lần đầu nghe chuyện này' : ''}
        </p>
      )}

      <div className="mt-3">
        {topic ? (
          <ActionButton className="w-full" onClick={next}>
            {typing ? 'Hiện hết' : lastLine ? 'Cảm ơn, mình hiểu rồi' : 'Tiếp'} <ChevronRight className="h-5 w-5" />
          </ActionButton>
        ) : (
          <ul className="space-y-1.5" aria-label="Chủ đề trò chuyện">
            {dialogue.topics.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => openTopic(t.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition',
                    heard(t.id) ? 'bg-white/60 text-stone-600 hover:bg-white' : 'bg-white font-medium text-stone-900 shadow-sm hover:bg-jade-50',
                  )}
                >
                  {heard(t.id) ? (
                    <CircleCheck className="h-4 w-4 shrink-0 text-jade-600" aria-label="Đã nghe" />
                  ) : (
                    <MessageCircle className="h-4 w-4 shrink-0 text-saffron-600" aria-hidden />
                  )}
                  <span className="flex-1">{t.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={onClose} className="w-full rounded-xl px-3 py-2 text-sm text-stone-500 hover:bg-stone-900/5">
                Chào tạm biệt
              </button>
            </li>
          </ul>
        )}
      </div>
    </Panel>
  )
}
