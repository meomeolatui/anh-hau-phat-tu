import { Vector4 } from 'three'
import { toon } from '../materials'

/**
 * Gió: vật liệu toon có vertex shader đung đưa (tán cây, tre, cỏ, hoa) — không di chuyển mesh bằng JS.
 * Mọi vật liệu gió dùng chung đồng hồ WIND.time (WindClock trong nature.jsx cập nhật mỗi khung hình)
 * và chung một chương trình shader (chỉ khác uniform) → không tốn thêm biên dịch.
 *
 * Dịch chuyển tính trong toạ độ THẾ GIỚI sau instanceMatrix: pha theo vị trí (x, z) nên các khối
 * gần nhau lắc cùng nhịp như một đợt gió lướt qua.
 */

export const WIND = { time: { value: 0 } }

// GLSL chỉ dùng ký tự ASCII (một số trình điều khiển WebGL báo lỗi với ký tự có dấu, kể cả trong comment)
const PROJECT_WIND = /* glsl */ `
vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
vec4 windWorld = modelMatrix * mvPosition;
// uWind: x = amplitude (m), y = speed, z = root anchor (0 free, 1 anchored), w = local height scale
float windFree = 0.6 + 0.4 * clamp( transformed.y * 0.5 + 0.5, 0.0, 1.0 );
float windRoot = clamp( transformed.y * uWind.w, 0.0, 1.0 );
float windW = mix( windFree, windRoot * windRoot, uWind.z );
float windPh = uWindTime * uWind.y + windWorld.x * 0.09 + windWorld.z * 0.07;
float windGust = 0.7 + 0.3 * sin( uWindTime * 0.37 + windWorld.x * 0.013 + windWorld.z * 0.011 );
windWorld.x += ( sin( windPh ) + 0.3 * sin( windPh * 2.3 + 1.7 ) ) * uWind.x * windW * windGust;
windWorld.z += cos( windPh * 0.83 + 0.6 ) * uWind.x * 0.6 * windW * windGust;
mvPosition = viewMatrix * windWorld;
gl_Position = projectionMatrix * mvPosition;
`

const cache = new Map()

/**
 * Bản sao vật liệu toon(color, opts) có gió.
 * wind: { amp = 0.1 (m), speed = 1.3, root = false (gốc neo đất — cỏ, thân tre), lift = 1 (đổi y cục bộ → 0..1) }
 */
export function windToon(color, opts = {}, { amp = 0.1, speed = 1.3, root = false, lift = 1 } = {}) {
  const key = `${color}|${JSON.stringify(opts)}|${amp}|${speed}|${root}|${lift}`
  if (cache.has(key)) return cache.get(key)
  const m = toon(color, opts).clone()
  const params = new Vector4(amp, speed, root ? 1 : 0, lift)
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = WIND.time
    shader.uniforms.uWind = { value: params }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWindTime;\nuniform vec4 uWind;')
      .replace('#include <project_vertex>', PROJECT_WIND)
  }
  // Cùng mã shader cho mọi vật liệu gió → dùng chung chương trình
  m.customProgramCacheKey = () => 'wind-v1'
  cache.set(key, m)
  return m
}
