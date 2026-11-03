import { describe, expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, Sprite, SpriteMaterial } from 'three'
import { PLAYER_GROUP, candidateOffsets, cameraPosition, framedTarget, pickClearView } from './cameraPicker'

function wallScene() {
  const scene = new Scene()
  // Bức tường chắn phía +X của nhân vật
  const wall = new Mesh(new BoxGeometry(0.4, 6, 8), new MeshBasicMaterial())
  wall.position.set(2.5, 2, 0)
  scene.add(wall)
  // Thân nhân vật (không được tính là vật che)
  const player = new Group()
  player.name = PLAYER_GROUP
  player.add(new Mesh(new BoxGeometry(1, 2, 1), new MeshBasicMaterial()))
  scene.add(player)
  // Sprite (sương, quầng sáng) — tia bắn qua sprite cần camera, không được làm lỗi
  const mist = new Sprite(new SpriteMaterial({ transparent: true, opacity: 0.3 }))
  mist.position.set(-1.5, 2, 1)
  mist.scale.setScalar(3)
  scene.add(mist)
  scene.updateMatrixWorld(true)
  return scene
}

describe('chọn góc camera không bị che', () => {
  it('các góc thử bắt đầu bằng góc ưu tiên, không trùng', () => {
    const c = candidateOffsets(1.7)
    expect(c[0]).toBeCloseTo(1.7)
    expect(new Set(c.map((v) => v.toFixed(3))).size).toBe(c.length)
    expect(candidateOffsets(0)[0]).toBe(0)
  })

  it('góc ưu tiên bị tường che → chọn góc khác nhìn thông', () => {
    const scene = wallScene()
    const head = [0, 1.3, 0]
    // Góc ưu tiên: camera đặt ở phía +X (sau bức tường). Với rotY = 0, yaw = −π/2 → camera ở x dương
    const res = pickClearView(scene, { head, rotY: 0, preferred: -Math.PI / 2, pitch: 0.2, distance: 4.5 })
    const cam = cameraPosition(head, res.offset, 0.2, res.distance)
    expect(cam[0]).toBeLessThan(2.3) // không nằm sau tường
  })

  it('cảnh có sprite: không lỗi khi có camera thật', () => {
    const scene = wallScene()
    const camera = new PerspectiveCamera()
    camera.position.set(-4, 2, 0)
    camera.updateMatrixWorld(true)
    expect(() => pickClearView(scene, { head: [0, 1.3, 0], rotY: 0, preferred: 1.7, pitch: 0.2, distance: 4.5, camera })).not.toThrow()
  })

  it('kiểm tra đúng vị trí camera khi điểm ngắm bị dời sang bên (khung hình hoạt động)', () => {
    const scene = new Scene()
    // Cột nhỏ chỉ chắn đường tới camera khi điểm ngắm dời 1.7 m sang phải
    const post = new Mesh(new BoxGeometry(0.5, 6, 0.5), new MeshBasicMaterial())
    const yaw = 0
    const cam = cameraPosition(framedTarget([0, 1.3, 0], yaw, 1.7, 0), yaw, 0.2, 4.5)
    post.position.set(cam[0] * 0.5, 2, cam[2] * 0.5)
    scene.add(post)
    scene.updateMatrixWorld(true)
    expect(pickClearView(scene, { head: [0, 1.3, 0], rotY: 0, preferred: 0.001, pitch: 0.2, distance: 4.5 }).clear).toBe(true)
    const framed = pickClearView(scene, { head: [0, 1.3, 0], rotY: 0, preferred: 0.001, pitch: 0.2, distance: 4.5, side: 1.7 })
    expect(Math.abs(framed.offset - 0.001)).toBeGreaterThan(0.01)
  })

  it('chính nhân vật không chặn tầm nhìn', () => {
    const scene = wallScene()
    const res = pickClearView(scene, { head: [0, 1.3, 0], rotY: 0, preferred: Math.PI / 2, pitch: 0.2, distance: 4.5 })
    expect(res.offset).toBeCloseTo(Math.PI / 2)
    expect(res.distance).toBe(4.5)
  })
})
