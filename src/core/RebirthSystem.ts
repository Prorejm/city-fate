import type { CityFateData, GlobalMeta, RunState } from '@/types'

/** 计算本局遗产点（死亡结算时） */
export function computeRebirthPoints(
  data: CityFateData,
  meta: GlobalMeta,
  run: RunState,
): number {
  const highest = Math.max(...Object.values(data.stats))
  const achievements = meta.unlockedAchievements.length
  const egoBonus = data.ego.isAwakened ? 20 : 0
  const distortionBonus = run.distortionFormId ? 10 : 0
  const points =
    Math.floor(data.age) +
    highest * 0.5 +
    achievements * 3 +
    meta.totalEarned / 10000 +
    egoBonus +
    distortionBonus
  return Math.floor(points)
}

/** 死亡结算：累加全局数据 */
export function finalizeDeath(
  data: CityFateData,
  meta: GlobalMeta,
  run: RunState,
): { points: number } {
  data.isAlive = false
  meta.playCount += 1
  meta.totalLifespan += data.age
  meta.totalEarned += data.wealth
  meta.lastDeath = {
    name: data.name,
    age: data.age,
    deathCause: data.deathCause,
    identity: data.identity,
  }
  const points = computeRebirthPoints(data, meta, run)
  meta.rebirthPoints += points
  return { points }
}

/** 新周目继承选项 */
export interface RebirthOption {
  id: string
  name: string
  cost: number
  description: string
  apply: (data: CityFateData, meta: GlobalMeta) => void
}

export function getRebirthOptions(meta: GlobalMeta): RebirthOption[] {
  return [
    {
      id: 'trait-inherit',
      name: '继承一个特质',
      cost: 10,
      description: '选择上一位“你”的一项特质，延续到新的人生。',
      apply: (data) => {
        if (meta.lastDeath) {
          // 简化：给予"光之种适格者"倾向
          data.traits.push('light-receiver')
        }
      },
    },
    {
      id: 'stat-boost',
      name: '属性 +1',
      cost: 5,
      description: '为新人生的一项属性增加 1 点。',
      apply: (data) => {
        const lowest = (Object.keys(data.stats) as (keyof CityFateData['stats'])[]).reduce((a, b) =>
          data.stats[a] <= data.stats[b] ? a : b,
        )
        data.stats[lowest] = Math.min(10, data.stats[lowest] + 1)
      },
    },
    {
      id: 'wealth-start',
      name: '初始财富',
      cost: 3,
      description: '新人生携带一笔额外的初始财富。',
      apply: (data) => {
        data.wealth += 3000
      },
    },
    {
      id: 'ego-memory',
      name: 'EGO 记忆',
      cost: 25,
      description: '保留上一位“你”的觉醒倾向，新人生更容易觉醒同主题 E.G.O。',
      apply: (_data, m) => {
        m.egoMemory = 'light'
      },
    },
  ]
}

/** 消费遗产点 */
export function buyRebirthOption(meta: GlobalMeta, optionId: string): boolean {
  const opt = getRebirthOptions(meta).find((o) => o.id === optionId)
  if (!opt || meta.rebirthPoints < opt.cost) return false
  meta.rebirthPoints -= opt.cost
  return true
}
