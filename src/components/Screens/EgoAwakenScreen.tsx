import { useGameStore } from '@/stores/gameStore'
import { GlitchText } from '../Effects'

export function EgoAwakenScreen() {
  const { pendingEgo, confirmEgo, data } = useGameStore()
  const ego = pendingEgo?.ego
  if (!ego) return null

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* 白夜黑昼式强光 */}
      <div className="pointer-events-none absolute inset-0 animate-lightflash bg-gold-400/20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(192,154,63,0.25),transparent_60%)]" />

      <div className="animate-fadeUp relative z-10 max-w-2xl text-center">
        <div className="mb-4 font-mono text-xs tracking-[0.5em] text-gold-400">绽放 E.G.O</div>
        <h1 className="title-serif text-6xl text-gold-400 text-shadow-blood md:text-7xl">
          <GlitchText>{ego.name}</GlitchText>
        </h1>
        <div className="my-4 flex items-center justify-center gap-2">
          <span className="h-px w-16 bg-gold-500/50" />
          <span className="rounded border border-gold-500/40 px-3 py-1 font-mono text-xs text-gold-400">{ego.type}</span>
          <span className="h-px w-16 bg-gold-500/50" />
        </div>
        <p className="mb-2 text-sm leading-relaxed text-ash-300">{ego.description}</p>
        <p className="mb-8 text-xs italic leading-relaxed text-ash-500">{ego.passive}</p>

        {data && data.ego.isAwakened && (
          <p className="mb-8 text-sm text-ash-400">
            你接受了痛苦，也接受了罪孽。<span className="text-gold-400">{data.name}</span>——你成为了真正的自己。
          </p>
        )}

        <button
          onClick={confirmEgo}
          className="border border-gold-400 bg-gold-400/10 px-10 py-3 font-serifcn tracking-[0.4em] text-gold-400 transition-all hover:bg-gold-400/30"
        >
          握住这份力量
        </button>
      </div>
    </div>
  )
}
