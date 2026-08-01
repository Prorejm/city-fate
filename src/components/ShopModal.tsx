import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { findItem, ITEMS } from '@/core/data'
import { QUALITY_NAMES, addItem } from '@/core/ItemSystem'
import { QUALITY_COLORS } from '@/types'
import type { ItemCategory } from '@/types'

const SHOP_STOCK: { id: string; price: number }[] = [
  { id: 'w-dagger', price: 100 },
  { id: 'w-machete', price: 200 },
  { id: 'w-fixer-sword', price: 500 },
  { id: 'w-crossbow', price: 550 },
  { id: 'w-plasma-blade', price: 1500 },
  { id: 'a-leather-jacket', price: 120 },
  { id: 'a-zwei-plate', price: 700 },
  { id: 'a-anti-ballistic', price: 2200 },
  { id: 'c-bandage', price: 40 },
  { id: 'c-noodle', price: 25 },
  { id: 'c-medkit', price: 150 },
  { id: 'c-neurorelax', price: 350 },
]

const TABS: { id: ItemCategory | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'weapon', label: '武器' },
  { id: 'armor', label: '防具' },
  { id: 'consumable', label: '消耗品' },
]

export function ShopModal() {
  const { data, nextEvent } = useGameStore()
  const [tab, setTab] = useState<ItemCategory | 'all'>('all')
  const [msg, setMsg] = useState('')
  if (!data) return null

  const stock = SHOP_STOCK.filter((s) => {
    const def = findItem(s.id)
    if (!def) return false
    return tab === 'all' || def.category === tab
  })

  const buy = (id: string, price: number) => {
    const def = findItem(id)
    if (!def) return
    if (data.wealth < price) {
      setMsg('钱不够——后巷不讲赊账。')
      return
    }
    data.wealth -= price
    addItem(data, id)
    setMsg(`购入：${def.name}`)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-gold-400">◆ 后巷集市 · 阿梨的铺子 ◆</div>
        <div className="title-serif mb-1 text-lg text-ash-300">购买补给</div>
        <div className="mb-4 font-mono text-xs text-ash-500">持有 {data.wealth} 眼</div>

        <div className="mb-3 flex gap-2">
          {TABS.map((t) => (
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

        <div className="flex flex-col gap-2">
          {stock.map((s) => {
            const def = findItem(s.id)
            if (!def) return null
            const afford = data.wealth >= s.price
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 border border-void-700 bg-void-900/40 p-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: QUALITY_COLORS[def.quality] }}>
                      {def.name}
                    </span>
                    <span className="font-mono text-[9px] text-ash-600">{QUALITY_NAMES[def.quality]}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-ash-500">{def.description}</p>
                </div>
                <button
                  onClick={() => buy(s.id, s.price)}
                  disabled={!afford}
                  className="shrink-0 border border-gold-400 px-3 py-1 text-xs text-gold-400 transition-colors hover:bg-gold-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {s.price} 眼
                </button>
              </div>
            )
          })}
        </div>
        {msg && <div className="mt-3 font-mono text-xs text-gold-400">{msg}</div>}

        <button
          onClick={nextEvent}
          className="mt-4 w-full border border-void-600 py-3 font-serifcn tracking-widest text-ash-400 transition-all hover:border-ash-400 hover:text-ash-300"
        >
          离开铺子
        </button>
      </div>
    </div>
  )
}

export { ITEMS }
