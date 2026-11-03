import { useId } from 'react'

/**
 * Hình minh hoạ (SVG) cho từng món y phục — vẽ từ chính dữ liệu trong wardrobe.js (màu, cà sa, da hổ,
 * áo choàng, binh khí, kiểu mũ) nên luôn khớp với đồ mặc trong game.
 */

const SKIN = '#eec09a'
const OUTLINE = 'rgba(40,28,20,0.35)'

/* ---------------- Áo (treo trên mắc) ---------------- */

function BackItem({ kind }) {
  if (kind === 'gay-nhu-y') {
    return (
      <g strokeLinecap="round">
        <line x1="9" y1="58" x2="55" y2="6" stroke="#b0262a" strokeWidth="3" />
        <line x1="9" y1="58" x2="13" y2="53.5" stroke="#f0c75a" strokeWidth="4" />
        <line x1="51" y1="10.5" x2="55" y2="6" stroke="#f0c75a" strokeWidth="4" />
      </g>
    )
  }
  if (kind === 'cao-cuu-rang') {
    return (
      <g strokeLinecap="round">
        <line x1="54" y1="58" x2="14" y2="10" stroke="#7a4a26" strokeWidth="2.5" />
        <g transform="translate(14 10) rotate(-40)">
          <rect x="-9" y="-2" width="18" height="4" rx="1" fill="#c9ccd2" stroke={OUTLINE} strokeWidth="0.5" />
          {[-7.5, -5.6, -3.7, -1.8, 0, 1.8, 3.7, 5.6, 7.5].map((x) => (
            <line key={x} x1={x} y1="-2" x2={x} y2="-6" stroke="#c9ccd2" strokeWidth="1.1" />
          ))}
        </g>
      </g>
    )
  }
  if (kind === 'nguyet-xan') {
    return (
      <g strokeLinecap="round">
        <line x1="10" y1="57" x2="53" y2="9" stroke="#7a4a26" strokeWidth="2.5" />
        <path d="M47 5 A7 7 0 0 0 59 13" fill="none" stroke="#c9ccd2" strokeWidth="2.6" />
        <rect x="5" y="55" width="8" height="7" rx="1.5" fill="#c9ccd2" transform="rotate(42 9 58.5)" />
      </g>
    )
  }
  return null
}

export function CostumeArt({ item }) {
  const id = useId().replace(/:/g, '')
  const robe = item.robe
  const skirt = item.skirt ?? robe
  const sash = item.sash ?? robe
  const k = item.kasaya
  const leftSleeve = k ? k.color : robe
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      {k && (
        <defs>
          {/* Vân ô ruộng của cà sa */}
          <pattern id={`ruong${id}`} width="16" height="12" patternUnits="userSpaceOnUse">
            <rect width="16" height="12" fill={k.color} />
            <path d="M0 0V12M8 0V12M16 0V12M0 4H8M8 9H16" stroke={k.line} strokeWidth={k.rich ? 1.3 : 0.9} />
            {k.rich && <circle cx="4" cy="8.5" r="1" fill={k.line} />}
          </pattern>
        </defs>
      )}
      {item.back && <BackItem kind={item.back} />}
      {/* Mắc áo */}
      <path d="M32 9 Q32 4 35 4.5 Q37.5 5.5 35.5 7.5" fill="none" stroke="#7a5a3a" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M32 9 L19 14 M32 9 L45 14" stroke="#7a5a3a" strokeWidth="1.3" strokeLinecap="round" />
      {item.cape && <path d="M19 14 L45 14 L54 61 L10 61 Z" fill={item.cape} stroke={OUTLINE} strokeWidth="0.6" />}
      {/* Tay áo loe */}
      <path d="M21 15 L11 37 L18.5 39.5 L25 23 Z" fill={leftSleeve} stroke={OUTLINE} strokeWidth="0.6" />
      <path d="M43 15 L53 37 L45.5 39.5 L39 23 Z" fill={robe} stroke={OUTLINE} strokeWidth="0.6" />
      {/* Vạt áo */}
      <path d="M21.5 33 L42.5 33 L49 59 L15 59 Z" fill={skirt} stroke={OUTLINE} strokeWidth="0.6" />
      {item.skirtPattern === 'tiger' && (
        <g fill="#2a1a12">
          {[19, 25, 31, 37, 43].map((x, i) => (
            <path key={x} d={`M${x} ${36 + (i % 2) * 4} q2 5 0 10 q-1.2 -5 0 -10z`} />
          ))}
        </g>
      )}
      {/* Thân áo */}
      <path d="M19.5 14.5 Q32 10.5 44.5 14.5 L43 34 L21 34 Z" fill={robe} stroke={OUTLINE} strokeWidth="0.6" />
      {item.belly && <ellipse cx="32" cy="29" rx="10.5" ry="7.5" fill={robe} stroke={OUTLINE} strokeWidth="0.6" />}
      {/* Cổ áo giao lĩnh */}
      <path d="M27 13 L33.5 23 L38 13" fill="none" stroke={sash} strokeWidth="2" strokeLinejoin="round" />
      {/* Cà sa vắt vai trái, mép chéo xuống hông phải, phủ vạt tới gần gấu */}
      {k && (
        <>
          <path d="M19.5 14.5 L31 12 L44 35 L46.7 53 L16.4 53 L21 34 Z" fill={`url(#ruong${id})`} stroke={OUTLINE} strokeWidth="0.6" />
          <circle cx="34.5" cy="22.5" r="1.8" fill="none" stroke={k.rich ? '#f0c75a' : k.line} strokeWidth="1" />
        </>
      )}
      <rect x="21" y="32" width="22" height="3.2" rx="1" fill={sash} />
      {item.pauldrons && (
        <>
          <ellipse cx="20" cy="16" rx="5.5" ry="3.2" fill={item.pauldrons} stroke={OUTLINE} strokeWidth="0.5" />
          <ellipse cx="44" cy="16" rx="5.5" ry="3.2" fill={item.pauldrons} stroke={OUTLINE} strokeWidth="0.5" />
        </>
      )}
      {item.necklace &&
        Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI * (0.1 + (0.8 * i) / 8)
          return <circle key={i} cx={32 - Math.cos(a) * 9} cy={14 + Math.sin(a) * 10} r="1.9" fill={i === 4 ? sash : item.necklace} stroke={OUTLINE} strokeWidth="0.4" />
        })}
      {/* Bàn tay ló khỏi tay áo */}
      <circle cx="14.5" cy="39.5" r="2.3" fill={SKIN} />
      <circle cx="49.5" cy="39.5" r="2.3" fill={SKIN} />
    </svg>
  )
}

