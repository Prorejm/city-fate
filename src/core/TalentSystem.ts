import type { CityFateData, RunState } from '@/types'
import { TRAVERSE_TALENTS } from './data'

/** 创建角色时应用穿越天赋与身份天赋 */
export function applyTraverseTalents(
  data: CityFateData,
  run: RunState,
  traverseId: string | null,
  identityId: string | null,
): void {
  const traverse = traverseId ? TRAVERSE_TALENTS.find((t) => t.id === traverseId) : undefined
  const identity = identityId ? TRAVERSE_TALENTS.find((t) => t.id === identityId) : undefined

  // 穿越天赋：属性 + 特质
  if (traverse?.effects) {
    for (const [k, v] of Object.entries(traverse.effects)) {
      const key = k as keyof CityFateData['stats']
      if (key in data.stats) {
        data.stats[key] = Math.max(0, Math.min(10, data.stats[key] + (v as number)))
      }
    }
  }

  // 身份天赋：初始身份/地点/资源/特质/解锁行动/NPC 好感
  const ident = identity?.identity
  if (ident) {
    data.identity = ident.initialIdentity
    data.affiliation = ident.initialAffiliation
    data.wealth = ident.initialWealth
    for (const t of ident.traits) {
      if (!data.traits.includes(t)) data.traits.push(t)
    }
    run.locationId = ident.initialLocation
    run.unlockedActions = [...new Set([...run.unlockedActions, ...ident.unlockActions])]
    run.unlockedLocations = [...new Set([...run.unlockedLocations, ident.initialLocation])]
    for (const [npcId, aff] of Object.entries(ident.npcAffinities)) {
      const st = run.npcStates.find((s) => s.id === npcId)
      if (st) st.affinity = aff
    }
  }

  // 身份天赋自身的属性效果
  if (identity?.effects) {
    for (const [k, v] of Object.entries(identity.effects)) {
      const key = k as keyof CityFateData['stats']
      if (key in data.stats) {
        data.stats[key] = Math.max(0, Math.min(10, data.stats[key] + (v as number)))
      }
    }
  }
}

/** 系统持有者：每 10 回合签到获得属性点 */
export function systemHolderCheck(data: CityFateData, roundCount: number): boolean {
  if (roundCount > 0 && roundCount % 10 === 0) {
    const lowest = (Object.keys(data.stats) as (keyof CityFateData['stats'])[]).reduce((a, b) =>
      data.stats[a] <= data.stats[b] ? a : b,
    )
    data.stats[lowest] = Math.min(10, data.stats[lowest] + 1)
    return true
  }
  return false
}

/** 现代人学识被动：知识类行动判定加成 */
export function modernKnowledgeBonus(data: CityFateData): number {
  return data.traits.includes('modern-knowledge') ? 0.12 : 0
}

/** 预知者被动：规避危险事件的概率 */
export function seerEvasionBonus(data: CityFateData): number {
  return data.traits.includes('seer') ? 0.15 : 0
}
