import { useState } from 'react'
import { ACHIEVEMENTS } from '@/core/data'
import { useGameStore } from '@/stores/gameStore'

const TIER_STYLE: Record<string, string> = {
  common: 'text-ash-400 border-void-600',
  silver: 'text-ash-300 border-ash-500',
  gold: 'text-gold-400 border-gold-500',
  legend: 'text-blood-300 border-blood-500',
}

export function AchievementModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const unlocked = useGameStore((s) => s.meta.unlockedAchievements)
  const [cat, setCat] = useState<string>('全部')
  const cats = ['全部', '生存', '财富', '职业', '精神', '经历', '属性', '多周目', '战斗']
  const list = ACHIEVEMENTS.filter((a) => cat === '全部' || a.category === cat)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="paper-panel scroll-thin max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="title-serif text-2xl text-ash-300">
            成就 <span className="font-mono text-sm text-gold-400">{unlocked.length}/{ACHIEVEMENTS.length}</span>
          </h2>
          <button onClick={onClose} className="font-mono text-xs text-ash-500 hover:text-blood-300">✕</button>
        </div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
                cat === c ? 'bg-blood-500/30 text-blood-300' : 'bg-void-700 text-ash-500 hover:text-ash-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {list.map((a) => {
            const isUnlocked = unlocked.includes(a.id)
            return (
              <div
                key={a.id}
                className={`rounded border p-3 ${
                  isUnlocked ? `${TIER_STYLE[a.tier] ?? TIER_STYLE.common} bg-void-950/50` : 'border-void-700 bg-void-950/20 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-ash-300">{a.name}</span>
                  <span className="font-mono text-[10px] text-ash-600">{a.category}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ash-400">{a.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
