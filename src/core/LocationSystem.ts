import type { CityFateData, LocationDef, RunState, Stage } from '@/types'
import { evalConditions } from '@/engine/ConditionEvaluator'
import { snapshotContext } from './PropertySystem'
import { LOCATIONS, findAction, findLocation } from './data'

/** 计算当前阶段：生存→立足→闯荡 */
export function currentStage(data: CityFateData, run: RunState): Stage {
  // 立足条件：稳定收入（财富 ≥ 500 或声望 ≥ 10）+ 有住处（shelterLevel ≥ 1）
  const settled = (data.wealth >= 500 || run.reputation >= 10) && run.shelterLevel >= 1
  if (settled && run.reputation >= 25) return 'ADVENTURE'
  if (settled) return 'SETTLED'
  return 'SURVIVAL'
}

/** 检查某地点是否已解锁（含条件判定） */
export function locationUnlocked(data: CityFateData, run: RunState, loc: LocationDef): boolean {
  const ctx = snapshotContext(data, run)
  if (loc.unlock.reputation !== undefined && ctx.reputation! < loc.unlock.reputation) return false
  if (loc.unlock.stat && (ctx[loc.unlock.stat.attr] ?? 0) < loc.unlock.stat.value) return false
  if (loc.unlock.actionId && !run.unlockedActions.includes(loc.unlock.actionId)) return false
  if (loc.unlock.trait && !data.traits.includes(loc.unlock.trait)) return false
  return true
}

/** 刷新已解锁地点列表 */
export function refreshUnlockedLocations(data: CityFateData, run: RunState): string[] {
  const unlocked = LOCATIONS.filter((l) => locationUnlocked(data, run, l)).map((l) => l.id)
  run.unlockedLocations = [...new Set([...run.unlockedLocations, ...unlocked])]
  return run.unlockedLocations
}

/** 进入地点（消耗体力），返回是否成功 */
export function travelTo(data: CityFateData, run: RunState, locationId: string): { ok: boolean; cost: number } {
  const loc = findLocation(locationId)
  if (!loc) return { ok: false, cost: 0 }
  if (!run.unlockedLocations.includes(locationId)) {
    // 尝试即时解锁（条件满足即可进入）
    if (!locationUnlocked(data, run, loc)) return { ok: false, cost: 0 }
  }
  if (run.stamina < loc.staminaCost) return { ok: false, cost: loc.staminaCost }
  run.stamina -= loc.staminaCost
  run.locationId = locationId
  if (!run.unlockedLocations.includes(locationId)) run.unlockedLocations.push(locationId)
  // 地点 NPC 结识
  for (const npc of loc.actions.map((a) => a)) {
    void npc
  }
  return { ok: true, cost: loc.staminaCost }
}

/** 行动是否可用（当前地点提供 + 已解锁 + 条件满足 + 资源足够 + 路线互斥） */
export function actionAvailable(data: CityFateData, run: RunState, actionId: string): boolean {
  const action = findAction(actionId)
  if (!action) return false
  // 该地点必须提供此行动（locations.json 的 actions 列表为权威）
  const loc = findLocation(run.locationId)
  if (!loc || !loc.actions.includes(actionId)) return false
  if (!run.unlockedActions.includes(actionId)) return false

  // 路线互斥：加入手指后协会委托板关闭
  const isFinger = data.traits.includes('finger-member') || data.affiliation === '中指' || data.affiliation === '无名指'
  if (isFinger && actionId === 'assoc-board') return false
  // 路线互斥：成为协会收尾人后帮派任务关闭
  if (run.fixerGrade >= 1 && (actionId === 'join-finger' || actionId === 'finger-job' || actionId === 'learn-finger')) return false

  // 深宵行动仅在深宵窗口可见
  if ((actionId === 'deep-night-walk' || actionId === 'deep-night-risk') && !run.deepNightWindow) return false

  const ctx = snapshotContext(data, run)
  if (!evalConditions(action.conditions, ctx)) return false
  if (run.actionPoints < action.apCost) return false
  if (run.stamina < action.staminaCost) return false
  return true
}
