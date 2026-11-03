import { useId, useState } from 'react'
import { Check, DoorOpen, Flame, Hand, HandHeart, Leaf, Shirt, Users, VolumeOff } from 'lucide-react'
import { cn } from '../../lib/cn'

const MANNERS = [
  { icon: Shirt, title: 'Trang phục kín đáo', text: 'Áo có tay, quần hoặc váy dài qua gối, màu nhã nhặn. Nếu kết hợp đi chơi, mang thêm khăn choàng.' },
  { icon: DoorOpen, title: 'Đi cửa bên', text: 'Cửa chính giữa thường dành cho chư Tăng và dịp lễ lớn. Khách vào ra bằng hai cửa bên.' },
  { icon: Hand, title: 'Chắp tay, chào nhẹ', text: 'Gặp chư Tăng Ni hay người cùng đi lễ, chắp tay chào khẽ. Lễ Phật ở chánh điện trước, rồi mới vãn cảnh.' },
  { icon: Flame, title: 'Thắp hương có chừng mực', text: 'Một nén hương với lòng thành là đủ. Cắm đúng nơi quy định, không đốt vàng mã trong khuôn viên chùa.' },
  { icon: HandHeart, title: 'Cúng dường đúng chỗ', text: 'Bỏ vào hòm công đức. Không đặt tiền lẻ lên tượng, nhét vào tay tượng hay rải khắp nơi.' },
  { icon: VolumeOff, title: 'Giữ yên lặng', text: 'Nói khẽ, để điện thoại im lặng trong chánh điện. Hỏi trước khi chụp ảnh, không quay phim lúc đang có khoá lễ.' },
  { icon: Users, title: 'Không chen lấn', text: 'Mùa lễ hội đông người, hãy kiên nhẫn chờ lượt, nhường người già và trẻ nhỏ.' },
  { icon: Leaf, title: 'Giữ gìn cảnh chùa', text: 'Không bẻ cành, hái hoa, viết vẽ lên tường. Mang rác theo hoặc bỏ đúng nơi.' },
]

const PACKING = [
  'Trang phục kín đáo, dễ đi lại',
  'Giày dép dễ cởi (nhiều nơi cần cởi giày khi vào điện)',
  'Nước uống, mũ nón',
  'Áo khoác mỏng nếu lên núi',
  'Túi nhỏ đựng rác mang về',
  'Ít tiền lẻ để cúng dường vào hòm công đức',
]

/** Danh sách chuẩn bị trước khi đi — chỉ dùng trong lúc soạn đồ nên không cần lưu lại. */
function PackingList() {
  const [done, setDone] = useState(() => new Set())
  const baseId = useId()
  const toggle = (i) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div className="rounded-3xl bg-saffron-50 p-5 ring-1 ring-saffron-200/70 dark:bg-saffron-900/15 dark:ring-saffron-800/40">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">Soạn đồ trước khi đi</h3>
        <span className="text-xs font-medium text-saffron-800 tabular-nums dark:text-saffron-200">
          {done.size}/{PACKING.length}
        </span>
      </div>
      <ul className="mt-3 space-y-1">
        {PACKING.map((item, i) => {
          const checked = done.has(i)
          const id = `${baseId}-${i}`
          return (
            <li key={item}>
              <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/60 dark:hover:bg-white/5">
                <input id={id} type="checkbox" checked={checked} onChange={() => toggle(i)} className="peer sr-only" />
                <span
                  className={cn(
                    'grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-jade-500',
                    checked ? 'border-jade-600 bg-jade-600 text-white' : 'border-stone-300 bg-white dark:border-white/20 dark:bg-night-3',
                  )}
                  aria-hidden
                >
                  {checked && <Check className="h-4 w-4" />}
                </span>
                <span className={cn('text-sm text-stone-700 dark:text-stone-300', checked && 'text-stone-400 line-through dark:text-stone-500')}>{item}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Mục "Hành trang đi chùa": lễ nghi cơ bản + danh sách soạn đồ. */
export default function EtiquetteGuide() {
  return (
    <section aria-labelledby="hh-etiquette-title">
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-widest text-jade-600 uppercase dark:text-jade-400">Hành trang đi chùa</p>
        <h2 id="hh-etiquette-title" className="mt-1 scroll-mt-24 font-serif text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-50">
          Đến chùa với tâm nhẹ nhàng
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
          Đi chùa không phải để cầu xin cho được, mà để lắng lòng và học cách sống tử tế hơn. Vài điều nhỏ giúp chuyến đi trọn vẹn.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <ul className="grid gap-3 sm:grid-cols-2">
          {MANNERS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-stone-200/70 bg-white p-4 dark:border-white/5 dark:bg-night-2">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-jade-50 text-jade-700 dark:bg-jade-900/40 dark:text-jade-300">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-stone-900 dark:text-stone-100">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <PackingList />
      </div>
    </section>
  )
}
