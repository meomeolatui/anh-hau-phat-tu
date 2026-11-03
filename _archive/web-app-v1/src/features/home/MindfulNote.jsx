import LotusEmblem from './LotusEmblem'

/** Lời nhắc khiêm cung cuối trang: ứng dụng chỉ là phương tiện. */
export default function MindfulNote() {
  return (
    <aside className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-jade-200 bg-jade-50/50 px-6 py-8 text-center dark:border-jade-900 dark:bg-jade-950/30">
      <LotusEmblem className="h-9 w-9 opacity-90" />
      <p className="max-w-2xl font-serif text-base leading-relaxed text-stone-700 sm:text-lg dark:text-stone-300">
        Ứng dụng chỉ là người bạn nhắc nhở. Khi có điều kiện, hãy về chùa lễ Phật, nghe pháp và thưa hỏi chư Tăng Ni.
        Sau khi tắt màn hình, mong bạn làm thêm một việc lành.
      </p>
      <p className="text-sm font-medium text-jade-700 dark:text-jade-300">Nam mô A Di Đà Phật</p>
    </aside>
  )
}
