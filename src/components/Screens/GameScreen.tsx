import { useMemo, useState } from 'react'
import type { EventBranch, GameEvent } from '@/types'
import { MAX_AGE } from '@/engine/GameConfig'
import { useGameStore } from '@/stores/gameStore'
import { AvatarPortrait } from '../Avatar/AvatarPortrait'
import { StatBar } from '../Effects'
import { branchAvailable } from '@/core/GameEngine'
import { findIdentity } from '@/core/data'
import { formatWealth } from '@/lib/utils'

function StatPanel() {
  const data = useGameStore((s) => s.data)
  const run = useGameStore((s) => s.run)
  if (!data || !run) return null
  const stats = data.stats
  const rows = [
    { key: 'physique' as const, name: '体质', v: stats.physique, color: 'bg-blood-400' },
    { key: 'intelligence' as const, name: '智力', v: stats.intelligence, color: 'bg-gold-400' },
    { key: 'instinct' as const, name: '直觉', v: stats.instinct, color: 'bg-ash-300' },
    { key: 'will' as const, name: '意志', v: stats.will, color: 'bg-blood-300' },
    { key: 'fortune' as const, name: '运道', v: stats.fortune, color: 'bg-gold-500' },
    { key: 'synergy' as const, name: '共鸣', v: stats.synergy, color: 'bg-ash-500' },
  ]
  return (
    <div className="paper-panel p-4">
      <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">身体状态</div>
      <StatBar value={run.health} color="bg-blood-400" label="健康" />
      <div className="h-2" />
      <StatBar value={run.pressure} color="bg-blood-300" label="压力" />
      <div className="h-2" />
      <StatBar value={data.ego.distortionProgress} color="bg-void-600" label="扭曲" />
      <div className="my-3 h-px bg-void-700" />
      <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">六维属性</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between">
            <span className="text-xs text-ash-400">{r.name}</span>
            <span className={`font-mono text-sm ${r.v >= 8 ? 'text-gold-400' : r.v >= 6 ? 'text-ash-300' : 'text-ash-500'}`}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EventCard({ event }: { event: GameEvent }) {
  const { data, run, chooseBranch } = useGameStore()
  const [picked, setPicked] = useState(false)
  if (!data || !run) return null

  const isVoice = event.voiceTrigger
  const isDeathChain = event.deathChainEntry

  const handlePick = (b: EventBranch) => {
    if (picked) return
    setPicked(true)
    chooseBranch(b)
  }

  return (
    <div
      className={`paper-panel animate-fadeUp p-6 ${
        isVoice ? 'border-gold-400/60 shadow-[0_0_60px_rgba(192,154,63,0.25)]' : isDeathChain ? 'border-blood-400' : ''
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-ash-500">
          {isVoice ? '◆ 内心之声 ◆' : isDeathChain ? '◆ 终局 ◆' : '记录档案'}
        </span>
        <span className="font-mono text-[10px] text-ash-600">#{String(event.id).padStart(4, '0')}</span>
      </div>
      <h3 className={`title-serif mb-3 text-2xl ${isVoice ? 'text-gold-400' : 'text-ash-300'}`}>{event.title}</h3>
      <p className="mb-5 text-sm leading-relaxed text-ash-300">{event.description}</p>
      <div className="flex flex-col gap-2.5">
        {(event.branches ?? []).map((b) => {
          const available = branchAvailable(data, run, b)
          return (
            <button
              key={b.id}
              onClick={() => handlePick(b)}
              disabled={!available || picked}
              className={`group border px-4 py-3 text-left text-sm leading-relaxed transition-all ${
                available
                  ? isVoice
                    ? 'border-gold-500/50 text-ash-300 hover:border-gold-400 hover:bg-gold-400/10'
                    : 'border-void-600 text-ash-300 hover:border-blood-400 hover:bg-blood-500/10'
                  : 'cursor-not-allowed border-void-700 text-void-600 line-through decoration-void-600'
              }`}
            >
              {b.text}
            </button>
          )
        })}
      </div>
      {picked && <div className="mt-4 font-mono text-xs text-ash-600">命运正在书写……</div>}
    </div>
  )
}

function LifeLog() {
  const lifeLog = useGameStore((s) => s.data?.lifeLog)
  const entries = useMemo(() => (lifeLog ?? []).slice(-40), [lifeLog])
  return (
    <div className="paper-panel flex h-full flex-col p-4">
      <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">人生档案</div>
      <div className="scroll-thin min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {entries.map((e, i) => (
          <div key={i} className="border-l border-void-700 pl-3 text-xs leading-relaxed text-ash-400">
            {e}
          </div>
        ))}
      </div>
    </div>
  )
}

function HudHeader() {
  const { data, run, goToMenu } = useGameStore()
  if (!data || !run) return null
  const identity = findIdentity(data.identity)
  const ageStage = data.age < 13 ? '幼年' : data.age < 19 ? '少年' : data.age < 60 ? '成年' : data.age < 100 ? '老年' : '古寿'
  return (
    <div className="paper-panel flex items-center justify-between gap-4 px-5 py-3">
      <div>
        <div className="title-serif text-lg text-ash-300">{data.name}</div>
        <div className="font-mono text-[11px] text-ash-500">
          {data.gender} · {ageStage} · {identity?.name ?? data.identity}
        </div>
      </div>
      <div className="hidden items-center gap-6 md:flex">
        <div className="text-center">
          <div className="font-mono text-xl text-gold-400">{data.age}</div>
          <div className="font-mono text-[10px] text-ash-500">年龄 / {MAX_AGE}</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl text-gold-400">{formatWealth(data.wealth)}</div>
          <div className="font-mono text-[10px] text-ash-500">眼</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl text-gold-400">{run.reputation}</div>
          <div className="font-mono text-[10px] text-ash-500">声望</div>
        </div>
      </div>
      <div className="text-right">
        <div className="mb-1 font-mono text-[11px] text-ash-400">{data.affiliation || '无'}</div>
        <button onClick={goToMenu} className="font-mono text-[11px] text-ash-600 hover:text-blood-300">
          放弃此世
        </button>
      </div>
    </div>
  )
}

export function GameScreen() {
  const { data, run, currentEvents, currentIndex } = useGameStore()
  if (!data || !run) return null
  const current = currentEvents[currentIndex]
  const event = current?.event
  const expression = event?.portrait ?? 'normal'
  const egoAwakened = data.ego.isAwakened

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-4">
      <HudHeader />

      <div className="grid flex-1 gap-4 lg:grid-cols-[280px_1fr_320px]">
        {/* 左：立绘 + 属性 */}
        <div className="flex flex-col gap-4">
          <div className="paper-panel relative flex items-end justify-center overflow-hidden py-3">
            <AvatarPortrait data={data} run={run} expression={expression} size={190} />
            {egoAwakened && (
              <div className="absolute left-2 top-2 rounded bg-gold-400/15 px-2 py-1 font-mono text-[10px] text-gold-400">
                E.G.O · {data.ego.egoName}
              </div>
            )}
            {run.distortionFormId && (
              <div className="absolute left-2 top-2 rounded bg-blood-500/20 px-2 py-1 font-mono text-[10px] text-blood-300">
                扭曲
              </div>
            )}
            {run.sinType && (
              <div className="absolute left-2 top-2 rounded bg-blood-600/30 px-2 py-1 font-mono text-[10px] text-blood-300">
                大罪 · {run.sinType}
              </div>
            )}
            <div className="absolute bottom-2 right-2 flex flex-wrap justify-end gap-1">
              {(data.traits ?? []).slice(0, 4).map((t) => (
                <span key={t} className="rounded bg-void-700/80 px-1.5 py-0.5 font-mono text-[9px] text-ash-500">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <StatPanel />
        </div>

        {/* 中：事件卡 */}
        <div className="flex flex-col">
          <div className="flex-1">
            {event ? (
              <EventCard key={event.id} event={event} />
            ) : (
              <div className="paper-panel flex h-full items-center justify-center p-10 text-center text-sm text-ash-500">
                命运正在编织下一年的故事……
              </div>
            )}
          </div>
          <div className="mt-2 text-center font-mono text-[10px] text-ash-600">
            第 {data.age} 年 · 事件 {currentIndex + 1}/{currentEvents.length}
          </div>
        </div>

        {/* 右：人生档案 */}
        <LifeLog />
      </div>
    </div>
  )
}
