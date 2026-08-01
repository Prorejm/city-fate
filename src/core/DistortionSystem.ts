import type { CityFateData, DistortionForm, RunState, SinFate } from '@/types'
import { DISTORTION_FORMS, SINS } from './data'
import { evalConditions } from '@/engine/ConditionEvaluator'
import { snapshotContext } from './PropertySystem'

export interface DistortionApplyResult {
  form: DistortionForm
}

/** 进入扭曲路线：选择形态并应用增益/副作用 */
export function applyDistortion(data: CityFateData, run: RunState, rand: () => number = Math.random): DistortionApplyResult {
  const form = DISTORTION_FORMS[Math.floor(rand() * DISTORTION_FORMS.length)]
  run.distortionFormId = form.id
  data.ego.distortionProgress = Math.min(100, data.ego.distortionProgress + 30)
  return { form }
}

/** 大罪结局匹配：按属性画像从七种大罪中选出其一 */
export function resolveSin(data: CityFateData, run: RunState): SinFate {
  const ctx = snapshotContext(data, run)
  const matched = SINS.find((s) => evalConditions(s.trigger, ctx))
  const fate = matched ?? SINS[0]
  run.sinType = fate.type
  return fate
}

/** 扭曲形态的副作用（每年结算时应用） */
export function applyDistortionSideEffects(data: CityFateData, run: RunState): void {
  if (!run.distortionFormId) return
  const form = DISTORTION_FORMS.find((f) => f.id === run.distortionFormId)
  if (!form) return
  for (const [key, v] of Object.entries(form.sideEffects)) {
    if (key === 'health') run.health = Math.max(0, run.health + (v as number))
    else if (key === 'will' || key === 'physique' || key === 'synergy' || key === 'instinct' || key === 'intelligence') {
      const k = key as 'will' | 'physique' | 'synergy' | 'instinct' | 'intelligence'
      data.stats[k] = Math.max(0, data.stats[k] + (v as number))
    }
  }
}
