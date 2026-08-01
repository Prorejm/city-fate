import { useGameStore } from '@/stores/gameStore'
import { Divider } from '../Effects'
import { findIdentity } from '@/core/data'
import { formatWealth } from '@/lib/utils'

export function DeathScreen() {
  const { data, run, death, meta, goToCreate, goToMenu } = useGameStore()
  if (!data || !run || !death) return null
  const identity = findIdentity(data.identity)

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12">
      <div className="paper-panel w-full p-8 text-center">
        <div className="mb-2 font-mono text-xs tracking-[0.5em] text-blood-400">终 局 · 再 次 穿 越</div>
        <h1 className="title-serif mb-6 text-4xl text-ash-300">
          {data.name} · 第 {run.daysInCity} 天
        </h1>
        <div className="mb-6 font-mono text-sm text-blood-300">死因：{death.cause}</div>
        <div className="mx-auto mb-8 max-w-lg border-l-2 border-blood-500/60 pl-4 text-left text-sm italic leading-relaxed text-ash-400">
          {death.epitaph}
        </div>

        <Divider />

        <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">最终身份</div>
            <div className="mt-1 text-sm text-ash-300">{identity?.name ?? data.identity}</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">所属</div>
            <div className="mt-1 text-sm text-ash-300">{data.affiliation || '无'}</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">财富</div>
            <div className="mt-1 text-sm text-gold-400">{formatWealth(data.wealth)}</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">觉醒 E.G.O</div>
            <div className="mt-1 text-sm text-gold-400">{data.ego.egoName || '无'}</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">特质</div>
            <div className="mt-1 text-sm text-ash-300">{data.traits.length} 项</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">关键转折</div>
            <div className="mt-1 text-sm text-ash-300">{data.keyMoments.length} 次</div>
          </div>
        </div>

        <Divider />

        <div className="mb-8 flex items-center justify-center gap-10">
          <div>
            <div className="font-mono text-[10px] text-ash-500">累计轮回</div>
            <div className="font-mono text-2xl text-gold-400">{meta.playCount}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-ash-500">累计寿命</div>
            <div className="font-mono text-2xl text-gold-400">{Math.floor(meta.totalLifespan)} 岁</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-ash-500">遗产点</div>
            <div className="font-mono text-2xl text-gold-400">{meta.rebirthPoints}</div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={goToCreate}
            className="border border-blood-500 bg-blood-600/20 px-8 py-3 font-serifcn tracking-[0.3em] text-ash-300 transition-all hover:bg-blood-600/50 hover:text-white"
          >
            再次穿越
          </button>
          <button
            onClick={goToMenu}
            className="border border-void-600 px-8 py-3 font-serifcn tracking-[0.3em] text-ash-400 transition-all hover:border-ash-500 hover:text-ash-300"
          >
            返回标题
          </button>
        </div>
      </div>
    </div>
  )
}
