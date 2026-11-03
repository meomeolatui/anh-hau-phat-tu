import { emit, runtime } from '../runtime'

/**
 * Góc nhìn thứ nhất (phím C): camera đặt ở mắt nhân vật, chuột/vuốt để nhìn quanh, thân người ẩn đi.
 * Khi đang làm hoạt động (lạy Phật, thỉnh chuông…) hoặc cảnh quay đặc biệt thì tự trở về góc nhìn thứ ba
 * để thấy động tác, xong lại về góc nhìn thứ nhất.
 */

/** Độ cao mắt so với chân và khoảng nhích ra trước mặt (tránh nhìn xuyên đầu) */
export const EYE_HEIGHT = 1.45
export const EYE_FORWARD = 0.14
/** Góc cúi/ngẩng tối đa khi nhìn bằng mắt nhân vật (dương = cúi xuống, như kéo chuột xuống) */
export const FP_PITCH_LIMIT = 1.3
/** Góc ngẩng mặc định khi vừa chuyển sang: nhìn gần như thẳng về phía trước */
const FP_START_PITCH = 0.05

/** Góc nhìn thứ nhất có đang áp dụng không (người chơi bật, không có hoạt động / cảnh quay) */
export function firstPersonActive(cam, activity) {
  return Boolean(cam.firstPerson && !cam.focus && !activity)
}

/** Vị trí mắt và điểm nhìn theo hướng yaw/pitch (cùng quy ước hướng với CameraRig) */
export function firstPersonView(position, yaw, pitch) {
  const fx = Math.sin(yaw)
  const fz = Math.cos(yaw)
  const eye = [position.x + fx * EYE_FORWARD, position.y + EYE_HEIGHT, position.z + fz * EYE_FORWARD]
  const c = Math.cos(pitch)
  const look = [eye[0] + fx * c, eye[1] - Math.sin(pitch), eye[2] + fz * c]
  return { eye, look }
}

/** Bật/tắt góc nhìn thứ nhất; giữ lại góc ngẩng của góc nhìn thứ ba để trả về khi tắt */
export function toggleFirstPerson() {
  const cam = runtime.camera
  cam.firstPerson = !cam.firstPerson
  if (cam.firstPerson) {
    cam.thirdPersonPitch = cam.pitch
    cam.pitch = FP_START_PITCH
  } else {
    cam.pitch = cam.thirdPersonPitch ?? 0.38
  }
  emit('toast', {
    title: cam.firstPerson ? 'Góc nhìn thứ nhất' : 'Góc nhìn thứ ba',
    description: cam.firstPerson ? 'Nhìn bằng mắt nhân vật — nhấn C để quay lại.' : 'Nhấn C để nhìn bằng mắt nhân vật.',
  })
  emit('view', { firstPerson: cam.firstPerson })
  return cam.firstPerson
}
