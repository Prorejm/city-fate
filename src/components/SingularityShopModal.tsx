import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { findItem } from '@/core/data'
import { QUALITY_NAMES, addItem } from '@/core/ItemSystem'
import { singularityLevel } from '@/core/SingularitySystem'
import { QUALITY_COLORS } from '@/types'

/** 奇点兑换货架：points 为所需奇点亲和点数 */
const SINGULARITY_STOCK: { id: string; points: number }[] = [
  { id: 'c-enkephalin', points: 20 },
  { id: 'c-time-capsule', points: 30 },
  { id: 'w-moonlight-saber', points: 50 },
  { id: 'w-space-tear', points: 80 },
  { id: 'a-umbra-fork', points: 90 },
]

export function SingularityShopModal() {
  const { data, run, nextEvent } = useGameStore()
  const [msg, setMsg] = useState('')
  if (!data || !run) return null
  const sl = singularityLevel(run.singularityPoints)

  const exchange = (id: string, points: number) => {
    const def = findItem(id)
    if (!def) return
    if (run.singularityPoints < points) {
      setMsg(`奇点亲和不足（需 ${points} 点，当前 ${run.singularityPoints} 点）`)
      return
    }
    run.singularityPoints -= points
    addItem(data, id)
    setMsg(`兑换成功：${def.name}`)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-gold-400">◆ 翼公司·奇点兑换处 ◆</div>
        <div className="title-serif mb-1 text-lg text-ash-300">以奇迹换奇迹</div>
        <div className="mb-1 font-mono text-xs text-ash-500">
          奇点亲和 <span className="text-gold-400">{run.singularityPoints} 点</span> · 等级：
          <span className="text-ash-300">{sl.name}</span>
        </div>
        <div className="mb-4 text-[11px] leading-relaxed text-ash-600">{sl.desc}</div>

        <div className="flex flex-col gap-2">
          {SINGULARITY_STOCK.map((s) => {
            const def = findItem(s.id)
            if (!def) return null
            const afford = run.singularityPoints >= s.points
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 border border-void-700 bg-void-900/40 p-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: QUALITY_COLORS[def.quality] }}>
                      {def.name}
                    </span>
                    <span className="font-mono text-[9px] text-ash-600">{QUALITY_NAMES[def.quality]}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-ash-500">{def.description}</p>
                </div>
                <button
                  onClick={() => exchange(s.id, s.points)}
                  disabled={!afford}
                  className="shrink-0 border border-gold-400 px-3 py-1 text-xs text-gold-400 transition-colors hover:bg-gold-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {s.points} 点
                </button>
              </div>
            )
          })}
        </div>
        {msg && <div className="mt-3 font-mono text-xs text-gold-400">{msg}</div>}

        <button
          onClick={nextEvent}
          className="mt-4 w-full border border-void-600 py-3 font-serifcn tracking-widest text-ash-400 transition-all hover:border-ash-400 hover:text-ash-300"
        >
          离开兑换处
        </button>
      </div>
    </div>
  )
}
