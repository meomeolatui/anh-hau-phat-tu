import { useEffect, useMemo, useState } from 'react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { QUOTES } from '../../data/quotes'
import { addMerit, discoverStele, getGame, useGame } from '../state'
import { STELES } from '../world/steles'

/**
 * Đọc bia đá khắc pháp ngữ. Lần đầu đọc một bia: ghi vào sổ sưu tầm + công đức.
 * params: { steleId, quoteId, stand, face }
 */
export default function DocBia({ params, onClose }) {
  const { steleId, quoteId, stand, face } = params
  useActivityPose({ anim: 'pray', stand, face })
  const quote = useMemo(() => QUOTES.find((q) => q.id === quoteId) ?? QUOTES[0], [quoteId])
  const [isNew] = useState(() => !getGame().save.discovered.steles.includes(steleId))
  const total = STELES.length
  const found = useGame((s) => s.save.discovered.steles.length)

  useEffect(() => {
    if (discoverStele(steleId)) addMerit(20, 'Đọc bia pháp ngữ', stand)
  }, [steleId, stand])

  return (
    <Panel title="Bia pháp ngữ" subtitle={isNew ? 'Bạn vừa tìm thấy một bia đá mới' : 'Bia đá ven đường núi'} onClose={onClose}>
      <figure className="rounded-3xl bg-gradient-to-br from-stone-100 to-stone-200 p-5">
        <blockquote className="font-serif text-lg leading-relaxed text-stone-900">“{quote.text}”</blockquote>
        {quote.gloss && <p className="mt-2 text-sm text-stone-600 italic">{quote.gloss}</p>}
        <figcaption className="mt-3 text-sm text-stone-500">— {quote.source}</figcaption>
      </figure>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Đã sưu tầm <b className="text-jade-800">{found}</b>/{total} bia trên núi
        </p>
        <ActionButton onClick={onClose}>Ghi nhớ lời dạy</ActionButton>
      </div>
    </Panel>
  )
}
