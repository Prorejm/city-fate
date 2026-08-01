import type { Condition, CompoundCondition, ConditionSpec, EffectKey } from '@/types'

export type EvalContext = Partial<Record<EffectKey, number>>

function evalSingle(cond: Condition, ctx: EvalContext): boolean {
  const v = ctx[cond.attribute] ?? 0
  switch (cond.operator) {
    case '>=':
      return v >= cond.value
    case '<=':
      return v <= cond.value
    case '>':
      return v > cond.value
    case '<':
      return v < cond.value
    case '==':
      return v === cond.value
    default:
      return false
  }
}

export function evalConditions(spec: ConditionSpec | undefined, ctx: EvalContext): boolean {
  if (!spec) return true
  if ('op' in spec) {
    const compound = spec as CompoundCondition
    if (compound.op === 'AND') return compound.conditions.every((c) => evalConditions(c, ctx))
    return compound.conditions.some((c) => evalConditions(c, ctx))
  }
  return evalSingle(spec as Condition, ctx)
}

/** 供数据校验脚本使用：校验条件引用是否合法 */
export function collectConditions(spec: ConditionSpec | undefined, acc: Condition[] = []): Condition[] {
  if (!spec) return acc
  if ('op' in spec) {
    for (const c of (spec as CompoundCondition).conditions) collectConditions(c, acc)
  } else {
    acc.push(spec as Condition)
  }
  return acc
}
