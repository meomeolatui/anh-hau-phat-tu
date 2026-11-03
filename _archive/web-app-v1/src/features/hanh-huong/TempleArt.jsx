import { useId, useMemo } from 'react'
import { cn } from '../../lib/cn'
import { templeArt } from './art'

/** Mái cong: hai đầu đao vểnh lên — nét đặc trưng của mái chùa Việt. */
function Roof({ cx, y, w, h, fill }) {
  const xl = cx - w / 2
  const xr = cx + w / 2
  const inset = h * 0.9
  const d = `M${xl - 10} ${y - 9} Q${xl - 2} ${y + 1} ${xl + 8} ${y} L${xr - 8} ${y} Q${xr + 2} ${y + 1} ${xr + 10} ${y - 9} L${xr - inset} ${y - h} L${xl + inset} ${y - h} Z`
  return <path d={d} fill={fill} />
}

function Hall({ p }) {
  return (
    <g>
      <rect x={118} y={196} width={164} height={6} rx={2} fill={p.roof} opacity={0.5} />
      <rect x={138} y={160} width={124} height={38} fill={p.wall} />
      {[160, 192, 224].map((x) => (
        <path key={x} d={`M${x} 198 V182 a8 8 0 0 1 16 0 V198 Z`} fill={p.roof} opacity={0.75} />
      ))}
      <Roof cx={200} y={162} w={150} h={18} fill={p.roof} />
      <rect x={166} y={130} width={68} height={16} fill={p.wall} />
      <Roof cx={200} y={132} w={104} h={16} fill={p.roof} />
      <circle cx={200} cy={111} r={4} fill={p.sun} />
    </g>
  )
}

function Tower({ p, tiers }) {
  const parts = []
  let y = 198
  for (let i = 0; i < tiers; i++) {
    const w = 62 - i * 7
    parts.push(<rect key={`w${i}`} x={200 - w / 2 + 6} y={y - 12} width={w - 12} height={12} fill={p.wall} />)
    parts.push(<Roof key={`r${i}`} cx={200} y={y - 10} w={w} h={7} fill={p.roof} />)
    y -= 19
  }
  return (
    <g>
      <rect x={160} y={196} width={80} height={6} rx={2} fill={p.roof} opacity={0.5} />
      {parts}
      <path d={`M197 ${y + 2} L200 ${y - 16} L203 ${y + 2} Z`} fill={p.sun} />
    </g>
  )
}

function Mountain({ p }) {
  return (
    <g>
      <path d="M40 204 C110 170 150 80 200 70 C250 80 290 170 360 204 Z" fill={p.near} />
      <path d="M200 70 C230 82 250 120 262 150 C240 120 222 96 200 88 Z" fill={p.wall} opacity={0.18} />
      <path d="M160 204 L178 180 L170 160 L188 138 L182 118 L196 104" fill="none" stroke={p.wall} strokeWidth={2} strokeDasharray="3 4" opacity={0.7} />
      <rect x={186} y={86} width={28} height={14} fill={p.wall} />
      <Roof cx={200} y={88} w={44} h={10} fill={p.roof} />
    </g>
  )
}

function OnWater({ p, gid }) {
  return (
    <g>
      <rect x={0} y={182} width={400} height={58} fill={`url(#${gid}-water)`} />
      {[192, 204, 216, 228].map((y, i) => (
        <path key={y} d={`M${150 - i * 12} ${y} h${100 + i * 24}`} stroke={p.wall} strokeWidth={1.5} strokeLinecap="round" opacity={0.45 - i * 0.08} />
      ))}
      <rect x={196} y={146} width={8} height={40} fill={p.roof} />
      <rect x={174} y={124} width={52} height={24} fill={p.wall} />
      <Roof cx={200} y={128} w={74} h={14} fill={p.roof} />
      <Roof cx={200} y={112} w={46} h={10} fill={p.roof} />
      <circle cx={200} cy={98} r={3.5} fill={p.sun} />
    </g>
  )
}

