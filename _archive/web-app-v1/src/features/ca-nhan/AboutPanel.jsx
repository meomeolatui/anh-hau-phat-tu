import { Info } from 'lucide-react'
import LotusEmblem from '../home/LotusEmblem'
import Section from './Section'

export const APP_VERSION = '1.0.0'

const PRINCIPLES = [
  {
    title: 'Công cụ, không phải trò chơi',
    text: 'Không điểm thưởng, không xếp hạng, không tiền ảo. Những con số chỉ giúp bạn tự nhìn lại sự đều đặn của mình.',
  },
  {
    title: 'Riêng tư tuyệt đối',
    text: 'Không tài khoản, không quảng cáo, không gửi dữ liệu đi đâu. Nhật ký tu tập là chuyện riêng giữa bạn và chính mình.',
  },
  {
    title: 'Tu tập ở đời sống',
    text: 'Điều quý là sau khi tắt màn hình, mình sống hiền hơn, nói lời tử tế hơn và biết thương người hơn.',
  },
]

/** Giới thiệu ứng dụng, triết lý và lời nhắc tu tập ngoài đời thật. */
export default function AboutPanel() {
  return (
    <Section id="gioi-thieu" icon={Info} title="Giới thiệu & lưu ý">
      <div className="flex items-center gap-4">
        <LotusEmblem className="h-14 w-14" />
        <div>
          <p className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-50">Anh Hậu Phật Tử</p>
          <p className="text-sm text-stone-500 dark:text-stone-400">Phiên bản {APP_VERSION} · Đồng hành tu tập mỗi ngày</p>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 md:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <li key={p.title} className="rounded-2xl bg-stone-50 p-4 dark:bg-white/5">
            <p className="font-semibold text-stone-900 dark:text-stone-100">{p.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{p.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-2xl border-l-4 border-saffron-400 bg-saffron-50/70 p-4 text-sm leading-relaxed text-stone-700 dark:bg-saffron-900/20 dark:text-stone-300">
        <p className="font-semibold text-saffron-900 dark:text-saffron-200">Lời nhắc</p>
        <p className="mt-1">
          Ứng dụng chỉ là phương tiện hỗ trợ, không thay thế được việc đến chùa, nghe pháp và học hỏi từ chư Tăng Ni. Nội dung
          kinh văn và giáo lý trong ứng dụng được trình bày giản lược; khi có thắc mắc, xin hãy thưa hỏi quý thầy cô có uy tín.
          Bấm màn hình không tự nhiên sinh công đức — sự chuyển hoá đến từ tâm và hành động mỗi ngày.
        </p>
      </div>
    </Section>
  )
}
