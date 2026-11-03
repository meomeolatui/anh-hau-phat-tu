import { lazy } from 'react'

/**
 * Sổ đăng ký hoạt động (overlay giao diện mở khi tương tác).
 * Mở bằng startActivity(id, params) trong state.js. Mỗi Overlay nhận props { params, onClose }.
 * Overlay tự khoá/mở khoá di chuyển (lockPlayer) và đặt hoạt ảnh nhân vật khi mount/unmount.
 */
export const ACTIVITIES = {
  'thap-huong': { title: 'Thắp hương', Overlay: lazy(() => import('./ThapHuong')) },
  'niem-phat': { title: 'Niệm Phật', Overlay: lazy(() => import('./NiemPhat')) },
  'doc-bia': { title: 'Bia pháp ngữ', Overlay: lazy(() => import('./DocBia')) },
  'le-phat': { title: 'Lễ Phật', Overlay: lazy(() => import('./LePhat')) },
  'thinh-chuong': { title: 'Thỉnh chuông', Overlay: lazy(() => import('./ThinhChuong')) },
  'thien-dinh': { title: 'Thiền định', Overlay: lazy(() => import('./ThienDinh')) },
  'tung-kinh': { title: 'Tụng kinh', Overlay: lazy(() => import('./TungKinh')) },
  'hoa-dang': { title: 'Thả đèn hoa đăng', Overlay: lazy(() => import('./HoaDang')) },
  'hoi-chuyen': { title: 'Trò chuyện', Overlay: lazy(() => import('./HoiChuyen')) },
  'cap-treo': { title: 'Cáp treo', Overlay: lazy(() => import('./CapTreo')) },
  'mua-sam': { title: 'Sạp hàng', Overlay: lazy(() => import('./MuaSam')) },
  'nghi-ngoi': { title: 'Nghỉ chân', Overlay: lazy(() => import('./NghiNgoi')) },
  'y-phuc': { title: 'Sạp y phục', Overlay: lazy(() => import('./YPhuc')) },
  'lay-lien-tuc': { title: 'Qui y hồi hướng', Overlay: lazy(() => import('./LayLienTuc')) },
}
