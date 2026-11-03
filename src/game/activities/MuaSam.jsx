import { useState } from 'react'
import { Coins, Minus, Plus } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { ITEMS, STALLS } from '../shop/items'
import { buyItem, useGame } from '../state'
import { emit } from '../runtime'
import { playBead } from '../../lib/sound'
import { cn } from '../../lib/cn'

/**
 * Mua đồ lễ ở sạp chân núi bằng xu (kiếm từ công quả).
 * params: { stallId, stand, face }
 */
export default function MuaSam({ params, onClose }) {
  const { stallId, stand, face } = params
  useActivityPose({ anim: 'idle', stand, face })
  const stall = STALLS[stallId]
  const xu = useGame((s) => s.save.xu)
  const inventory = useGame((s) => s.save.inventory)
  const [qty, setQty] = useState(() => Object.fromEntries(stall.items.map((k) => [k, 1])))
  const [note, setNote] = useState('')

  const buy = (key) => {
    const item = ITEMS[key]
    const n = qty[key]
    if (!buyItem(key, item, n)) {
      setNote('Chưa đủ xu. Bạn có thể nhặt rác, quét lá hoặc mời trà khách hành hương để nhận thêm xu.')
      return
    }
    playBead()
    setNote('')
    emit('toast', { title: `Đã nhận ${item.pack * n} ${item.unit} ${item.label.toLowerCase()}`, description: `${stall.seller}: "Chúc con lên núi bình an!"` })
  }

  return (
    <Panel title={stall.name} subtitle={`${stall.seller} chào bạn — hàng lễ chay, giá phải chăng`} onClose={onClose}>
      <div className="mb-4 rounded-2xl bg-saffron-50 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-saffron-900">
          <Coins className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            Bạn có <b className="tabular-nums">{xu}</b> xu
          </span>
        </p>
        <p className="mt-0.5 text-xs text-saffron-800">
          Trong túi: {inventory.nhang} nén nhang · {inventory.hoa} bó hoa · {inventory.den} đèn hoa đăng
        </p>
      </div>

      <ul className="space-y-3">
        {stall.items.map((key) => {
          const item = ITEMS[key]
          const n = qty[key]
          const total = item.price * n
          return (
            <li key={key} className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-900">{item.label}</p>
                  <p className="text-xs text-stone-500">{item.desc}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    {item.price} xu / {item.pack} {item.unit}
                  </p>
                </div>
                <div className="flex items-center gap-1" role="group" aria-label={`Số lượng ${item.label}`}>
                  <button
                    type="button"
                    onClick={() => setQty((q) => ({ ...q, [key]: Math.max(1, q[key] - 1) }))}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100 hover:bg-stone-200"
                    aria-label="Bớt"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-semibold tabular-nums">{n}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => ({ ...q, [key]: Math.min(9, q[key] + 1) }))}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100 hover:bg-stone-200"
                    aria-label="Thêm"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ActionButton tone={xu >= total ? 'jade' : 'ghost'} className="mt-3 h-10 w-full text-sm" onClick={() => buy(key)}>
                Mua · {total} xu
              </ActionButton>
            </li>
          )
        })}
      </ul>

      {note && (
        <p role="alert" className={cn('mt-3 rounded-xl bg-stone-100 px-3 py-2 text-xs text-stone-700')}>
          {note}
        </p>
      )}
    </Panel>
  )
}
