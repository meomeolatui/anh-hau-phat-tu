import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck, Clock, Info, Landmark, MapPin, Navigation, ShieldCheck, Sparkles } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card, { CardTitle } from '../components/ui/Card'
import { TEMPLES, getTemple, regionLabel } from '../data/temples'
import { useStore } from '../lib/store'
import TempleArt from '../features/hanh-huong/TempleArt'
import TempleCard from '../features/hanh-huong/TempleCard'
import VisitLog from '../features/hanh-huong/VisitLog'
import WishlistButton from '../features/hanh-huong/WishlistButton'
import { mapsUrl, nearbyTemples, statusOf } from '../features/hanh-huong/pilgrimage'

// Lưu ý chung luôn hiển thị kèm lưu ý riêng của từng chùa
const BASIC_NOTES = ['Mặc trang phục kín đáo, nói khẽ trong chánh điện', 'Cúng dường vào hòm công đức, không đặt tiền lên tượng']

function BackLink() {
  return (
    <Link
      to="/hanh-huong"
      className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-stone-600 hover:text-jade-700 dark:text-stone-400 dark:hover:text-jade-300"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Danh bạ chùa
    </Link>
  )
}

function NotFound() {
  return (
    <div>
      <BackLink />
      <PageHeader title="Không tìm thấy chùa" icon={Landmark} />
      <EmptyState
        icon={Landmark}
        title="Ngôi chùa này không có trong danh bạ"
        description="Có thể liên kết đã cũ hoặc gõ nhầm. Hãy quay lại danh bạ để tìm theo tên hoặc theo tỉnh."
        action={<Button to="/hanh-huong">Về danh bạ chùa</Button>}
      />
    </div>
  )
}

function InfoRow({ label, children }) {
  if (!children) return null
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <dt className="text-xs font-medium tracking-wide text-stone-500 uppercase dark:text-stone-400">{label}</dt>
      <dd className="mt-0.5 text-stone-800 dark:text-stone-200">{children}</dd>
    </div>
  )
}

export default function HanhHuongDetail() {
  const { id } = useParams()
  const temple = id ? getTemple(id) : null
  const pilgrimage = useStore((s) => s.pilgrimage)
  const nearby = useMemo(() => nearbyTemples(temple, TEMPLES, 3), [temple])

  if (!temple) return <NotFound />

  const status = statusOf(temple.id, pilgrimage)
  const sameProvince = nearby.some((t) => t.province === temple.province)
  const notes = [...(temple.etiquette ?? []), ...BASIC_NOTES]

  return (
    <div>
      <BackLink />
      <PageHeader
        eyebrow={regionLabel(temple.region)}
        title={temple.name}
        subtitle={temple.alias ? `Còn gọi: ${temple.alias}` : temple.province}
        icon={Landmark}
        actions={
          <>
            <Button href={mapsUrl(temple)} target="_blank" rel="noopener noreferrer" size="lg">
              <Navigation className="h-5 w-5" aria-hidden />
              Chỉ đường
              <span className="sr-only">(mở Google Maps trong thẻ mới)</span>
            </Button>
            {status !== 'visited' && <WishlistButton temple={temple} variant="button" />}
          </>
        }
      />

      <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-4xl shadow-soft sm:aspect-[16/7]">
        <TempleArt temple={temple} label={`Minh hoạ cách điệu ${temple.name}`} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-6">
          <p className="flex max-w-xl items-start gap-2 text-sm font-medium text-white sm:text-base">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {temple.address}
          </p>
          {status === 'visited' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-jade-600 px-3 py-1.5 text-sm font-semibold text-white">
              <CircleCheck className="h-4 w-4" aria-hidden />
              Đã viếng
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardTitle icon={Landmark}>Giới thiệu</CardTitle>
            <p className="font-serif text-lg leading-relaxed text-stone-800 dark:text-stone-200">{temple.summary}</p>
            {temple.tradition && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="jade">{temple.tradition}</Badge>
                {temple.founded && <Badge tone="saffron">Khởi dựng: {temple.founded}</Badge>}
              </div>
            )}
          </Card>

          <Card>
            <CardTitle icon={Sparkles}>Điểm nổi bật</CardTitle>
            <ul className="grid gap-3 sm:grid-cols-2">
              {temple.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 rounded-2xl bg-paper p-3 dark:bg-night-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-saffron-100 text-saffron-700 dark:bg-saffron-900/40 dark:text-saffron-300" aria-hidden>
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-stone-700 dark:text-stone-300">{h}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle icon={ShieldCheck}>Lưu ý khi viếng</CardTitle>
            <ul className="space-y-2.5">
              {notes.map((n) => (
                <li key={n} className="flex items-start gap-3 text-stone-700 dark:text-stone-300">
                  <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-jade-600 dark:text-jade-400" aria-hidden />
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
              Xem thêm phần{' '}
              <Link to="/hanh-huong#hh-etiquette-title" className="font-medium text-jade-700 underline underline-offset-4 dark:text-jade-300">
                Hành trang đi chùa
              </Link>
              .
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle icon={Info}>Thông tin</CardTitle>
            <dl className="divide-y divide-stone-100 dark:divide-white/5">
              <InfoRow label="Tỉnh/thành">{temple.province}</InfoRow>
              <InfoRow label="Địa chỉ">{temple.address}</InfoRow>
              <InfoRow label="Miền">{regionLabel(temple.region)}</InfoRow>
              <InfoRow label="Truyền thống">{temple.tradition}</InfoRow>
              <InfoRow label="Khởi dựng">{temple.founded}</InfoRow>
              <InfoRow label="Nên đến">
                {temple.bestTime && (
                  <span className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-saffron-600 dark:text-saffron-400" aria-hidden />
                    {temple.bestTime}
                  </span>
                )}
              </InfoRow>
            </dl>
          </Card>
          <VisitLog temple={temple} />
        </div>
      </div>

      {nearby.length > 0 && (
        <section aria-labelledby="hh-nearby-title" className="mt-12">
          <p className="text-xs font-semibold tracking-widest text-jade-600 uppercase dark:text-jade-400">Chùa gần đó</p>
          <h2 id="hh-nearby-title" className="mt-1 mb-4 font-serif text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-50">
            {sameProvince ? `Cũng ở ${temple.province} và lân cận` : `Những ngôi chùa khác thuộc ${regionLabel(temple.region)}`}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {nearby.map((t) => (
              <li key={t.id} className="flex">
                <TempleCard temple={t} status={statusOf(t.id, pilgrimage)} visit={pilgrimage.visited[t.id]} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