/* ---------------- Mũ mão (đội trên đầu) ---------------- */

function Head({ skin, cy = 44 }) {
  return (
    <g>
      <circle cx="32" cy={cy} r="12.5" fill={skin} stroke={OUTLINE} strokeWidth="0.6" />
      <circle cx="27.5" cy={cy + 1.5} r="1.3" fill="#2b1d16" />
      <circle cx="36.5" cy={cy + 1.5} r="1.3" fill="#2b1d16" />
      <path d={`M29.5 ${cy + 6} q2.5 2 5 0`} fill="none" stroke="#a8564c" strokeWidth="1" strokeLinecap="round" />
    </g>
  )
}

const Strap = ({ color }) => <path d="M21 37 Q32 63 43 37" fill="none" stroke={color} strokeWidth="1.2" />

function KimCo({ c }) {
  return (
    <g>
      <ellipse cx="32" cy="36" rx="13" ry="3.4" fill="none" stroke={c.main} strokeWidth="2.6" />
      <circle cx="19" cy="36.5" r="1.8" fill="none" stroke={c.line} strokeWidth="1.1" />
      <circle cx="45" cy="36.5" r="1.8" fill="none" stroke={c.line} strokeWidth="1.1" />
    </g>
  )
}

export function HatArt({ item, skin = SKIN }) {
  const c = item.colors
  const stroke = { stroke: OUTLINE, strokeWidth: 0.6 }
  let hat = null
  switch (item.kind) {
    case 'non-la':
      hat = (
        <>
          <path d="M32 7 L59 34 Q32 39 5 34 Z" fill={c.main} {...stroke} />
          <path d="M20.5 19 H43.5 M14 26 H50 M9 31 Q32 35 55 31" fill="none" stroke={c.line} strokeWidth="0.9" />
          <Strap color={c.strap} />
        </>
      )
      break
    case 'quai-thao':
      hat = (
        <>
          <rect x="22" y="27" width="20" height="7" fill={c.main} {...stroke} />
          <ellipse cx="32" cy="27" rx="28" ry="7.5" fill={c.main} {...stroke} />
          <ellipse cx="32" cy="26.3" rx="25" ry="5.8" fill="none" stroke={c.line} strokeWidth="1" />
          {[6, 8.5, 11, 53, 55.5, 58].map((x) => (
            <line key={x} x1={x} y1="30" x2={x + (x < 32 ? -0.5 : 0.5)} y2={47 + (x % 3)} stroke={c.line} strokeWidth="1" strokeLinecap="round" />
          ))}
          <Strap color={c.strap} />
        </>
      )
      break
    case 'khan-dong':
      hat = (
        <>
          <ellipse cx="32" cy="23" rx="12" ry="3.5" fill={c.main} {...stroke} />
          <rect x="19" y="23" width="26" height="5" rx="2.5" fill={c.main} transform="rotate(-4 32 25)" {...stroke} />
          <rect x="18.5" y="27.5" width="27" height="5" rx="2.5" fill={c.line} transform="rotate(4 32 30)" {...stroke} />
          <rect x="18.5" y="32" width="27" height="5" rx="2.5" fill={c.main} transform="rotate(-4 32 34.5)" {...stroke} />
        </>
      )
      break
    case 'canh-chuon':
      hat = (
        <>
          <line x1="22" y1="26" x2="13" y2="24" stroke={c.main} strokeWidth="1.4" />
          <line x1="42" y1="26" x2="51" y2="24" stroke={c.main} strokeWidth="1.4" />
          <ellipse cx="9" cy="24" rx="7.5" ry="4.5" fill={c.main} stroke={c.line} strokeWidth="1" />
          <ellipse cx="55" cy="24" rx="7.5" ry="4.5" fill={c.main} stroke={c.line} strokeWidth="1" />
          <ellipse cx="32" cy="20" rx="9" ry="7" fill={c.main} {...stroke} />
          <path d="M19.5 37 Q19 22 32 22 Q45 22 44.5 37 Z" fill={c.main} {...stroke} />
          <rect x="19.5" y="33.5" width="25" height="2.2" fill={c.line} />
        </>
      )
      break
    case 'than-tai':
      hat = (
        <>
          <ellipse cx="13" cy="17" rx="7.5" ry="4" fill={c.main} stroke={c.line} strokeWidth="1" transform="rotate(-35 13 17)" />
          <ellipse cx="51" cy="17" rx="7.5" ry="4" fill={c.main} stroke={c.line} strokeWidth="1" transform="rotate(35 51 17)" />
          <path d="M19 37 L19 20 Q32 11 45 20 L45 37 Z" fill={c.main} {...stroke} />
          <rect x="18.5" y="32.5" width="27" height="4.5" fill={c.line} />
          <path d="M19.2 21.5 Q32 15 44.8 21.5" fill="none" stroke={c.line} strokeWidth="1.6" />
          <circle cx="32" cy="27" r="3.2" fill={c.gem} stroke={c.line} strokeWidth="1.2" />
          <circle cx="32" cy="13.5" r="2.6" fill={c.line} />
        </>
      )
      break
    case 'vuong-mien':
      hat = (
        <>
          <path d="M19 36 L19 25 L23.5 30 L27 20 L32 28 L37 20 L40.5 30 L45 25 L45 36 Z" fill={c.main} stroke={c.line} strokeWidth="0.9" strokeLinejoin="round" />
          <rect x="19" y="32.5" width="26" height="3.5" fill={c.line} />
          {[
            [27, 22.5, 1.4],
            [32, 30, 2],
            [37, 22.5, 1.4],
          ].map(([x, y, r]) => (
            <circle key={x} cx={x} cy={y} r={r} fill={c.gem} />
          ))}
        </>
      )
      break
    case 'kim-co':
      hat = <KimCo c={c} />
      break
    case 'te-thien':
      hat = (
        <>
          <path d="M29 26 Q16 4 2 5" fill="none" stroke={c.feather} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M35 26 Q48 4 62 5" fill="none" stroke={c.feather} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="3" cy="5" r="1.8" fill={c.tip} />
          <circle cx="61" cy="5" r="1.8" fill={c.tip} />
          <path d="M25 33 L25 25 Q32 19 39 25 L39 33 Z" fill={c.main} stroke={c.line} strokeWidth="0.8" />
          <path d="M32 18 L34.5 25 L29.5 25 Z" fill={c.main} stroke={c.line} strokeWidth="0.6" />
          <circle cx="32" cy="28.5" r="1.4" fill={c.feather} />
          <KimCo c={c} />
        </>
      )
      break
    case 'ty-lu':
      hat = (
        <>
          <line x1="20.5" y1="40" x2="19" y2="58" stroke={c.panel} strokeWidth="2.6" strokeLinecap="round" />
          <line x1="43.5" y1="40" x2="45" y2="58" stroke={c.panel} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M19.5 37 Q19 25 32 25 Q45 25 44.5 37 Z" fill={c.panel} {...stroke} />
          {[
            [19.5, 27, -24],
            [25.5, 23.5, -12],
            [32, 22, 0],
            [38.5, 23.5, 12],
            [44.5, 27, 24],
          ].map(([x, y, r]) => (
            <g key={x} transform={`rotate(${r} ${x} ${y})`}>
              <ellipse cx={x} cy={y} rx="3.6" ry="6.5" fill={c.panel} stroke={c.main} strokeWidth="1.1" />
              <circle cx={x} cy={y - 1.5} r="1.4" fill={c.main} />
              <circle cx={x} cy={y + 3} r="0.9" fill={c.gem} />
            </g>
          ))}
          <rect x="19" y="33.5" width="26" height="3" fill={c.main} />
        </>
      )
      break
    default:
      hat = null
  }
  return (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden>
      <Head skin={skin} />
      {hat}
    </svg>
  )
}
