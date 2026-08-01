import type { AttributeEffects, CityFateData, EquipmentSlot, ItemDef, ItemQuality } from '@/types'
import { ITEMS, findItem } from './data'

/** 品质掉落权重（白最多，金最少） */
const QUALITY_WEIGHTS: { quality: ItemQuality; w: number }[] = [
  { quality: 'white', w: 50 },
  { quality: 'green', w: 28 },
  { quality: 'blue', w: 14 },
  { quality: 'purple', w: 6 },
  { quality: 'gold', w: 2 },
]

/** 品质中文名 */
export const QUALITY_NAMES: Record<ItemQuality, string> = {
  white: '传闻',
  green: '都市传说',
  blue: '都市恶疾',
  purple: '都市梦魇',
  gold: '都市之星',
}

/** 加权随机品质 */
export function rollQuality(rand: () => number = Math.random): ItemQuality {
  const total = QUALITY_WEIGHTS.reduce((a, q) => a + q.w, 0)
  let r = rand() * total
  for (const q of QUALITY_WEIGHTS) {
    r -= q.w
    if (r <= 0) return q.quality
  }
  return 'white'
}

/** 按品质从物品库随机抽一件（可限定类别） */
export function rollItem(
  category?: ItemDef['category'],
  rand: () => number = Math.random,
): ItemDef | undefined {
  const pool = ITEMS.filter((i) => i.durability > 0 && (!category || i.category === category))
  if (pool.length === 0) return undefined
  return pool[Math.floor(rand() * pool.length)]
}

/** 加入背包 */
export function addItem(data: CityFateData, itemId: string, durability?: number): boolean {
  const def = findItem(itemId)
  if (!def) return false
  data.inventory.push({ id: itemId, durability: durability ?? def.durability })
  return true
}

/** 从背包移除一件 */
export function removeItem(data: CityFateData, index: number): void {
  data.inventory.splice(index, 1)
}

/** 装备物品 */
export function equipItem(data: CityFateData, index: number): boolean {
  const entry = data.inventory[index]
  if (!entry) return false
  const def = findItem(entry.id)
  if (!def || !def.slot) return false
  // 卸下当前槽位的物品（放回背包）
  const current = data.equipped[def.slot]
  if (current) {
    data.inventory.push({ id: current, durability: def.durability })
  }
  data.equipped[def.slot] = entry.id
  data.inventory.splice(index, 1)
  return true
}

/** 卸下装备（放回背包） */
export function unequipItem(data: CityFateData, slot: EquipmentSlot): boolean {
  const itemId = data.equipped[slot]
  if (!itemId) return false
  const def = findItem(itemId)
  data.inventory.push({ id: itemId, durability: def?.durability ?? 0 })
  delete data.equipped[slot]
  return true
}

/** 使用消耗品，返回使用结果描述 */
export function consumeItem(
  data: CityFateData,
  run: { health: number; pressure: number; foodLevel: number },
  index: number,
  mutate: (patch: Partial<{ health: number; pressure: number; foodLevel: number }>) => void,
): string | null {
  const entry = data.inventory[index]
  if (!entry) return null
  const def = findItem(entry.id)
  if (!def?.consumable) return null
  const c = def.consumable
  if (c.heal) mutate({ health: Math.min(100, run.health + c.heal) })
  if (c.pressure) mutate({ pressure: Math.max(0, Math.min(100, run.pressure + c.pressure)) })
  if (c.food) mutate({ foodLevel: Math.max(0, Math.min(5, run.foodLevel + c.food)) })
  data.inventory.splice(index, 1)
  return def.name
}

/** 装备属性加成聚合（六维 + 成功率修正 + 被动列表） */
export function equipmentBonuses(data: CityFateData): {
  effects: Record<string, number>
  chanceMod: number
  passives: string[]
} {
  const effects: Record<string, number> = {}
  let chanceMod = 0
  const passives: string[] = []
  for (const slot of Object.keys(data.equipped) as EquipmentSlot[]) {
    const id = data.equipped[slot]
    if (!id) continue
    const def = findItem(id)
    if (!def) continue
    if (def.effects) {
      for (const [k, v] of Object.entries(def.effects)) {
        effects[k] = (effects[k] ?? 0) + (v as number)
      }
    }
    if (def.chanceMod) chanceMod += def.chanceMod
    if (def.passive) passives.push(def.passive)
  }
  return { effects, chanceMod, passives }
}

/** 装备提供的六维加成（用于属性面板显示与行动计算） */
export function equipmentStatBonus(data: CityFateData, attr: keyof AttributeEffects): number {
  const { effects } = equipmentBonuses(data)
  return effects[attr] ?? 0
}
export function equipmentChanceMod(data: CityFateData): number {
  return equipmentBonuses(data).chanceMod
}

/** 消耗耐久（战斗/行动后），耐久归零的物品损坏移除（简化：装备耐久通过 useConsumable 等处理） */
export function wearEquipment(_data: CityFateData, _amount = 1): string[] {
  return []
}

/** 背包物品数量 */
export function inventoryCount(data: CityFateData): number {
  return data.inventory.length
}

export { ITEMS }
