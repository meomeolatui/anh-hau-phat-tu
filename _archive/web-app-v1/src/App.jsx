import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import { ToastProvider } from './components/ui/Toast'

const Home = lazy(() => import('./pages/Home'))
const NiemPhat = lazy(() => import('./pages/NiemPhat'))
const Thien = lazy(() => import('./pages/Thien'))
const Kinh = lazy(() => import('./pages/Kinh'))
const KinhDetail = lazy(() => import('./pages/KinhDetail'))
const PhapNgu = lazy(() => import('./pages/PhapNgu'))
const Lich = lazy(() => import('./pages/Lich'))
const NhatKy = lazy(() => import('./pages/NhatKy'))
const HanhHuong = lazy(() => import('./pages/HanhHuong'))
const HanhHuongDetail = lazy(() => import('./pages/HanhHuongDetail'))
const HocPhat = lazy(() => import('./pages/HocPhat'))
const HocPhatDetail = lazy(() => import('./pages/HocPhatDetail'))
const CaNhan = lazy(() => import('./pages/CaNhan'))
const NotFound = lazy(() => import('./pages/NotFound'))

const routes = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'niem-phat', element: <NiemPhat /> },
      { path: 'thien', element: <Thien /> },
      { path: 'kinh', element: <Kinh /> },
      { path: 'kinh/:id', element: <KinhDetail /> },
      { path: 'phap-ngu', element: <PhapNgu /> },
      { path: 'lich', element: <Lich /> },
      { path: 'nhat-ky', element: <NhatKy /> },
      { path: 'hanh-huong', element: <HanhHuong /> },
      { path: 'hanh-huong/:id', element: <HanhHuongDetail /> },
      { path: 'hoc-phat', element: <HocPhat /> },
      { path: 'hoc-phat/:id', element: <HocPhatDetail /> },
      { path: 'ca-nhan', element: <CaNhan /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]

const router = createBrowserRouter(routes)

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}
