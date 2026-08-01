import type { CityFateData, EgoTemplate, RunState } from '@/types'
import { EGO_INSTINCT_MIN, EGO_SYNERGY_MIN, EGO_WILL_MIN } from '@/engine/GameConfig'
import { EGO_TEMPLATES } from './data'

export interface EgoAwakenResult {
  ego: EgoTemplate
  egoName: string
  egoType: '庇护' | '武器' | '装备'
}

/** EGO 觉醒资格校验（世界观点：接受痛苦与罪孽，需要足够意志与共鸣） */
export function canAwakenEgo(data: CityFateData): boolean {
  return (
    data.stats.will >= EGO_WILL_MIN &&
    data.stats.synergy >= EGO_SYNERGY_MIN &&
    data.stats.instinct >= EGO_INSTINCT_MIN
  )
}

/** 按属性画像与人生主题，从 EGO 库中匹配最适合的 EGO */
export function chooseEgo(data: CityFateData, rand: () => number = Math.random): EgoTemplate {
  const candidates = EGO_TEMPLATES.filter((e) => {
    return (
      data.stats.will >= e.unlockReq.willMin &&
      data.stats.synergy >= e.unlockReq.synergyMin &&
      data.stats.instinct >= e.unlockReq.instinctMin
    )
  })
  const pool = candidates.length > 0 ? candidates : EGO_TEMPLATES

  const scored = pool.map((e) => {
    let score = rand() * 4
    // 高意志偏好"武器/庇护"类
    if (data.stats.will >= 7) score += 1
    if (data.stats.synergy >= 7 && e.type === '庇护') score += 1
    if (data.stats.physique >= 7 && e.type === '武器') score += 1
    // 光之种适格者更容易获得高阶 EGO
    if (data.traits.includes('seed-of-light') || data.traits.includes('light-receiver')) score += 1.5
    return { e, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].e
}

/** 觉醒 EGO：写入数据并应用常驻效果 */
export function awakenEgo(data: CityFateData, run: RunState, rand?: () => number): EgoAwakenResult {
  const ego = chooseEgo(data, rand)
  data.ego.isAwakened = true
  data.ego.egoName = ego.name
  data.ego.egoType = ego.type
  data.ego.distortionProgress = Math.max(0, data.ego.distortionProgress - 40)
  run.pressureLocked = true
  run.pressure = Math.max(0, run.pressure - 25)
  return { ego, egoName: ego.name, egoType: ego.type }
}
