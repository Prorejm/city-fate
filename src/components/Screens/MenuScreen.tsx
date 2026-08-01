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
        <div className="mb-2 font-mono text-xs tracking-[0.4em] text-ash-500">穿越者 · 都市 ROGUE·RPG</div>
        <h1 className="title-serif text-5xl text-ash-300 md:text-7xl">
          都市<span className="text-blood-400">·</span>命途
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash-400">
          你从另一个世界醒来，身无分文地躺在第七区的垃圾堆里。
          <br />
          26 个翼，26 座巢，无数后巷，64 亿人——活下去，直到你找到答案。
        </p>
        <p className="mt-3 font-mono text-[11px] tracking-widest text-blood-400/70">
          —— 第七区求生录 ——
        </p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <button
          onClick={goToCreate}
          className="paper-panel group relative w-64 px-8 py-4 font-serifcn text-lg tracking-[0.3em] text-ash-300 transition-all hover:border-blood-400 hover:text-blood-300"
        >
          <GlitchText>开始穿越</GlitchText>
          <span className="absolute bottom-1 left-8 right-8 h-px bg-blood-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
        <button
          onClick={() => pushToast('死亡不是终点——你的每次轮回，都会让下一个你更强。', 'info')}
          className="font-mono text-xs text-ash-500 underline-offset-4 hover:text-ash-300 hover:underline"
        >
          生存说明
        </button>
        <button
          onClick={() => pushToast('都市图鉴即将开放：收录你遇见过的 NPC、协会与遗物。', 'info')}
          className="font-mono text-xs text-ash-500 underline-offset-4 hover:text-ash-300 hover:underline"
        >
          都市图鉴（开发中）
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
