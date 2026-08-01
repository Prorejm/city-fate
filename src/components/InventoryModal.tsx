import { useGameStore } from '@/stores/gameStore'
import { findItem } from '@/core/data'
import { QUALITY_NAMES, equipmentBonuses, inventoryCount } from '@/core/ItemSystem'
import { QUALITY_COLORS } from '@/types'
import type { EquipmentSlot, ItemDef } from '@/types'

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  'main-hand': '主手',
  'off-hand': '副手',
  armor: '护甲',
  accessory: '饰品',
}

function ItemCard({
  def,
  index,
  durability,
}: {
  def: ItemDef
  index?: number
  durability?: number
}) {
  const { equipItem, useItem } = useGameStore()
  const color = QUALITY_COLORS[def.quality]
  return (
    <div className="border border-void-700 bg-void-900/40 p-2.5" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color }}>
          {def.name}
        </span>
        <span className="font-mono text-[9px] text-ash-600">{QUALITY_NAMES[def.quality]}</span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-ash-500">{def.description}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex gap-1">
          {def.category === 'consumable' && index !== undefined && (
            <button
              onClick={() => useItem(index)}
              className="border border-gold-400 px-2 py-0.5 text-[10px] text-gold-400 transition-colors hover:bg-gold-400/15"
            >
              使用
            </button>
          )}
          {def.category !== 'consumable' && def.slot && index !== undefined && (
            <button
              onClick={() => equipItem(index)}
              className="border border-gold-400 px-2 py-0.5 text-[10px] text-gold-400 transition-colors hover:bg-gold-400/15"
            >
              装备
            </button>
          )}
          {durability !== undefined && def.durability > 0 && (
            <span className="px-1 py-0.5 font-mono text-[9px] text-ash-600">
              耐久 {durability}/{def.durability}
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-ash-500">{def.value} 眼</span>
      </div>
    </div>
  )
}

export function InventoryModal() {
  const { data, run, unequipItem, nextEvent } = useGameStore()
  if (!data || !run) return null
  const { effects, chanceMod, passives } = equipmentBonuses(data)
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-gold-400">◆ 背包 ◆</div>
        <div className="title-serif mb-4 text-lg text-ash-300">装备与物品</div>

        {/* 装备槽 */}
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {(['main-hand', 'off-hand', 'armor', 'accessory'] as EquipmentSlot[]).map((slot) => {
            const cur = data.equipped[slot]
            const def = cur ? findItem(cur.id) : undefined
            return (
              <div key={slot} className="border border-void-700 p-2">
                <div className="mb-1 font-mono text-[9px] text-ash-600">{SLOT_LABELS[slot]}</div>
                {def ? (
                  <div>
                    <div className="text-xs" style={{ color: QUALITY_COLORS[def.quality] }}>
                      {def.name}
                    </div>
                    <div className="mt-0.5 font-mono text-[9px] text-ash-600">
                      {def.durability > 0 ? `耐久 ${cur!.durability}/${def.durability}` : '遗物'}
                    </div>
                    <button
                      onClick={() => unequipItem(slot)}
                      className="mt-1 border border-ash-500 px-1.5 py-0.5 text-[9px] text-ash-400 hover:border-ash-300"
                    >
                      卸下
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-void-600">空</div>
                )}
              </div>
            )
          })}
        </div>

        {/* 装备加成 */}
        {(Object.keys(effects).length > 0 || chanceMod > 0 || passives.length > 0) && (
          <div className="mb-4 rounded border border-void-700 bg-void-900/30 p-3 text-[11px] text-ash-400">
            <div className="mb-1 font-mono text-[9px] text-ash-600">装备加成</div>
            {Object.entries(effects).map(([k, v]) => (
              <span key={k} className="mr-3">
                {k} +{v}
              </span>
            ))}
            {chanceMod > 0 && <span className="mr-3">行动成功率 +{Math.round(chanceMod * 100)}%</span>}
            {passives.map((p) => (
              <span key={p} className="mr-3">
                {p}
              </span>
            ))}
          </div>
        )}

        {/* 背包列表 */}
        <div className="mb-1 font-mono text-[9px] text-ash-600">背包（{inventoryCount(data)}）</div>
        {data.inventory.length === 0 ? (
          <div className="rounded border border-void-700 px-3 py-6 text-center text-sm text-ash-500">
            背包空空如也。去战斗、探索或商店里找点东西吧。
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.inventory.map((entry, i) => {
              const def = findItem(entry.id)
              if (!def) return null
              return <ItemCard key={i} def={def} index={i} durability={entry.durability} />
            })}
          </div>
        )}

        <button
          onClick={nextEvent}
          className="mt-4 w-full border border-void-600 py-3 font-serifcn tracking-widest text-ash-400 transition-all hover:border-ash-400 hover:text-ash-300"
        >
          关闭
        </button>
      </div>
    </div>
  )
}
