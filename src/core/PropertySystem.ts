import type { AttributeEffects, CityFateData, EffectKey, RunState, Stats } from '@/types'
import { clamp } from '@/engine/GameConfig'

const CORE_ATTRS: EffectKey[] = ['physique', 'intelligence', 'instinct', 'will', 'fortune', 'synergy']

export function clampStats(stats: Stats): Stats {
  const out = { ...stats }
  for (const k of CORE_ATTRS) {
    out[k as keyof Stats] = clamp(out[k as keyof Stats], 0, 10)
  }
  return out
}

export function allocStats(base: Stats, deltas: Partial<Stats>): Stats {
  return clampStats({ ...base, ...deltas })
}

/** 应用事件/EGO/扭曲效果到运行时状态（不入存档的 health/pressure/reputation 与属性、财富、扭曲进度） */
export function applyEffects(
  data: CityFateData,
  run: RunState,
  effects: AttributeEffects | undefined,
): { log?: string; bankrupt: boolean } {
  if (!effects) return { bankrupt: false }
  let bankrupt = false
  for (const [key, raw] of Object.entries(effects)) {
    const k = key as EffectKey
    const v = raw as number
    if (CORE_ATTRS.includes(k)) {
      data.stats[k as keyof Stats] = clamp(data.stats[k as keyof Stats] + v, 0, 10)
    } else if (k === 'health') {
      run.health = clamp(run.health + v, 0, 100)
    } else if (k === 'pressure') {
      const delta = run.pressureLocked && v > 0 ? Math.round(v * 0.5) : v
      run.pressure = clamp(run.pressure + delta, 0, 100)
    } else if (k === 'wealth') {
      data.wealth = Math.max(0, data.wealth + Math.round(v))
      if (data.wealth === 0 && v < 0) bankrupt = true
    } else if (k === 'distortion') {
      data.ego.distortionProgress = clamp(data.ego.distortionProgress + Math.round(v), 0, 100)
    } else if (k === 'reputation') {
      run.reputation = Math.max(0, run.reputation + Math.round(v))
    }
  }
  return { bankrupt }
}

export function snapshotContext(data: CityFateData, run: RunState): Partial<Record<EffectKey, number>> {
  return {
    ...data.stats,
    health: run.health,
    pressure: run.pressure,
    wealth: data.wealth,
    distortion: data.ego.distortionProgress,
    reputation: run.reputation,
  }
}
