import { GlitchText } from '../Effects'
import { useGameStore } from '@/stores/gameStore'
import { useUiStore } from '@/stores/uiStore'
import { ACHIEVEMENTS } from '@/core/data'
import { formatWealth } from '@/lib/utils'

export function MenuScreen() {
  const goToCreate = useGameStore((s) => s.goToCreate)
  const meta = useGameStore((s) => s.meta)
  const pushToast = useUiStore((s) => s.pushToast)
  const unlocked = meta.unlockedAchievements.length

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="crt-flicker text-center">
        <div className="mb-2 font-mono text-xs tracking-[0.4em] text-ash-500">THE CITY · LIFE SIMULATOR</div>
        <h1 className="title-serif text-5xl text-ash-300 md:text-7xl">
          都市<span className="text-blood-400">·</span>命途
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash-400">
          天空永远是灰色的。26 个翼，26 座巢，无数后巷，64 亿人。
          <br />
          从出生到终结——你能活到几岁？又会以何种姿态死去？
        </p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <button
          onClick={goToCreate}
          className="paper-panel group relative w-64 px-8 py-4 font-serifcn text-lg tracking-[0.3em] text-ash-300 transition-all hover:border-blood-400 hover:text-blood-300"
        >
          <GlitchText>开始新的人生</GlitchText>
          <span className="absolute bottom-1 left-8 right-8 h-px bg-blood-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
        <button
          onClick={() => pushToast('在都市，轮回是唯一的出路。', 'info')}
          className="font-mono text-xs text-ash-500 underline-offset-4 hover:text-ash-300 hover:underline"
        >
          轮回说明
        </button>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-4 text-center font-mono text-xs text-ash-500 md:grid-cols-4">
        <div className="paper-panel px-6 py-3">
          <div className="text-lg text-gold-400">{meta.playCount}</div>
          <div>轮回次数</div>
        </div>
        <div className="paper-panel px-6 py-3">
          <div className="text-lg text-gold-400">{Math.floor(meta.totalLifespan)}</div>
          <div>累计寿命</div>
        </div>
        <div className="paper-panel px-6 py-3">
          <div className="text-lg text-gold-400">{unlocked}/{ACHIEVEMENTS.length}</div>
          <div>成就解锁</div>
        </div>
        <div className="paper-panel px-6 py-3">
          <div className="text-lg text-gold-400">{formatWealth(meta.totalEarned)}</div>
          <div>累计财富</div>
        </div>
      </div>

      <p className="mt-10 max-w-lg text-center font-mono text-[11px] leading-relaxed text-void-600">
        同人创作 · 世界观参考《脑叶公司》《废墟图书馆》《边狱公司》 © Project Moon
        <br />
        本作与 Project Moon 无任何关联，纯属爱好致敬。
      </p>
    </div>
  )
}
