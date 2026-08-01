import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { NPCS, ASSOCIATIONS, ITEMS } from '@/core/data'
import { QUALITY_NAMES } from '@/core/ItemSystem'
import { QUALITY_COLORS } from '@/types'

type Tab = 'npc' | 'assoc' | 'relic'

export function CompendiumModal() {
  const { data, nextEvent } = useGameStore()
  const [tab, setTab] = useState<Tab>('npc')
  if (!data) return null
  const metNpcIds = new Set(data.keyMoments.filter((k) => k.startsWith('npc-')).map((k) => k.replace('npc-', '')))

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-gold-400">◆ 都市图鉴 ◆</div>
        <div className="title-serif mb-4 text-lg text-ash-300">收录你遇见过的都市</div>

        <div className="mb-4 flex gap-2">
          {(
            [
              { id: 'npc', label: `人物 ${metNpcIds.size}/${NPCS.length}` },
              { id: 'assoc', label: `协会 ${data.traits.filter((t) => t.startsWith('assoc-')).length}/${ASSOCIATIONS.length}` },
              { id: 'relic', label: `遗物 ${data.inventory.filter((i) => i.id.startsWith('r-')).length}/${ITEMS.filter((i) => i.category === 'relic').length}` },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`border px-3 py-1 text-xs transition-colors ${
                tab === t.id ? 'border-gold-400 text-gold-400' : 'border-void-600 text-ash-500 hover:border-ash-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'npc' && (
          <div className="flex flex-col gap-2">
            {NPCS.map((n) => {
              const met = metNpcIds.has(n.id)
              return (
                <div key={n.id} className={`flex items-center gap-3 border border-void-700 bg-void-900/40 p-2.5 ${met ? '' : 'opacity-50'}`}>
                  {met ? (
                    <img src={`/city-fate/avatars/${n.avatar}`} alt={n.name} className="h-10 w-10 rounded border border-void-600 object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded border border-void-700 font-mono text-lg text-void-600">?</div>
                  )}
                  <div>
                    <div className="text-sm text-ash-300">{met ? n.name : '？？？'}</div>
                    <div className="font-mono text-[10px] text-ash-500">{met ? n.title : '未结识'}</div>
                  </div>
                  {met && <div className="ml-auto max-w-[45%] text-right text-[10px] text-ash-600">{n.locationName}</div>}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'assoc' && (
          <div className="flex flex-col gap-2">
            {ASSOCIATIONS.map((a) => {
              const known = data.traits.includes(`assoc-${a.id}`)
              return (
                <div key={a.id} className={`flex items-center gap-3 border border-void-700 bg-void-900/40 p-2.5 ${known ? '' : 'opacity-50'}`}>
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: known ? a.color : '#333' }} />
                  <div>
                    <div className="text-sm text-ash-300">{known ? a.name : '？？？'}</div>
                    <div className="font-mono text-[10px] text-ash-500">{known ? `第${a.number}协会 · ${a.role}` : '未接触'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'relic' && (
          <div className="flex flex-col gap-2">
            {ITEMS.filter((i) => i.category === 'relic').map((it) => {
              const owned = data.inventory.some((e) => e.id === it.id)
              return (
                <div key={it.id} className={`flex items-center gap-3 border border-void-700 bg-void-900/40 p-2.5 ${owned ? '' : 'opacity-50'}`}>
                  <span className="font-mono text-lg" style={{ color: owned ? QUALITY_COLORS[it.quality] : '#333' }}>
                    {owned ? '◆' : '◇'}
                  </span>
                  <div>
                    <div className="text-sm text-ash-300">{owned ? it.name : '？？？'}</div>
                    <div className="font-mono text-[10px] text-ash-500">{owned ? `${QUALITY_NAMES[it.quality]} · ${it.passive ?? '无被动'}` : '未获得'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={nextEvent}
          className="mt-4 w-full border border-void-600 py-3 font-serifcn tracking-widest text-ash-400 transition-all hover:border-ash-400 hover:text-ash-300"
        >
          关闭图鉴
        </button>
      </div>
    </div>
  )
}
