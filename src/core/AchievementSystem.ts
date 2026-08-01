import type { Achievement, CityFateData, GlobalMeta, RunState } from '@/types'
import { ACHIEVEMENTS } from './data'

/** 判定单个成就条件是否满足 */
export function checkCondition(
  achievement: Achievement,
  data: CityFateData,
  meta: GlobalMeta,
  run: RunState,
): boolean {
  const c = achievement.condition
  switch (c.type) {
    case 'age':
      return data.age >= (c.target ?? 0)
    case 'stat':
      return (data.stats[c.attr ?? 'physique'] ?? 0) >= (c.target ?? 10)
    case 'wealth':
      return data.wealth >= (c.target ?? 0)
    case 'identity':
      return data.identity === c.value
    case 'ego':
      return data.ego.isAwakened
    case 'distortion':
      return data.ego.distortionProgress >= 100 || !!run.distortionFormId
    case 'sin':
      return run.sinType === c.value
    case 'playCount':
      return meta.playCount >= (c.target ?? 0)
    case 'totalLifespan':
      return meta.totalLifespan >= (c.target ?? 0)
    case 'trait':
      if (typeof c.value === 'string') return data.traits.includes(c.value)
      return data.traits.length >= (c.target ?? 1)
    case 'keyMoment':
      return data.keyMoments.includes(c.value as string)
    case 'deathCause':
      return data.deathCause.includes(c.value as string)
    default:
      return false
  }
}

/** 扫描全部未解锁成就，返回本次新解锁的列表（同步写入 meta） */
export function checkAchievements(
  data: CityFateData,
  meta: GlobalMeta,
  run: RunState,
): Achievement[] {
  const newly: Achievement[] = []
  for (const a of ACHIEVEMENTS) {
    if (meta.unlockedAchievements.includes(a.id)) continue
    if (checkCondition(a, data, meta, run)) {
      meta.unlockedAchievements.push(a.id)
      newly.push(a)
    }
  }
  return newly
}
