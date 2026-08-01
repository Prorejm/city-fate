import { useState } from 'react'
import type { Stats } from '@/types'
import { ALLOC_POINTS, STAT_MAX, STAT_MIN } from '@/engine/GameConfig'
import { useGameStore } from '@/stores/gameStore'

const ATTRS: { key: keyof Stats; name: string; desc: string; color: string }[] = [
  { key: 'physique', name: '体质', desc: '健康 · 战斗 · 寿命', color: 'bg-blood-400' },
  { key: 'intelligence', name: '智力', desc: '学习 · 技术 · 奇点', color: 'bg-gold-400' },
  { key: 'instinct', name: '直觉', desc: '危险感知 · 异想体互动', color: 'bg-ash-300' },
  { key: 'will', name: '意志', desc: 'EGO觉醒 · 扭曲抵抗', color: 'bg-blood-300' },
  { key: 'fortune', name: '运道', desc: '机遇 · 存活率', color: 'bg-gold-500' },
  { key: 'synergy', name: '共鸣', desc: '精神连接 · 异想体亲和', color: 'bg-ash-500' },
]

export function AllocateScreen() {
  const { goToCreate, draft, startNewLife } = useGameStore()
  const [stats, setStats] = useState<Stats>({ physique: 5, intelligence: 5, instinct: 5, will: 5, fortune: 3, synergy: 2 })

  const used = Object.values(stats).reduce((a, b) => a + b, 0)
  const remaining = ALLOC_POINTS - used

  const adjust = (key: keyof Stats, delta: number) => {
    setStats((s) => {
      const next = s[key] + delta
      if (next < STAT_MIN || next > STAT_MAX) return s
      if (remaining - delta < 0) return s
      return { ...s, [key]: next }
    })
  }

  const handleStart = () => {
    if (!draft) return
    startNewLife({ originId: draft.originId, stats, name: draft.name, gender: draft.gender })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10">
      <button onClick={goToCreate} className="mb-6 font-mono text-xs text-ash-500 hover:text-ash-300">
        ← 返回
      </button>
      <h2 className="title-serif mb-1 text-3xl text-ash-300">属性分配</h2>
      <p className="mb-6 text-sm text-ash-500">
        六维属性，共 25 点。你如何定义这具在都市中挣扎的身体？
        {draft && <span className="ml-2 font-mono text-xs text-gold-400">{draft.name} · {draft.gender}</span>}
      </p>

      <div className="paper-panel mb-6 flex items-center justify-between px-6 py-4">
        <span className="font-mono text-xs text-ash-500">剩余点数</span>
        <span className={`font-mono text-3xl ${remaining === 0 ? 'text-gold-400' : 'text-blood-300'}`}>{remaining}</span>
      </div>

      <div className="paper-panel flex flex-col gap-4 p-6">
        {ATTRS.map((a) => (
          <div key={a.key} className="flex items-center gap-4">
            <div className="w-16 shrink-0">
              <div className="font-serifcn text-ash-300">{a.name}</div>
              <div className="font-mono text-[10px] text-ash-600">{a.desc}</div>
            </div>
            <button
              onClick={() => adjust(a.key, -1)}
              disabled={stats[a.key] <= STAT_MIN}
              className="h-9 w-9 shrink-0 border border-void-600 text-ash-400 transition-colors hover:border-blood-400 hover:text-blood-300 disabled:opacity-30"
            >
              −
            </button>
            <div className="flex-1">
              <div className="stat-bar-track h-2.5">
                <div className={`stat-bar-fill ${a.color}`} style={{ width: `${(stats[a.key] / STAT_MAX) * 100}%` }} />
              </div>
            </div>
            <span className="w-6 shrink-0 text-center font-mono text-ash-300">{stats[a.key]}</span>
            <button
              onClick={() => adjust(a.key, 1)}
              disabled={stats[a.key] >= STAT_MAX || remaining <= 0}
              className="h-9 w-9 shrink-0 border border-void-600 text-ash-400 transition-colors hover:border-gold-400 hover:text-gold-400 disabled:opacity-30"
            >
              ＋
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={remaining !== 0}
        className={`mt-6 border py-4 font-serifcn tracking-[0.3em] transition-all ${
          remaining === 0
            ? 'border-blood-500 bg-blood-600/30 text-ash-300 hover:bg-blood-600/60 hover:text-white'
            : 'cursor-not-allowed border-void-700 text-void-600'
        }`}
      >
        {remaining === 0 ? '踏入都市' : `还有 ${remaining} 点未分配`}
      </button>
    </div>
  )
}
