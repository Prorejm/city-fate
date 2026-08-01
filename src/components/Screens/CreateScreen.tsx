import { useState } from 'react'
import type { Gender } from '@/types'
import { ORIGINS } from '@/core/data'
import { randomName } from '@/lib/utils'
import { useGameStore } from '@/stores/gameStore'

export function CreateScreen() {
  const { goToMenu, setDraft } = useGameStore()
  const [name, setName] = useState('都市人')
  const [gender, setGender] = useState<Gender>('男')
  const [originId, setOriginId] = useState(ORIGINS[0].id)

  const origin = ORIGINS.find((o) => o.id === originId) ?? ORIGINS[0]

  const handleStart = () => {
    setDraft({ originId, name: name.trim() || '都市人', gender })
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <button onClick={goToMenu} className="mb-6 font-mono text-xs text-ash-500 hover:text-ash-300">
        ← 返回
      </button>
      <h2 className="title-serif mb-1 text-3xl text-ash-300">出身档案</h2>
      <p className="mb-8 text-sm text-ash-500">在都市降生的第一刻，你的命运已被决定了一半。</p>

      <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
        {/* 基本信息 */}
        <div className="paper-panel flex flex-col gap-5 p-6">
          <div>
            <label className="mb-1 block font-mono text-xs text-ash-500">姓名</label>
            <div className="flex gap-2">
              <input
                value={name}
                maxLength={8}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-void-600 bg-void-950 px-3 py-2 text-ash-300 outline-none focus:border-blood-400"
              />
              <button
                onClick={() => setName(randomName())}
                className="shrink-0 border border-void-600 px-3 font-mono text-xs text-ash-400 hover:border-gold-400 hover:text-gold-400"
              >
                随机
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs text-ash-500">性别</label>
            <div className="flex gap-2">
              {(['男', '女', '未知'] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 border px-3 py-2 text-sm transition-colors ${
                    gender === g
                      ? 'border-blood-400 bg-blood-500/20 text-blood-300'
                      : 'border-void-600 text-ash-400 hover:border-ash-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="mb-1 font-mono text-xs text-gold-400">{origin.name}</div>
            <div className="mb-1 font-mono text-xs text-ash-500">出生地：{origin.district}</div>
            <p className="text-xs leading-relaxed text-ash-400">{origin.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(origin.stats).map(([k, v]) => (
                <span key={k} className="rounded bg-void-700 px-1.5 py-0.5 font-mono text-[10px] text-ash-400">
                  {k}+{v}
                </span>
              ))}
              <span className="rounded bg-void-700 px-1.5 py-0.5 font-mono text-[10px] text-gold-400">
                初始 {origin.wealth} 眼
              </span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="mt-auto border border-blood-500 bg-blood-600/30 py-3 font-serifcn tracking-[0.3em] text-ash-300 transition-all hover:bg-blood-600/60 hover:text-white"
          >
            出生
          </button>
        </div>

        {/* 出身选择 */}
        <div className="grid gap-3 sm:grid-cols-2">
          {ORIGINS.map((o) => (
            <button
              key={o.id}
              onClick={() => setOriginId(o.id)}
              className={`paper-panel p-4 text-left transition-all ${
                originId === o.id ? 'border-blood-400 shadow-[0_0_30px_rgba(160,31,31,0.25)]' : 'hover:border-void-500'
              }`}
            >
              <div className="mb-1 font-serifcn text-sm text-ash-300">{o.name}</div>
              <div className="mb-1 font-mono text-[10px] text-ash-500">{o.district}</div>
              <p className="line-clamp-3 text-xs leading-relaxed text-ash-400">{o.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
