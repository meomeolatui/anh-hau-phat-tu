import { useMemo, useState } from 'react'
import { GraduationCap, SearchX } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Segmented from '../components/ui/Segmented'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { useStore } from '../lib/store'
import { LESSONS, LEVELS } from '../data/lessons'
import { filterByLevel, nextLesson, overallProgress, progressByLevel } from '../features/hoc-phat/learning'
import LearningOverview from '../features/hoc-phat/LearningOverview'
import LessonPath from '../features/hoc-phat/LessonPath'
import StudyNote from '../features/hoc-phat/StudyNote'

const FILTERS = [{ value: 'all', label: 'Tất cả' }, ...LEVELS.map((l) => ({ value: l.id, label: l.label }))]

// Số thứ tự cố định theo toàn lộ trình, để lọc cấp độ không làm đổi "Bài 5" thành "Bài 1".
const NUMBERS = Object.fromEntries(LESSONS.map((l, i) => [l.id, i + 1]))

export default function HocPhat() {
  const completed = useStore((s) => s.lessons.completed)
  const [level, setLevel] = useState('all')

  const overall = useMemo(() => overallProgress(LESSONS, completed), [completed])
  const levelProgress = useMemo(() => progressByLevel(LESSONS, completed, LEVELS), [completed])
  const suggestion = useMemo(() => nextLesson(LESSONS, completed), [completed])
  const visible = useMemo(() => filterByLevel(LESSONS, level), [level])

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Lộ trình nhập môn"
        title="Học Phật"
        subtitle="Những bài học ngắn, giản dị về giáo lý căn bản — đọc chậm, hiểu sâu, rồi ôn lại bằng vài câu trắc nghiệm nhẹ nhàng."
        icon={GraduationCap}
      />

      <LearningOverview overall={overall} levels={LEVELS} levelProgress={levelProgress} suggestion={suggestion} />

      <div className="mt-10 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-2xl font-semibold text-stone-900 dark:text-stone-50">Lộ trình bài học</h2>
        <Segmented options={FILTERS} value={level} onChange={setLevel} aria-label="Lọc theo cấp độ" />
      </div>

      {visible.length ? (
        <LessonPath levels={LEVELS} lessons={visible} completed={completed} numbers={NUMBERS} nextId={suggestion?.lesson.id} />
      ) : (
        <EmptyState
          icon={SearchX}
          title="Chưa có bài học ở cấp độ này"
          description="Các bài mới sẽ được bổ sung dần. Bạn có thể xem toàn bộ lộ trình."
          action={
            <Button variant="secondary" onClick={() => setLevel('all')}>
              Xem tất cả
            </Button>
          }
        />
      )}

      <StudyNote className="mt-10" />
    </div>
  )
}
