import { Compass } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'

export default function NotFound() {
  return (
    <>
      <PageHeader title="Không tìm thấy trang" subtitle="Đường này có lẽ chưa được mở. Mời bạn quay về trang Hôm nay." />
      <EmptyState
        icon={Compass}
        title="Lạc đường một chút cũng không sao"
        description="Mỗi bước chân quay về đều là một bước an lạc."
        action={<Button to="/">Về trang Hôm nay</Button>}
      />
    </>
  )
}
