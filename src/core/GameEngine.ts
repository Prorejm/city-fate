import type {
  CityFateData,
  Gender,
  GlobalMeta,
  RunState,
  Stats,
} from '@/types'
import { ageHealthDecay, initHealth, initPressure } from '@/engine/GameConfig'
import { uid, truncate } from '@/lib/utils'
import { DeathResult, checkDeath, deathFromChain } from './DeathSystem'
import { snapshotContext } from './PropertySystem'
import { applyTraverseTalents, systemHolderCheck } from './TalentSystem'
import { applyDistortionSideEffects } from './DistortionSystem'
import { checkAchievements } from './AchievementSystem'
import { finalizeDeath } from './RebirthSystem'
import { initNpcStates, meetNpcsAtLocation } from './NpcSystem'
import { currentStage, refreshUnlockedLocations } from './LocationSystem'
import { checkStorylines, applyStorylineEffects } from './StorylineSystem'
import { generateCommissionPool } from './CommissionSystem'

export interface RunBundle {
  data: CityFateData
  run: RunState
}

/** 基础属性（合计 25 点，玩家分配后传入） */
export const BASE_ALLOC: Stats = {
  physique: 5,
  intelligence: 5,
  instinct: 5,
  will: 5,
  fortune: 3,
  synergy: 2,
}

/** 创建穿越者：分配属性 + 穿越天赋 + 身份天赋 */
export function createTraverseRun(
  stats: Stats,
  name: string,
  gender: Gender,
  meta: GlobalMeta,
  traverseId: string | null,
  identityId: string | null,
): RunBundle {
  const data: CityFateData = {
    id: uid('cf_'),
    name,
    gender,
    age: 20,
    isAlive: true,
    deathCause: '',
    stats: { ...stats },
    ego: { isAwakened: false, egoName: '', egoType: '武器', distortionProgress: 0 },
    identity: '穿越者',
    affiliation: '无',
    wealth: 0,
    traits: [],
    lifeLog: [],
    keyMoments: [],
    unlockedAchievements: [],
    playCount: 1,
    totalLifespan: 0,
  }
  const run: RunState = {
    health: initHealth(stats),
    pressure: initPressure(stats),
    reputation: 0,
    pressureLocked: false,
    lastEventIds: [],
    cooldownUntil: {},
    egoMemoryApplied: !!meta.egoMemory,
    voiceCrisisDone: false,
    voiceWhisperDone: false,
    stamina: 10,
    locationId: 'backalley-7',
    stage: 'SURVIVAL',
    actionPoints: 3,
    npcStates: initNpcStates(runPlaceholder()),
    storylineProgress: {},
    roundCount: 0,
    daysInCity: 0,
    unlockedActions: ['odd-job', 'scavenge', 'beg', 'ask-rumors', 'rest-street', 'rest-shelter', 'listen-bridge', 'market-buy'],
    unlockedLocations: ['backalley-7', 'bridge-cave'],
    shelterLevel: 0,
    foodLevel: 0,
    karma: 0,
    fixerGrade: 0,
    assocRep: {},
    assocTotal: 0,
    commissionPool: [],
    commissionsDone: 0,
    professionLevels: {},
    professionXp: {},
    subclassChoice: {},
  }
  // 初始化 NPC 状态（依赖 run 完成后再处理）
  run.npcStates = initNpcStates(run)
  // 应用天赋
  applyTraverseTalents(data, run, traverseId, identityId)
  // 身份天赋解锁初始行动/地点
  if (meta.egoMemory) data.traits.push('light-receiver')
  // 初始地点结识 NPC
  meetNpcsAtLocation(run, run.locationId)
  refreshUnlockedLocations(data, run)
  return { data, run }
}

// 占位函数（initNpcStates 不需要 run 内容）
function runPlaceholder(): RunState {
  return { locationId: 'backalley-7' } as RunState
}