function Statue({ p }) {
  return (
    <g>
      <circle cx={200} cy={74} r={26} fill={p.sun} opacity={0.55} />
      <ellipse cx={200} cy={76} rx={9} ry={11} fill={p.wall} stroke={p.roof} strokeWidth={1.2} />
      <path
        d="M186 94 C192 88 208 88 214 94 C220 120 224 150 228 182 L172 182 C176 150 180 120 186 94 Z"
        fill={p.wall}
        stroke={p.roof}
        strokeWidth={1.2}
      />
      <path d="M194 112 C198 118 202 118 206 112" fill="none" stroke={p.roof} strokeWidth={1} opacity={0.6} />
      {[-30, -15, 0, 15, 30].map((dx) => (
        <ellipse key={dx} cx={200 + dx} cy={188} rx={12} ry={7} fill={p.near} />
      ))}
      <rect x={162} y={192} width={76} height={10} rx={3} fill={p.roof} opacity={0.7} />
    </g>
  )
}

function KhmerHall({ p }) {
  return (
    <g>
      <rect x={116} y={196} width={168} height={6} rx={2} fill={p.roof} opacity={0.5} />
      <rect x={134} y={164} width={132} height={34} fill={p.wall} />
      {[150, 172, 194, 216, 238].map((x) => (
        <rect key={x} x={x} y={172} width={10} height={20} rx={5} fill={p.roof} opacity={0.6} />
      ))}
      <path d="M118 168 L200 112 L282 168 Z" fill={p.roof} />
      <path d="M150 140 L200 96 L250 140 Z" fill={p.roof} opacity={0.85} />
      <path d="M118 168 q-8 -2 -6 -12 M282 168 q8 -2 6 -12" stroke={p.sun} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d="M195 102 L200 54 L205 102 Z" fill={p.sun} />
    </g>
  )
}

/**
 * Minh hoạ mái chùa cách điệu, sinh theo id. Mặc định là hình trang trí (aria-hidden);
 * truyền `label` khi bức tranh mang thông tin riêng.
 */
export default function TempleArt({ temple, className, label }) {
  const art = useMemo(() => templeArt(temple), [temple])
  // useId có thể chứa ký tự đặc biệt — làm sạch để dùng trong url(#…)
  const gid = `ta${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const p = art.palette
  const isNight = p.name === 'dem-trang'

  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      className={cn('block h-full w-full', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
        <linearGradient id={`${gid}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.far} />
          <stop offset="1" stopColor={p.near} />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${gid}-sky)`} />
      <circle cx={art.sunX} cy={art.sunY} r={isNight ? 16 : 24} fill={p.sun} opacity={0.9} />
      {isNight &&
        [40, 120, 260, 340, 300].map((x, i) => <circle key={x} cx={x} cy={24 + ((i * 17) % 50)} r={1.3} fill="#fff" opacity={0.7} />)}
      {Array.from({ length: art.birds }, (_, i) => (
        <path
          key={i}
          d={`M${300 - i * 34} ${40 + i * 12} q5 -5 10 0 q5 -5 10 0`}
          fill="none"
          stroke={p.roof}
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.5}
        />
      ))}
      <g transform={`translate(${art.ridgeShift} 0)`}>
        <path d="M-40 176 L30 128 L90 158 L160 108 L230 152 L300 116 L370 150 L440 124 L440 240 L-40 240 Z" fill={p.far} opacity={0.75} />
      </g>
      <path d="M-10 204 Q90 172 200 196 T410 188 L410 240 L-10 240 Z" fill={p.near} opacity={0.9} />
      <rect x={0} y={202} width={400} height={38} fill={p.ground} />
      {/* Cây hai bên khung tranh */}
      <g fill={p.ground} opacity={0.85}>
        <circle cx={44} cy={186} r={18} />
        <circle cx={66} cy={192} r={13} />
        <circle cx={352} cy={188} r={16} />
        <rect x={42} y={190} width={4} height={14} />
        <rect x={350} y={192} width={4} height={12} />
      </g>
      {art.kind === 'chua' && <Hall p={p} />}
      {art.kind === 'thap' && <Tower p={p} tiers={art.tiers} />}
      {art.kind === 'nui' && <Mountain p={p} />}
      {art.kind === 'nuoc' && <OnWater p={p} gid={gid} />}
      {art.kind === 'tuong' && <Statue p={p} />}
      {art.kind === 'khmer' && <KhmerHall p={p} />}
    </svg>
  )
}
