import { useEffect, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { useUiStore } from '@/stores/uiStore'
import { MenuScreen } from './components/Screens/MenuScreen'
import { CreateScreen } from './components/Screens/CreateScreen'
import { AllocateScreen } from './components/Screens/AllocateScreen'
import { GameScreen } from './components/Screens/GameScreen'
import { EgoAwakenScreen } from './components/Screens/EgoAwakenScreen'
import { DistortionScreen } from './components/Screens/DistortionScreen'
import { DeathScreen } from './components/Screens/DeathScreen'
import { AchievementModal } from './components/AchievementModal'
import { Toasts } from './components/Toasts'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const newlyAchieved = useGameStore((s) => s.newlyAchieved)
  const clearNewlyAchieved = useGameStore((s) => s.clearNewlyAchieved)
  const pushToast = useUiStore((s) => s.pushToast)
  const [showAchievements, setShowAchievements] = useState(false)

  useEffect(() => {
    if (newlyAchieved.length > 0) {
      for (const a of newlyAchieved) {
        pushToast(`【${a.name}】${a.description}`, 'achievement')
      }
      clearNewlyAchieved()
    }
  }, [newlyAchieved, pushToast, clearNewlyAchieved])

  const screen = () => {
    switch (phase) {
      case 'CREATE':
        return <CreateScreen />
      case 'ALLOCATE':
        return <AllocateScreen />
      case 'PLAYING':
        return <GameScreen />
      case 'EGO_AWAKEN':
        return <EgoAwakenScreen />
      case 'DISTORTION':
        return <DistortionScreen />
      case 'DEATH':
        return <DeathScreen />
      default:
        return <MenuScreen />
    }
  }

  return (
    <div className="noise-overlay scanlines relative min-h-screen">
      {screen()}
      <button
        onClick={() => setShowAchievements(true)}
        className="fixed bottom-4 right-4 z-40 border border-void-600 bg-void-900/80 px-3 py-2 font-mono text-[11px] text-ash-400 transition-colors hover:border-gold-400 hover:text-gold-400"
        title="成就"
      >
        成就
      </button>
      <AchievementModal open={showAchievements} onClose={() => setShowAchievements(false)} />
      <Toasts />
    </div>
  )
}
