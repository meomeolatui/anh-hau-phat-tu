import { useState } from 'react'
import { Check, Shirt } from 'lucide-react'
import { COSTUMES, COSTUME_GROUPS, HATS, HAT_GROUPS } from './wardrobe'
import { buyWear, equipWear, setTryOn, useGame } from '../state'
import { emit } from '../runtime'
import { playBead } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { CostumeArt, HatArt } from './WearArt'

const SLOTS = [
  { id: 'costume', label: 'Áo & cà sa', items: COSTUMES, groups: COSTUME_GROUPS, none: 'Áo thường ngày' },
  { id: 'hat', label: 'Nón & mũ mão', items: HATS, groups: HAT_GROUPS, none: 'Để đầu trần' },
]

/** Ô hình minh hoạ món đồ */
function Art({ slotId, item, skin }) {
  return (
    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-stone-50 to-stone-200/80 p-1 shadow-inner">
      {slotId === 'costume' ? <CostumeArt item={item} /> : <HatArt item={item} skin={skin} />}
    </span>
  )
}

/**
 * Danh sách y phục.
 * shop = true: ở sạp — mặc thử, mua bằng xu, mặc đồ đã có.
 * shop = false: tủ đồ trong Menu — chỉ hiện đồ đã mua để thay.
 */
export default function WardrobeList({ shop = false, seller = 'Bà Tám' }) {
  const [slotId, setSlotId] = useState('costume')
  const xu = useGame((s) => s.save.xu)
  const wardrobe = useGame((s) => s.save.wardrobe)
  const tryOn = useGame((s) => s.ui.tryOn)
  const skin = useGame((s) => s.save.profile?.skin)
  const [note, setNote] = useState('')
  const slot = SLOTS.find((s) => s.id === slotId)
  const worn = wardrobe[slotId]
  const trying = tryOn && slotId in tryOn ? tryOn[slotId] : undefined

  const clearTry = (id) => {
    if (!tryOn) return
    const rest = { ...tryOn }
    delete rest[id]
    setTryOn(Object.keys(rest).length ? rest : null)
  }
  const toggleTry = (id) => {
    setNote('')
    if (trying === id) clearTry(slotId)
    else setTryOn({ ...tryOn, [slotId]: id })
  }
  const wear = (id) => {
    equipWear(slotId, id)
    clearTry(slotId)
    setNote('')
  }
  const buy = (id, item) => {
    if (!buyWear(slotId, id, item.price)) {
      setNote('Chưa đủ xu. Nhặt rác, quét lá hay mời trà khách hành hương để có thêm xu nhé.')
      return
    }
    clearTry(slotId)
    setNote('')
    playBead()
    emit('toast', { title: `Đã mua ${item.label}`, description: `${seller}: "Mặc vào trông thật trang nghiêm, lên núi bình an nhé!"` })
  }

  const entries = Object.entries(slot.items).filter(([id]) => shop || wardrobe.owned.includes(id))

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-2xl bg-stone-900/5 p-1" role="tablist" aria-label="Loại y phục">
        {SLOTS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === slotId}
            onClick={() => setSlotId(s.id)}
            className={cn(
              'h-9 flex-1 rounded-xl text-sm font-semibold transition',
              s.id === slotId ? 'bg-white text-stone-900 shadow' : 'text-stone-500 hover:text-stone-800',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Về đồ thường */}
      <button
        type="button"
        onClick={() => wear(null)}
        className={cn(
          'mb-3 flex w-full items-center gap-3 rounded-2xl border px-3 py-2 text-left text-sm transition',
          !worn && trying === undefined ? 'border-jade-600 bg-jade-50 text-jade-900' : 'border-stone-200 bg-white hover:bg-stone-50',
        )}
      >
        <Shirt className="h-5 w-5 text-stone-500" aria-hidden />
        <span className="flex-1 font-medium">{slot.none}</span>
        {!worn && trying === undefined && <Check className="h-4 w-4 text-jade-700" aria-label="Đang dùng" />}
      </button>

      {entries.length === 0 && (
        <p className="rounded-2xl bg-stone-100 px-3 py-3 text-sm text-stone-600">
          Chưa có món nào. Ghé <b>Sạp y phục bà Tám</b> ở chợ chân núi để mua bằng xu.
        </p>
      )}

      {slot.groups.map((group) => {
        const list = entries.filter(([, item]) => item.group === group.id)
        if (!list.length) return null
        return (
          <section key={group.id} className="mb-3">
            <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-stone-500 uppercase">{group.label}</h3>
            <ul className="space-y-2">
              {list.map(([id, item]) => {
                const owned = wardrobe.owned.includes(id)
                const isWorn = worn === id && trying === undefined
                const isTrying = trying === id
                return (
                  <li
                    key={id}
                    className={cn('rounded-2xl border bg-white p-3', isWorn ? 'border-jade-600' : isTrying ? 'border-saffron-500' : 'border-stone-200')}
                  >
                    <div className="flex items-start gap-3">
                      <Art slotId={slotId} item={item} skin={skin} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900">{item.label}</p>
                        <p className="text-xs text-stone-500">{item.desc}</p>
                        {!owned && <p className="mt-0.5 text-xs font-medium text-saffron-800">{item.price} xu</p>}
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {owned ? (
                        <button
                          type="button"
                          onClick={() => wear(isWorn ? null : id)}
                          className={cn(
                            'h-9 flex-1 rounded-xl text-sm font-semibold transition',
                            isWorn ? 'bg-stone-900/5 text-stone-700 hover:bg-stone-900/10' : 'bg-jade-700 text-white hover:bg-jade-800',
                          )}
                        >
                          {isWorn ? (slotId === 'hat' ? 'Bỏ ra' : 'Cởi ra') : slotId === 'hat' ? 'Đội' : 'Mặc'}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleTry(id)}
                            aria-pressed={isTrying}
                            className={cn(
                              'h-9 flex-1 rounded-xl text-sm font-semibold transition',
                              isTrying ? 'bg-saffron-100 text-saffron-900' : 'bg-stone-900/5 text-stone-800 hover:bg-stone-900/10',
                            )}
                          >
                            {isTrying ? 'Thôi thử' : 'Mặc thử'}
                          </button>
                          <button
                            type="button"
                            onClick={() => buy(id, item)}
                            className={cn(
                              'h-9 flex-1 rounded-xl text-sm font-semibold transition',
                              xu >= item.price ? 'bg-jade-700 text-white hover:bg-jade-800' : 'bg-stone-900/5 text-stone-500',
                            )}
                          >
                            Mua · {item.price} xu
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      {note && (
        <p role="alert" className="mt-2 rounded-xl bg-stone-100 px-3 py-2 text-xs text-stone-700">
          {note}
        </p>
      )}
    </div>
  )
}
