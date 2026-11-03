import { useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { getSutra } from '../data/sutras'
import SutraReader from '../features/kinh/SutraReader'

export default function KinhDetail() {
  const { id } = useParams()
  const sutra = getSutra(id)

  if (!sutra) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="Không tìm thấy bài" subtitle="Đường dẫn có thể đã cũ hoặc gõ chưa đúng." icon={BookOpen} />
        <EmptyState
          icon={BookOpen}
          title="Bài kinh này chưa có trong thư viện"
          description="Bạn có thể quay lại thư viện để tìm bài khác — gõ không dấu cũng tìm được."
          action={
            <Button to="/kinh">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Về thư viện kinh
            </Button>
          }
        />
      </div>
    )
  }

  // key={id}: chuyển sang bài khác (vd. từ nghi thức mở bài dẫn chiếu) thì trình đọc bắt đầu lại từ trạng thái của bài mới
  return <SutraReader key={sutra.id} sutra={sutra} />
}
