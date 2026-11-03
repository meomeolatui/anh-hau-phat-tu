import { useEffect, useState } from 'react'
import Sheet from './Sheet'
import { runtime } from '../runtime'
import { useGame } from '../state'
import { CABLE_STATIONS, WALKABLES, ZONES } from '../world/layout'
import { STELES } from '../world/steles'

/**
 * Bản đồ 2D nhìn từ trên xuống: các khu vực, đường bậc đá, ga cáp treo, bia đã tìm, vị trí người chơi.
 * Toạ độ thế giới (x, z) → SVG: x ngang, z dọc (đỉnh núi ở trên).
 */
const VIEW = { x0: -110, x1: 80, z0: -285, z1: 40 }
const W = VIEW.x1 - VIEW.x0
const H = VIEW.z1 - VIEW.z0

function shapeEl(s) {
  if (s.type === 'circle') return <circle key={s.id} cx={s.cx} cy={s.cz} r={s.r} />
  if (s.type === 'rect') return <rect key={s.id} x={s.cx - s.w / 2} y={s.cz - s.d / 2} width={s.w} height={s.d} rx={3} />
  return <line key={s.id} x1={s.from[0]} y1={s.from[1]} x2={s.to[0]} y2={s.to[1]} strokeWidth={s.width} strokeLinecap="round" />
}

export default function MapPanel() {
  const discovered = useGame((s) => s.save.discovered)
  const [pos, setPos] = useState(() => ({ x: runtime.player.position.x, z: runtime.player.position.z, r: runtime.player.rotY }))
  useEffect(() => {
    const t = setInterval(() => setPos({ x: runtime.player.position.x, z: runtime.player.position.z, r: runtime.player.rotY }), 250)
    return () => clearInterval(t)
  }, [])
  const labels = {
    'chan-nui': [0, 34],
    'chua-ba': [0, -106],
    'chua-hang': [-76, -170],
    'dinh-nui': [0, -277],
  }

  return (
    <Sheet title="Bản đồ núi Bà Đen" subtitle="Phỏng theo cảnh quan — không theo tỉ lệ thật" wide>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-[#cfe3d2] to-[#e9efd9]">
        <svg viewBox={`${VIEW.x0} ${VIEW.z0} ${W} ${H}`} className="mx-auto block max-h-[60dvh] w-full" role="img" aria-label="Bản đồ các khu vực trên núi">
          {/* Đường đồng mức núi */}
          {[150, 115, 85, 60, 38].map((r, i) => (
            <circle key={r} cx={0} cy={-238} r={r} fill={`rgba(63,116,66,${0.07 + i * 0.05})`} />
          ))}
          <g fill="#e7dcc4" stroke="#cdbfa6">
            {WALKABLES.filter((s) => s.type !== 'ramp').map(shapeEl)}
          </g>
          <g stroke="#cdbfa6" fill="none">
            {WALKABLES.filter((s) => s.type === 'ramp').map(shapeEl)}
          </g>
          {/* Cáp treo */}
          <polyline
            points={['chan-nui', 'chua-ba', 'dinh-nui'].map((k) => `${CABLE_STATIONS[k].position[0]},${CABLE_STATIONS[k].position[2]}`).join(' ')}
            fill="none"
            stroke="#5b4636"
            strokeWidth={0.8}
            strokeDasharray="3 2"
          />
          {Object.values(CABLE_STATIONS).map((s) => (
            <rect key={s.name} x={s.position[0] - 2.5} y={s.position[2] - 2.5} width={5} height={5} rx={1} fill="#5b4636" />
          ))}
          {STELES.map((s) => (
            <circle key={s.id} cx={s.position[0]} cy={s.position[2]} r={2} fill={discovered.steles.includes(s.id) ? '#d9a441' : '#9a9488'} stroke="#fff" strokeWidth={0.6} />
          ))}
          {Object.entries(labels).map(([id, [x, z]]) => {
            const known = discovered.zones.includes(id)
            return (
              <text key={id} x={x} y={z} textAnchor="middle" fontSize={7} fontWeight={600} fill={known ? '#163f3a' : '#7c776d'}>
                {known ? ZONES[id].name : '???'}
              </text>
            )
          })}
          {/* Người chơi */}
          <g transform={`translate(${pos.x} ${pos.z}) rotate(${(-pos.r * 180) / Math.PI})`}>
            <circle r={4.5} fill="#e8497d" stroke="#fff" strokeWidth={1.2} />
            <path d="M0 7 L-2.5 2.5 L2.5 2.5 Z" fill="#fff" />
          </g>
        </svg>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-600">
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-full bg-lotus-500" /> Bạn
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-full bg-[#d9a441]" /> Bia đã đọc
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-full bg-[#9a9488]" /> Bia chưa tìm
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-3 w-3 rounded-sm bg-[#5b4636]" /> Ga cáp treo
        </span>
      </div>
    </Sheet>
  )
}
