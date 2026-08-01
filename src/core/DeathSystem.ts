import type { CityFateData, DeathType, RunState } from '@/types'
import { MAX_AGE } from '@/engine/GameConfig'
import { findDeathType } from './data'

export interface DeathResult {
  deathId: string
  name: string
  cause: string
  epitaph: string
  isAgeMax?: boolean
}

/** 死亡判定：返回死亡结果或 null */
export function checkDeath(data: CityFateData, run: RunState): DeathResult | null {
  // 1. 年龄上限：150 岁自然老死
  if (data.age >= MAX_AGE) {
    return makeDeath('natural', { isAgeMax: true })
  }
  // 2. 彻底扭曲
  if (data.ego.distortionProgress >= 100) {
    return makeDeath('distorted')
  }
  // 3. 健康归零（幼年夭折）
  if (run.health <= 0) {
    if (data.age < 10) {
      return {
        deathId: 'young',
        name: '夭折',
        cause: '夭折',
        epitaph: '都市从不怜悯幼小的生命。你还没能记住天空的颜色，就离开了。',
      }
    }
    return makeDeath('disease')
  }
  return null
}

export function makeDeath(deathId: string, extra?: Partial<DeathResult>): DeathResult {
  const t: DeathType | undefined = findDeathType(deathId)
  if (!t) {
    return {
      deathId,
      name: deathId,
      cause: deathId,
      epitaph: '生命在此终结。',
      ...extra,
    }
  }
  return {
    deathId: t.id,
    name: t.name,
    cause: t.cause,
    epitaph: t.epitaph,
    ...extra,
  }
}

/** 由死亡链 ID 生成死亡结果 */
export function deathFromChain(chainId: string): DeathResult {
  return makeDeath(chainId)
}
