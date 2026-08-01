import { useGameStore } from '@/stores/gameStore'
import { GlitchText } from '../Effects'

export function DistortionScreen() {
  const { pendingDistortion, confirmDistortion, data } = useGameStore()
  const form = pendingDistortion?.form
  if (!form) return null

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 animate-crack bg-[radial-gradient(circle_at_center,rgba(160,31,31,0.35),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4),transparent_70%)]" />

      <div className="animate-fadeUp relative z-10 max-w-2xl text-center">
        <div className="mb-4 font-mono text-xs tracking-[0.5em] text-blood-300">扭 曲</div>
        <h1 className="title-serif text-6xl text-blood-300 md:text-7xl">
          <GlitchText>{form.name}</GlitchText>
        </h1>
        <div className="my-4 flex items-center justify-center gap-2">
          <span className="h-px w-16 bg-blood-500/60" />
          <span className="rounded border border-blood-500/50 px-3 py-1 font-mono text-xs text-blood-300">异变形态</span>
          <span className="h-px w-16 bg-blood-500/60" />
        </div>
        <p className="mb-8 text-sm leading-relaxed text-ash-300">{form.appearance}</p>
        {data && (
          <p className="mb-8 text-sm text-ash-400">
            你只接受了自己的痛苦，却不愿承认罪孽。<span className="text-blood-300">{data.name}</span>——那个声音叹息着，与你融为一体。
          </p>
        )}
        <p className="mb-8 font-mono text-[11px] text-ash-500">
          讨伐风险 {form.deathRisk}% · 扭曲进度已突破临界点。协会的收尾人，很快就会找上门来。
        </p>

        <button
          onClick={confirmDistortion}
          className="border border-blood-500 bg-blood-600/20 px-10 py-3 font-serifcn tracking-[0.4em] text-blood-300 transition-all hover:bg-blood-600/50 hover:text-white"
        >
          接受这份扭曲
        </button>
      </div>
    </div>
  )
}
