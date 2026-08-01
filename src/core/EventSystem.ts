import type { CityFateData, GameEvent, RunState } from '@/types'
import { PRESSURE_CRISIS, PRESSURE_WHISPER, eventsPerYear } from '@/engine/GameConfig'
import { evalConditions } from '@/engine/ConditionEvaluator'
import { weightedRandom } from '@/engine/Random'
import { snapshotContext } from './PropertySystem'
import { getAllEvents } from './data'

export interface EventSelection {
  event: GameEvent
  isVoiceCrisis?: boolean
}

const VOICE_CRISIS_ID = 9001
const VOICE_WHISPER_ID = 9000

/**
 * 生成一年的计划：返回要展示的事件列表（含强制插队的内心之声）。
 * voiceTrigger 事件（叩问自我）在压力 ≥ 阈值时强制插队。
 */
export function planYear(data: CityFateData, run: RunState, rand: () => number = Math.random): EventSelection[] {
  const plan: EventSelection[] = []
  const count = eventsPerYear(data.age)

  // 内心之声：压力 ≥ 80 强制触发一次（全周目仅一次）
  if (run.pressure >= PRESSURE_CRISIS && !run.voiceCrisisDone) {
    run.voiceCrisisDone = true
    const crisis = getAllEvents().find((e) => e.id === VOICE_CRISIS_ID)
    if (crisis) {
      plan.push({ event: crisis, isVoiceCrisis: true })
      return plan // 叩问自我是年度核心事件，强制独占本年
    }
  }

  // 低语预兆：压力 ≥ 60 且未触发过
  if (run.pressure >= PRESSURE_WHISPER && !run.voiceWhisperDone && rand() < 0.5) {
    run.voiceWhisperDone = true
    const whisper = getAllEvents().find((e) => e.id === VOICE_WHISPER_ID)
    if (whisper) {
      plan.push({ event: whisper })
      return plan
    }
  }

  for (let i = 0; i < count; i++) {
    const ev = pickEvent(data, run, rand)
    if (ev) plan.push({ event: ev })
  }
  return plan
}

/** 从事件池中按条件与权重选出事件 */
export function pickEvent(data: CityFateData, run: RunState, rand: () => number = Math.random): GameEvent | undefined {
  const ctx = snapshotContext(data, run)
  const pool = getAllEvents().filter((e) => {
    // 排除内心之声与死亡链（由引擎单独调度）
    if (e.type === 'voice' || e.deathChainEntry) return false
    // 年龄范围
    if (e.ageRange && (data.age < e.ageRange[0] || data.age > e.ageRange[1])) return false
    // 条件求值
    if (!evalConditions(e.conditions, ctx)) return false
    // 冷却：上次触发未超过冷却年份则跳过
    if (run.cooldownUntil[e.id] !== undefined && data.age < run.cooldownUntil[e.id]) return false
    // 状态过滤：扭曲形态不再触发普通巢内事件
    if (run.distortionFormId && (e.type === 'nest' || e.type === 'finger')) return false
    return true
  })
  if (pool.length === 0) return undefined
  const idx = weightedRandom(pool, (e) => e.weight ?? 1, rand)
  return idx >= 0 ? pool[idx] : undefined
}

/** 事件结算后的冷却记录 */
export function markCooldown(run: RunState, event: GameEvent, currentAge: number): void {
  run.lastEventIds.push(event.id)
  if (run.lastEventIds.length > 12) run.lastEventIds.shift()
  if (event.cooldown && event.cooldown > 0 && event.repeatable) {
    const until = currentAge + event.cooldown
    run.cooldownUntil[event.id] = Math.max(run.cooldownUntil[event.id] ?? 0, until)
  }
}
