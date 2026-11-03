import { useEffect } from 'react'
import { Color } from 'three'
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { setGlowBoost } from '../materials'
import { GLOW_BOOST } from '../fx/quality'

/**
 * Hậu kỳ: AO (chiều sâu chân tường, gốc cây, mái hiên) → Bloom chọn lọc (chỉ vật sáng > ngưỡng: đèn, nến,
 * mặt trời, vệt nắng trên nước) → ToneMapping ACES → Vignette nhẹ → SMAA.
 * Khi composer chạy, @react-three/postprocessing tự đặt renderer.toneMapping = NoToneMapping (khôi phục khi gỡ)
 * và cảnh render vào bộ đệm HDR tuyến tính → tone mapping chỉ áp MỘT lần ở hiệu ứng ToneMapping.
 * Bầu trời/nước là ShaderMaterial có tonemapping_fragment + colorspace_fragment nên đúng màu ở cả hai chế độ.
 *
 * enabled: quyết định bởi postFxEnabled(quality) (Game.jsx); high: chất lượng cao (AO đủ độ phân giải, nhiều mẫu).
 */

const AO_COLOR = new Color('#1e1610')

/** Tắt tự dò vật trong suốt của N8AO (duyệt cả scene mỗi frame + thêm 2 lượt render) */
function tuneAO(pass) {
  if (!pass) return
  pass.autoDetectTransparency = false
  pass.configuration.transparencyAware = false
}

export default function PostFX({ enabled, high = false }) {
  useEffect(() => {
    setGlowBoost(enabled ? GLOW_BOOST : 1)
    return () => setGlowBoost(1)
  }, [enabled])

  if (!enabled) return null
  return (
    <EffectComposer multisampling={0}>
      <N8AO
        ref={tuneAO}
        halfRes={!high}
        depthAwareUpsampling
        screenSpaceRadius={false}
        aoRadius={1.6}
        distanceFalloff={0.5}
        intensity={2.4}
        aoSamples={high ? 16 : 8}
        denoiseSamples={high ? 8 : 4}
        denoiseRadius={12}
        color={AO_COLOR}
      />
      <Bloom mipmapBlur luminanceThreshold={1.1} luminanceSmoothing={0.2} intensity={0.75} radius={0.72} levels={high ? 7 : 5} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.4} eskil={false} />
      <SMAA />
    </EffectComposer>
  )
}
