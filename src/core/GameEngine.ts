import type {
  Achievement,
  CityFateData,
  EventBranch,
  Gender,
  GlobalMeta,
  GameEvent,
  RunState,
  SinFate,
  Stats,
} from '@/types'
import {
  ageHealthDecay,
  initHealth,
  initPressure,
} from '@/engine/GameConfig'
import { evalConditions } from '@/engine/ConditionEvaluator'
import { uid, truncate } from '@/lib/utils'
import { DeathResult, checkDeath, deathFromChain } from './DeathSystem'
import { applyEffects, snapshotContext } from './PropertySystem'
import { EventSelection, markCooldown, planYear } from './EventSystem'
import { EgoAwakenResult, awakenEgo, canAwakenEgo } from './EgoSystem'
import { DistortionApplyResult, applyDistortion, applyDistortionSideEffects, resolveSin } from './DistortionSystem'
import { checkAchievements } from './AchievementSystem'
import { finalizeDeath } from './RebirthSystem'
import { findOrigin, nextFixerTier } from './data'

export interface RunBundle {
  data: CityFateData
  run: RunState
}

export interface BranchResolution {
  log: string
  death?: DeathResult
  egoAwaken?: EgoAwakenResult
  distortionForm?: DistortionApplyResult
  sinFate?: SinFate
  nextEventId?: number
  newlyAchieved: Achievement[]
  bankrupt: boolean
}

/** 创建新人生 */
export function createRun(
  originId: string,
  stats: Stats,
  name: string,
  gender: Gender,
  meta: GlobalMeta,
): RunBundle {
  const origin = findOrigin(originId)
  const mergedStats: Stats = {
    physique: Math.max(0, Math.min(10, stats.physique + (origin?.stats.physique ?? 0))),
    intelligence: Math.max(0, Math.min(10, stats.intelligence + (origin?.stats.intelligence ?? 0))),
    instinct: Math.max(0, Math.min(10, stats.instinct + (origin?.stats.instinct ?? 0))),
    will: Math.max(0, Math.min(10, stats.will + (origin?.stats.will ?? 0))),
    fortune: Math.max(0, Math.min(10, stats.fortune + (origin?.stats.fortune ?? 0))),
    synergy: Math.max(0, Math.min(10, stats.synergy + (origin?.stats.synergy ?? 0))),
  }
  const data: CityFateData = {
    id: uid('cf_'),
    name,
    gender,
    age: 0,
    isAlive: true,
    deathCause: '',
    stats: mergedStats,
    ego: { isAwakened: false, egoName: '', egoType: '武器', distortionProgress: 0 },
    identity: origin?.identity ?? '后巷耗子',
    affiliation: origin?.affiliation ?? '无',
    wealth: origin?.wealth ?? 100,
    traits: [...(origin?.traits ?? [])],
    lifeLog: [],
    keyMoments: [],
    unlockedAchievements: [],
    playCount: 1,
    totalLifespan: 0,
  }
  if (meta.egoMemory) {
    data.traits.push('light-receiver')
  }
  const run: RunState = {
    health: initHealth(mergedStats),
    pressure: initPressure(mergedStats),
    reputation: 0,
    pressureLocked: false,
    lastEventIds: [],
    cooldownUntil: {},
    egoMemoryApplied: !!meta.egoMemory,
    voiceCrisisDone: false,
    voiceWhisperDone: false,
  }
  return { data, run }
}

export interface YearPlanResult {
  events: EventSelection[]
  death?: DeathResult
  log: string
}

/** 推进一年：返回本年度事件计划；若年龄已达上限则直接死亡 */
export function rollYear(data: CityFateData, run: RunState, rand: () => number = Math.random): YearPlanResult {
  // 死亡检查（年龄上限 / 扭曲满值 / 健康归零）
  const death = checkDeath(data, run)
  if (death) {
    return { events: [], death, log: '' }
  }
  const events = planYear(data, run, rand)
  return { events, log: '' }
}

/** 结算一年（无更多事件时调用）：年龄 +1、老年衰减、扭曲副作用、死亡检查 */
export function endYear(data: CityFateData, run: RunState): { log: string; death?: DeathResult } {
  data.age += 1
  // 老年健康自然衰减
  const decay = ageHealthDecay(data.age)
  if (decay > 0) {
    run.health = Math.max(0, run.health - decay)
  }
  // 都市生活逐年累积精神压力（EGO 觉醒后免疫）
  if (data.age >= 18 && !run.pressureLocked) {
    const creep = data.age >= 60 ? 2 : 1
    run.pressure = Math.min(100, run.pressure + creep)
  }
  // 高压之下，扭曲倾向蔓延（内心之声的预兆）
  if (run.pressure >= 60 && data.ego.distortionProgress > 0 && !data.ego.isAwakened) {
    data.ego.distortionProgress = Math.min(100, data.ego.distortionProgress + 1)
  }
  // 扭曲形态副作用
  if (run.distortionFormId) {
    applyDistortionSideEffects(data, run)
    data.ego.distortionProgress = Math.min(100, data.ego.distortionProgress + 1)
  }
  const log = `第${data.age}年：时光流逝。`
  const death = checkDeath(data, run)
  return death ? { log, death } : { log }
}