/** 兼容旧 API：无天赋的默认穿越者 */
export function createRun(
  originId: string,
  stats: Stats,
  name: string,
  gender: Gender,
  meta: GlobalMeta,
): RunBundle {
  void originId
  return createTraverseRun(stats, name, gender, meta, null, null)
}

export interface RoundResult {
  log: string
  death?: DeathResult
  storylines: string[]
  newNpcs: string[]
}

/** 开始新回合：重置行动点、消耗食物、饥饿判定、阶段刷新 */
export function beginRound(data: CityFateData, run: RunState, meta: GlobalMeta): RoundResult {
  const stage = currentStage(data, run)
  run.stage = stage
  run.actionPoints = stage === 'SURVIVAL' ? 3 : 4
  run.roundCount += 1
  run.daysInCity += 1

  const logParts: string[] = []
  const storylines: string[] = []

  // 食物消耗：每回合需要进食（0 = 饥饿）
  if (run.foodLevel <= 0) {
    run.health = Math.max(0, run.health - 3)
    run.pressure = Math.min(100, run.pressure + 5)
    logParts.push('你饥肠辘辘，饿得眼冒金星。')
  } else {
    run.foodLevel -= 1
  }

  // 住处条件：无住处（shelterLevel 0）时体力恢复减半
  if (run.shelterLevel <= 0) {
    run.stamina = Math.min(20, run.stamina + 2)
    logParts.push('你在桥洞勉强睡了一觉，浑身酸痛。')
  } else {
    run.stamina = Math.min(20, run.stamina + 4)
  }

  // 都市生活压力积累（EGO 觉醒后免疫）
  if (run.roundCount >= 7 && !run.pressureLocked) {
    run.pressure = Math.min(100, run.pressure + 1)
  }

  // 系统持有者签到
  if (systemHolderCheck(data, run.roundCount)) {
    logParts.push('【系统】签到奖励：一项属性 +1。')
  }

  // 剧情线检查（按回合触发的）
  const progressed = checkStorylines(data, run)
  for (const p of progressed) {
    storylines.push(p.stageId)
    applyStorylineEffects(data, run, p.effects)
  }

  // 每日刷新委托池（入行后生效）
  if (run.fixerGrade > 0) {
    run.commissionPool = generateCommissionPool(run, 4)
  }

  // 老年衰减（穿越者 20 岁起，60 岁后生效，150 岁封顶）
  if (data.age >= 60) {
    const decay = ageHealthDecay(data.age)
    if (decay > 0) run.health = Math.max(0, run.health - decay)
  }
  if (run.distortionFormId) {
    applyDistortionSideEffects(data, run)
    data.ego.distortionProgress = Math.min(100, data.ego.distortionProgress + 1)
  }

  const death: DeathResult | undefined = checkDeath(data, run) ?? undefined
  if (death) {
    data.deathCause = data.deathCause || death.cause
    data.isAlive = false
    finalizeDeath(data, meta, run)
    const gained = checkAchievements(data, meta, run)
    for (const g of gained) {
      logParts.push(`成就解锁：${g.name}`)
    }
  }

  const log = logParts.length > 0 ? logParts.join(' ') : `第 ${run.daysInCity} 天，新的一天开始了。`
  return { log, death, storylines, newNpcs: [] }
}

export { checkDeath, deathFromChain }

/** 供 store 使用的死亡兜底 */
export function forceDeath(data: CityFateData, run: RunState, meta: GlobalMeta, deathId: string): DeathResult {
  const d = deathFromChain(deathId)
  data.deathCause = d.cause
  data.isAlive = false
  finalizeDeath(data, meta, run)
  return d
}

/** 行动后结算（供 ActionSystem 之外的状态刷新） */
export function afterAction(data: CityFateData, run: RunState): void {
  refreshUnlockedLocations(data, run)
  // 行动后剧情检查（由 store 用 lastActionId 调用）
}

export function branchContext(data: CityFateData, run: RunState) {
  return snapshotContext(data, run)
}

export { truncate }
