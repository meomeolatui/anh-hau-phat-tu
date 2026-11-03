import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ArrowLeft, Dices, Mountain } from 'lucide-react'
import Avatar from '../game/player/Avatar'
import { HAIRS, OUTFITS, ROLES, SKINS } from '../game/player/looks'
import { createProfile, getGame, setScreen, updateProfile } from '../game/state'
import { cn } from '../lib/cn'

/** Gợi ý tên/pháp danh: ghép hai chữ đẹp (chỉ là gợi ý, người chơi tự đặt) */
const NAME_A = ['Tâm', 'Diệu', 'Thiện', 'Minh', 'Quảng', 'Huệ', 'Như', 'Đồng', 'Nhật', 'Phước']
const NAME_B = ['An', 'Hạnh', 'Từ', 'Liên', 'Hoà', 'Tịnh', 'Ngọc', 'Quang', 'Đức', 'Hiền']
const randomName = () => `${NAME_A[Math.floor(Math.random() * NAME_A.length)]} ${NAME_B[Math.floor(Math.random() * NAME_B.length)]}`

function Turntable({ look }) {
  const ref = useRef()
  const source = useMemo(() => ({ anim: 'pray', speed: 0, holding: null }), [])
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.5
  })
  return (
    <group ref={ref} position={[0, -0.9, 0]}>
      <Avatar source={source} profile={look} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[0.9, 32]} />
        <meshToonMaterial color="#d9cdb4" />
      </mesh>
    </group>
  )
}

function OptionRow({ label, children }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-stone-700">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  )
}

function Chip({ active, onClick, children, className, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-2xl border-2 px-3.5 py-2 text-sm font-medium transition',
        active ? 'border-jade-600 bg-jade-50 text-jade-900' : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default function CreateCharacter() {
  const existing = getGame().save.profile
  const [name, setName] = useState(existing?.name ?? '')
  const [role, setRole] = useState(existing?.role ?? 'phat-tu')
  const [outfit, setOutfit] = useState(existing?.outfit ?? 'lam')
  const [skin, setSkin] = useState(existing?.skin ?? SKINS[1])
  const [hair, setHair] = useState(existing?.hair ?? 'ngan')
  const [agree, setAgree] = useState(!!existing)
  const [error, setError] = useState('')
  const look = { role, outfit, skin, hair }

  const submit = (e) => {
    e.preventDefault()
    const clean = name.trim().replace(/\s+/g, ' ')
    if (clean.length < 2) return setError('Tên cần ít nhất 2 ký tự.')
    if (clean.length > 24) return setError('Tên tối đa 24 ký tự.')
    if (!agree) return setError('Bạn hãy xác nhận đã đọc lưu ý trước khi lên núi.')
    if (existing) {
      updateProfile({ name: clean, ...look })
      setScreen('game')
    } else {
      createProfile({ name: clean, ...look })
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-[#f3e2c8] via-paper to-[#dcebe4]">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-12">
        <div className="relative h-[42dvh] min-h-64 overflow-hidden rounded-4xl bg-gradient-to-b from-[#f6d6ae] to-[#cfe3d2] shadow-soft lg:h-[70dvh]">
          <Canvas shadows="percentage" camera={{ fov: 32, position: [0, 0.6, 4.6] }} dpr={[1, 2]}>
            <hemisphereLight args={['#fff4e0', '#6b8a5c', 1.4]} />
            <directionalLight position={[3, 5, 4]} intensity={2} castShadow />
            <Turntable look={look} />
          </Canvas>
          <button
            type="button"
            onClick={() => setScreen('title')}
            className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm backdrop-blur hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 rounded-4xl bg-white/80 p-5 shadow-soft backdrop-blur sm:p-7">
          <header>
            <h1 className="font-serif text-3xl font-semibold text-jade-950">{existing ? 'Sửa nhân vật' : 'Chuẩn bị lên núi'}</h1>
            <p className="mt-1 text-sm text-stone-600">Chọn dáng vẻ của bạn trên hành trình hành hương.</p>
          </header>

          <div>
            <label htmlFor="ten" className="mb-2 block text-sm font-semibold text-stone-700">
              Tên hoặc pháp danh
            </label>
            <div className="flex gap-2">
              <input
                id="ten"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                maxLength={24}
                placeholder="Ví dụ: Tâm An"
                className="h-12 flex-1 rounded-2xl border border-stone-300 bg-white px-4 text-base focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none"
                autoComplete="off"
              />
              <button type="button" onClick={() => setName(randomName())} className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-100 hover:bg-stone-200" aria-label="Gợi ý tên">
                <Dices className="h-5 w-5" />
              </button>
            </div>
          </div>

          <OptionRow label="Vai">
            {Object.entries(ROLES).map(([id, r]) => (
              <Chip
                key={id}
                active={role === id}
                onClick={() => {
                  setRole(id)
                  if (id === 'chu-tieu') setOutfit('nau')
                  if (id === 'ni-co') setOutfit('xam')
                }}
                title={r.desc}
              >
                {r.label}
              </Chip>
            ))}
          </OptionRow>

          <OptionRow label="Trang phục">
            {Object.entries(OUTFITS).map(([id, o]) => (
              <Chip key={id} active={outfit === id} onClick={() => setOutfit(id)} className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: o.color }} />
                {o.label}
              </Chip>
            ))}
          </OptionRow>

          <OptionRow label="Màu da">
            {SKINS.map((c, i) => (
              <button
                key={c}
                type="button"
                onClick={() => setSkin(c)}
                aria-label={`Màu da ${i + 1}`}
                aria-pressed={skin === c}
                className={cn('h-10 w-10 rounded-full ring-offset-2 transition', skin === c ? 'ring-3 ring-jade-600' : 'ring-1 ring-black/10')}
                style={{ background: c }}
              />
            ))}
          </OptionRow>

          {role === 'phat-tu' && (
            <OptionRow label="Kiểu tóc">
              {Object.entries(HAIRS)
                .filter(([id]) => id !== 'cao')
                .map(([id, label]) => (
                  <Chip key={id} active={hair === id} onClick={() => setHair(id)}>
                    {label}
                  </Chip>
                ))}
            </OptionRow>
          )}

          <label className="flex items-start gap-3 rounded-2xl bg-jade-50 p-3.5 text-sm text-jade-950">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-jade-700" />
            <span>
              Tôi hiểu đây là trò chơi phỏng theo cảnh quan núi Bà Đen; công đức trong game chỉ là điểm số. Dữ liệu chơi chỉ lưu trên thiết bị này.
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button type="submit" className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-jade-800 text-lg font-semibold text-white shadow-lg hover:bg-jade-900">
            <Mountain className="h-5 w-5" /> {existing ? 'Lưu & tiếp tục' : 'Lên núi'}
          </button>
        </form>
      </div>
    </main>
  )
}
