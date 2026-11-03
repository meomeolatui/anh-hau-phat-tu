import { Suspense, lazy } from 'react'
import TitleScreen from './screens/TitleScreen'
import { useGame } from './game/state'

// Tách bundle three.js: màn hình tiêu đề tải ngay, thế giới 3D tải khi cần
const CreateCharacter = lazy(() => import('./screens/CreateCharacter'))
const Game = lazy(() => import('./game/Game'))

function Loading({ label = 'Đang thắp đèn trên núi…' }) {
  return (
    <div className="grid h-dvh place-items-center bg-gradient-to-b from-jade-900 to-jade-950 text-white" role="status">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-saffron-300" />
        <p className="mt-4 font-serif text-lg">{label}</p>
      </div>
    </div>
  )
}

export default function App() {
  const screen = useGame((s) => s.ui.screen)
  return (
    <Suspense fallback={<Loading />}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'create' && <CreateCharacter />}
      {screen === 'game' && <Game />}
    </Suspense>
  )
}
