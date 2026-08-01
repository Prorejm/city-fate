import type { CityFateData, RunState } from '@/types'

/** 奇点亲和等级 */
export interface SingularityLevel {
  level: number
  name: string
  threshold: number
  desc: string
}

export const SINGULARITY_LEVELS: SingularityLevel[] = [
  { level: 1, name: '奇点门外汉', threshold: 0, desc: '你对奇点一无所知——那不过是都市的都市传说。' },
  { level: 2, name: '奇点学徒', threshold: 20, desc: '你开始理解奇点的皮毛：奇迹，不过是有专利的规则。' },
  { level: 3, name: '奇点研究员', threshold: 50, desc: '你参与过真正的奇点项目，能在翼的实验室里走动。' },
  { level: 4, name: '奇点使', threshold: 100, desc: '你触碰过奇迹本身——翼公司开始警惕你的存在。' },
]

export function singularityLevel(points: number): SingularityLevel {
  let cur = SINGULARITY_LEVELS[0]
  for (const l of SINGULARITY_LEVELS) {
    if (points >= l.threshold) cur = l
  }
  return cur
}

/** 奇点亲和天赋：翼/工坊系行动金币收益 +15% */
export function singularityGoldBonus(data: CityFateData, gold: number): number {
  if (data.traits.includes('singularity-affinity')) {
    return Math.floor(gold * 0.15)
  }
  return 0
}

/** 累积奇点点数（翼/工坊研发行动） */
export function gainSingularity(run: RunState, amount: number): void {
  run.singularityPoints += amount
}

/** 工坊信任等级（0-3） */
export function workshopTrustLevel(trust: number): number {
  if (trust >= 30) return 3
  if (trust >= 15) return 2
  if (trust >= 5) return 1
  return 0
}

export const WORKSHOP_TRUST_NAMES = ['路人', '熟客', '工坊之友', '锻造大师']