/** 结算事件分支：应用效果、特质、身份、关键节点、结局分叉 */
export function resolveBranch(
  data: CityFateData,
  run: RunState,
  meta: GlobalMeta,
  event: GameEvent,
  branch: EventBranch,
  rand: () => number = Math.random,
): BranchResolution {
  // 分支前置条件（分支不可选时 UI 已禁用，这里兜底）
  const newlyAchieved: Achievement[] = []
  let bankrupt = false

  const applyAll = (effects: Record<string, number> | undefined) => {
    const r = applyEffects(data, run, effects)
    bankrupt = bankrupt || r.bankrupt
  }

  applyAll(event.effects)
  applyAll(branch.effects)
  // 事件基础精神压力
  if (event.pressureGain && !run.pressureLocked) {
    run.pressure = Math.max(0, Math.min(100, run.pressure + event.pressureGain))
  }

  // 特质变更
  if (branch.grantTrait && !data.traits.includes(branch.grantTrait)) data.traits.push(branch.grantTrait)
  if (branch.loseTrait) data.traits = data.traits.filter((t) => t !== branch.loseTrait)

  // 身份/所属变更
  if (branch.setIdentity) {
    data.identity = branch.setIdentity === 'fixer-next' ? nextFixerTier(data.identity) ?? data.identity : branch.setIdentity
  }
  if (branch.setAffiliation) data.affiliation = branch.setAffiliation

  // 关键节点
  if (branch.keyMoment && !data.keyMoments.includes(branch.keyMoment)) data.keyMoments.push(branch.keyMoment)
  for (const tag of event.tags ?? []) {
    if (tag.startsWith('key:')) {
      const km = tag.slice(4)
      if (!data.keyMoments.includes(km)) data.keyMoments.push(km)
    }
  }

  // 日志
  const logText = `${data.age}岁｜${event.title}：${branch.text}`
  data.lifeLog = truncate([...data.lifeLog, logText], 500)

  markCooldown(run, event, data.age)

  // 财富清零标记
  if (bankrupt && !data.keyMoments.includes('bankrupt')) data.keyMoments.push('bankrupt')

  let death: DeathResult | undefined
  let egoAwaken: EgoAwakenResult | undefined
  let distortionForm: DistortionApplyResult | undefined
  let sinFate: SinFate | undefined
  let nextEventId: number | undefined

  // 结局分叉（内心之声）
  if (branch.outcome === 'ego') {
    if (canAwakenEgo(data)) {
      egoAwaken = awakenEgo(data, run, rand)
    } else {
      distortionForm = applyDistortion(data, run, rand)
    }
  } else if (branch.outcome === 'distortion') {
    distortionForm = applyDistortion(data, run, rand)
  } else if (branch.outcome === 'sin') {
    sinFate = resolveSin(data, run)
    data.deathCause = `大罪化（${sinFate.type}）`
    data.isAlive = false
    death = {
      deathId: 'sin',
      name: sinFate.name,
      cause: `大罪化`,
      epitaph: sinFate.endingText,
    }
  }

  // 死亡链
  if (!death && branch.deathChainId) {
    death = deathFromChain(branch.deathChainId)
    data.deathCause = death.cause
    data.isAlive = false
  }

  // 链式事件
  if (!death && branch.nextEventId) {
    nextEventId = branch.nextEventId
  }

  // 常规死亡检查
  if (!death) {
    const d = checkDeath(data, run)
    if (d) {
      death = d
      data.deathCause = death.cause
      data.isAlive = false
    }
  }

  // 死亡后立即结算成就与全局数据
  if (death) {
    data.deathCause = data.deathCause || death.cause
    data.isAlive = false
    finalizeDeath(data, meta, run)
    newlyAchieved.push(...checkAchievements(data, meta, run))
  }

  return { log: logText, death, egoAwaken, distortionForm, sinFate, nextEventId, newlyAchieved, bankrupt }
}

/** 应用 EGO 觉醒确认（UI 演出后调用） */
export function confirmEgo(data: CityFateData, run: RunState): void {
  // awakenEgo 已在 resolveBranch 中调用；此处仅保证状态一致
  void data
  void run
}

/** 直接死亡（兜底，如玩家选择自杀类分支） */
export function forceDeath(data: CityFateData, run: RunState, meta: GlobalMeta, deathId: string): DeathResult {
  const d = deathFromChain(deathId)
  data.deathCause = d.cause
  data.isAlive = false
  finalizeDeath(data, meta, run)
  return d
}

/** 事件是否可触发（分支条件） */
export function branchAvailable(data: CityFateData, run: RunState, branch: EventBranch): boolean {
  return evalConditions(branch.conditions, snapshotContext(data, run))
}
