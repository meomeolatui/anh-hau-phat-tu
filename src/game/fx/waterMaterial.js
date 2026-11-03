import { Color, DoubleSide, FrontSide, ShaderMaterial, UniformsLib, UniformsUtils } from 'three'
import { PALETTE } from '../materials'
import { skyUniforms } from './skyUniforms'

/**
 * waterMaterial(color?, { kind?: 'still' | 'stream' | 'fall', opacity? }) — vật liệu nước (có cache) cho hình học tự dựng:
 *   'still'  mặt hồ: gợn theo toạ độ thế giới, nước nông sáng ở mép (uv 0..1);
 *   'stream' dòng suối: uv.x 0..1 ngang dòng, uv.y = mét dọc dòng (chảy theo chiều uv.y tăng), bọt ven bờ;
 *   'fall'   thác: mặt đứng, uv.y 0 ở chân → 1 ở đỉnh, vệt nước trắng chảy xuống.
 * Shader toon: màu sâu/nông, gợn sóng chuyển động, vệt nắng lấp lánh (HDR → Bloom), phản chiếu màu trời theo giờ
 * (uniform dùng chung skyUniforms, Environment cập nhật), trong suốt nhẹ, chịu sương mù.
 */

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uKind;
  uniform float uTime;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uLight;
  uniform float uNight;
  varying vec3 vWorld;
  varying vec2 vUv;
  #include <fog_pars_fragment>

  // Hash không dùng sin → ổn định cả khi toạ độ/thời gian lớn (chơi lâu)
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // Trường độ cao gợn sóng (vài sóng sin + nhiễu trôi)
  float waves(vec2 p, float t) {
    float h = sin(p.x * 1.7 + t * 1.3) * 0.5;
    h += sin(p.y * 2.3 - t * 1.1 + p.x * 0.6) * 0.4;
    h += sin((p.x + p.y) * 3.1 + t * 1.9) * 0.25;
    h += (noise(p * 2.2 + vec2(t * 0.35, -t * 0.25)) - 0.5) * 0.9;
    return h;
  }

  void main() {
    float t = uTime;
    vec3 col;
    float alpha;
    if (uKind > 1.5) {
      // Thác: vệt nước trắng chảy xuống, mép mờ dần, chân thác sủi bọt
      float s1 = noise(vec2(vUv.x * 14.0, vUv.y * 3.0 + t * 4.0));
      float s2 = noise(vec2(vUv.x * 30.0, vUv.y * 6.0 + t * 6.0));
      float streaks = smoothstep(0.45, 0.75, s1 * 0.6 + s2 * 0.5);
      col = mix(uColor * 0.95, vec3(0.95, 0.98, 1.0), streaks * 0.8 + 0.1) * uLight;
      col += uSunColor * smoothstep(0.85, 0.95, s2) * 0.6 * (1.0 - uNight);
      col = mix(col, vec3(uLight), (1.0 - smoothstep(0.0, 0.15, vUv.y)) * 0.7);
      float edgeFade = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
      alpha = (0.6 + streaks * 0.35) * edgeFade;
    } else {
      bool stream = uKind > 0.5;
      vec2 p = stream ? vec2(vUv.x * 2.0, vUv.y - t * 1.3) : vWorld.xz;
      float e = 0.06;
      float hgt = waves(p, t);
      float dx = (waves(p + vec2(e, 0.0), t) - waves(p - vec2(e, 0.0), t)) / (2.0 * e);
      float dz = (waves(p + vec2(0.0, e), t) - waves(p - vec2(0.0, e), t)) / (2.0 * e);
      float k = stream ? 0.16 : 0.08;
      vec3 n = normalize(vec3(-dx * k, 1.0, -dz * k));
      vec3 V = normalize(cameraPosition - vWorld);
      float fres = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 4.0);
      vec3 R = reflect(-V, n);
      // Phản chiếu: cùng công thức chuyển sắc như bầu trời
      float sh = clamp(R.y * 1.6 + 0.08, 0.0, 1.0);
      vec3 sky = mix(uSkyHorizon, uSkyTop, pow(sh, 0.75));
      // Nước nông sáng ở mép (hồ) / ven bờ (suối), sâu thẫm ở giữa
      float edge = stream ? 1.0 - abs(vUv.x - 0.5) * 2.0 : min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)) * 4.0;
      float shallow = 1.0 - smoothstep(0.0, 0.7, edge);
      vec3 deep = uColor * vec3(0.38, 0.56, 0.64);
      vec3 shal = uColor * 1.08 + vec3(0.02, 0.04, 0.02);
      vec3 base = mix(deep, shal, shallow * 0.85 + 0.15);
      // Dải sáng toon theo đỉnh gợn
      base *= 0.92 + 0.12 * step(0.35, hgt);
      base *= uLight;
      col = mix(base, sky, clamp(0.16 + fres * 0.7, 0.0, 0.85));
      // Vệt nắng (toon, lượng tử hoá) + lấp lánh nhỏ — sáng > 1 để Bloom bắt
      float sd = max(dot(R, normalize(uSunDir)), 0.0);
      float spec = smoothstep(0.35, 0.5, pow(sd, 160.0));
      float sp = noise(p * 9.0 + vec2(t * 1.7, t * 1.3)) * noise(p * 13.0 - vec2(t * 1.4, t * 0.9));
      float sparkle = smoothstep(0.5, 0.68, sp) * (0.35 + 0.65 * pow(sd, 6.0));
      col += uSunColor * (spec * 2.5 + sparkle * 1.6) * (1.0 - uNight * 0.85);
      if (stream) {
        float bank = smoothstep(0.32, 0.5, abs(vUv.x - 0.5));
        float streak = smoothstep(0.62, 0.8, noise(vec2(vUv.x * 6.0, (vUv.y - t * 1.3) * 1.4)));
        float foam = max(bank * (0.5 + 0.5 * noise(p * 4.0)), streak * 0.6);
        col = mix(col, vec3(0.93, 0.97, 0.98) * uLight, foam * 0.7);
      }
      alpha = uOpacity + fres * 0.25;
    }
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`

const KINDS = { still: 0, stream: 1, fall: 2 }
const cache = new Map()

/** Vật liệu nước có cache theo (màu, kiểu, độ trong) — mọi bản dùng chung uniform trời/thời gian */
export function waterMaterial(color = PALETTE.water, { kind = 'still', opacity = 0.82 } = {}) {
  const hex = PALETTE[color] ?? color
  const key = `${hex}|${kind}|${opacity}`
  if (cache.has(key)) return cache.get(key)
  const m = new ShaderMaterial({
    uniforms: {
      ...UniformsUtils.clone(UniformsLib.fog),
      ...skyUniforms,
      uColor: { value: new Color(hex) },
      uOpacity: { value: opacity },
      uKind: { value: KINDS[kind] ?? 0 },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    fog: true,
    side: kind === 'still' ? FrontSide : DoubleSide,
  })
  cache.set(key, m)
  return m
}

