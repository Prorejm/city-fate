import type { GameAction, ProfessionDef, ProfessionLevel, RunState } from '@/types'
import { PROFESSIONS, findProfession } from './data'

/** 升级门槛：1级 0 → 2级 100 → 3级 250 → 4级 500 → 5级 900 */
export const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400]

/** 行动经验流入职业（依据 action.xp） */
export function xpForAction(action: GameAction): Record<string, number> {
  const out: Record<string, number> = {}
  if (action.xp) {
    out[action.xp.profession] = action.xp.amount
  }
  return out
}

/** 给职业加经验，返回升级信息列表 */
export function grantXp(
  run: RunState,
  professionId: string,
  amount: number,
): { profession: string; from: number; to: number; unlocked: string[] }[] {
  const prof = findProfession(professionId)
  if (!prof || amount <= 0) return []
  const cur = run.professionXp[professionId] ?? 0
  run.professionXp[professionId] = cur + amount
  return checkLevelUps(run, prof)
}

/** 检查升级（等级提升 + 解锁行动） */
function checkLevelUps(
  run: RunState,
  prof: ProfessionDef,
): { profession: string; from: number; to: number; unlocked: string[] }[] {
  const results: { profession: string; from: number; to: number; unlocked: string[] }[] = []
  const curLevel = run.professionLevels[prof.id] ?? 0
  const xp = run.professionXp[prof.id] ?? 0
  let level = curLevel
  const unlocked: string[] = []
  for (let lv = curLevel + 1; lv <= prof.maxLevel; lv++) {
    if (xp >= XP_THRESHOLDS[lv - 1]) {
      level = lv
      const def = prof.levels.find((l) => l.level === lv)
      if (def) {
        for (const a of def.unlockActions) {
          if (!run.unlockedActions.includes(a)) {
            run.unlockedActions.push(a)
            unlocked.push(a)
          }
        }
      }
    } else {
      break
    }
  }
  if (level > curLevel) {
    run.professionLevels[prof.id] = level
    results.push({ profession: prof.id, from: curLevel, to: level, unlocked })
  }
  return results
}

/** 总职业等级（各职业等级之和） */
export function totalProfessionLevel(run: RunState): number {
  return Object.values(run.professionLevels).reduce((a, b) => a + b, 0)
}

/** 当前职业等级特性（用于展示被动） */
export function levelFeatures(prof: ProfessionDef, run: RunState): ProfessionLevel[] {
  const lv = run.professionLevels[prof.id] ?? 0
  return prof.levels.filter((l) => l.level <= lv)
}

/** 当前职业的全部被动描述 */
export function passivesFor(prof: ProfessionDef, run: RunState): string[] {
  const lv = run.professionLevels[prof.id] ?? 0
  return prof.levels
    .filter((l) => l.level <= lv && l.passive)
    .map((l) => l.passive)
}

/** 是否可选子职（达到 subclassAt 等级但未选择） */
export function canChooseSubclass(prof: ProfessionDef, run: RunState): boolean {
  const lv = run.professionLevels[prof.id] ?? 0
  return !!prof.subclassAt && lv >= prof.subclassAt && !run.subclassChoice[prof.id]
}

/** 选择子职 */
export function chooseSubclass(run: RunState, professionId: string, subclassId: string): boolean {
  const prof = findProfession(professionId)
  if (!prof || !canChooseSubclass(prof, run)) return false
  const valid = prof.subclasses?.some((s) => s.id === subclassId)
  if (!valid) return false
  run.subclassChoice[professionId] = subclassId
  return true
}

/** 委托完成经验（按难度流入收尾人职业） */
export function xpForCommissionTier(tier: string): number {
  switch (tier) {
    case '传闻':
      return 30
    case '都市传说':
      return 60
    case '都市恶疾':
      return 100
    case '都市梦魇':
      return 150
    case '都市之星':
      return 250
    default:
      return 30
  }
}

export { PROFESSIONS }
