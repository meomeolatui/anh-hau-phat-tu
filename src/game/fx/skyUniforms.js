import { Color, Vector3 } from 'three'

/**
 * Uniform dùng chung giữa bầu trời và các shader cần biết trời/giờ (mặt nước…).
 * Environment.jsx cập nhật mỗi khi giờ đổi (màu, hướng nắng) và mỗi frame (uTime).
 * Các ShaderMaterial tham chiếu CÙNG đối tượng uniform → không cần useFrame riêng.
 */
export const skyUniforms = {
  uTime: { value: 0 },
  uSkyTop: { value: new Color('#4f9fe6') },
  uSkyHorizon: { value: new Color('#cfe8f5') },
  uSunDir: { value: new Vector3(0.3, 0.9, 0.3).normalize() },
  uSunColor: { value: new Color('#fff3dc') },
  /** Mức chiếu sáng tổng (0,25..1,2) để vật liệu không chịu đèn (nước) tối đi về đêm */
  uLight: { value: 1 },
  uNight: { value: 0 },
}
