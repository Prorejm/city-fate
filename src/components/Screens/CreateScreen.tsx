import { useState } from 'react'
import type { Gender } from '@/types'
import { TRAVERSE_TALENTS } from '@/core/data'
import { randomName } from '@/lib/utils'
import { useGameStore } from '@/stores/gameStore'

export function CreateScreen() {
  const { goToMenu, setDraft } = useGameStore()
  const [name, setName] = useState('穿越者')
  const [gender, setGender] = useState<Gender>('男')
  const [traverseId, setTraverseId] = useState<string | null>('modern-knowledge')
  const [identityId, setIdentityId] = useState<string | null>('backalley-orphan')

  const traverseTalents = TRAVERSE_TALENTS.filter((t) => t.kind === 'traverse')
  const identityTalents = TRAVERSE_TALENTS.filter((t) => t.kind === 'identity')
  const selectedIdentity = identityTalents.find((t) => t.id === identityId)

  const handleStart = () => {
    setDraft({ name: name.trim() || '穿越者', gender, traverseId, identityId })
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <button onClick={goToMenu} className="mb-6 font-mono text-xs text-ash-500 hover:text-ash-300">
        ← 返回
      </button>
      <h2 className="title-serif mb-1 text-3xl text-ash-300">穿越档案</h2>
      <p className="mb-8 text-sm text-ash-500">
        你在第七区的垃圾堆里醒来。你是谁？你带来了什么？你又将以何种身份，在这座都市挣扎求生？
      </p>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
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
      </div>

      {/* 穿越天赋 */}
      <div className="mb-6">
        <div className="mb-2 font-mono text-xs tracking-widest text-gold-400">◆ 穿越天赋（你带来了什么）</div>
        <div className="grid gap-3 md:grid-cols-3">
          {traverseTalents.map((t) => (
            <button
              key={t.id}
              onClick={() => setTraverseId(traverseId === t.id ? null : t.id)}
              className={`paper-panel p-4 text-left transition-all ${
                traverseId === t.id ? 'border-gold-400 shadow-[0_0_30px_rgba(192,154,63,0.25)]' : 'hover:border-void-500'
              }`}
            >
              <div className="mb-1 font-serifcn text-sm text-gold-400">{t.name}</div>
              <p className="text-xs leading-relaxed text-ash-400">{t.description}</p>
              {t.passive && <div className="mt-2 font-mono text-[10px] text-ash-500">被动：{t.passive}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* 开局身份天赋 */}
      <div className="mb-6">
        <div className="mb-2 font-mono text-xs tracking-widest text-blood-400">◆ 开局身份（你以何身份醒来）</div>
        <div className="grid gap-3 md:grid-cols-3">
          {identityTalents.map((t) => (
            <button
              key={t.id}
              onClick={() => setIdentityId(t.id)}
              className={`paper-panel p-4 text-left transition-all ${
                identityId === t.id ? 'border-blood-400 shadow-[0_0_30px_rgba(160,31,31,0.25)]' : 'hover:border-void-500'
              }`}
            >
              <div className="mb-1 font-serifcn text-sm text-ash-300">{t.name}</div>
              <p className="text-xs leading-relaxed text-ash-400">{t.description}</p>
              {t.identity && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded bg-void-700 px-1.5 py-0.5 font-mono text-[10px] text-gold-400">
                    {t.identity.initialWealth} 眼
                  </span>
                  <span className="rounded bg-void-700 px-1.5 py-0.5 font-mono text-[10px] text-ash-400">
                    {t.identity.initialIdentity}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedIdentity?.identity && (
        <div className="paper-panel mb-6 border-blood-500/40 p-4 text-sm text-ash-400">
          <span className="font-serifcn text-ash-300">开局预览：</span>
          你以「{selectedIdentity.identity.initialIdentity}」的身份，在「
          {selectedIdentity.identity.initialLocation === 'backalley-7'
            ? '第七区·无名巷'
            : selectedIdentity.identity.initialLocation === 'fixer-guild'
              ? '收尾人协会'
              : selectedIdentity.identity.initialLocation === 'blood-den'
                ? '旧血魔聚居地'
                : '后巷'}
          」醒来，身上有 {selectedIdentity.identity.initialWealth} 眼。
        </div>
      )}

      <button
        onClick={handleStart}
        className="w-full border border-blood-500 bg-blood-600/30 py-4 font-serifcn tracking-[0.3em] text-ash-300 transition-all hover:bg-blood-600/60 hover:text-white"
      >
        穿越
      </button>
    </div>
  )
}
