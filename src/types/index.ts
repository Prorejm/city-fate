// ============ 都市·命途 全量类型定义 ============

export type CoreAttr = 'physique' | 'intelligence' | 'instinct' | 'will' | 'fortune' | 'synergy'

export type EffectKey = CoreAttr | 'health' | 'pressure' | 'wealth' | 'distortion' | 'reputation'

/** 数值型效果（事件分支/EGO/扭曲的加减） */
export type AttributeEffects = Partial<Record<EffectKey, number>>

export type ConditionOperator = '>=' | '<=' | '>' | '<' | '=='

export interface Condition {
  attribute: EffectKey
  operator: ConditionOperator
  value: number
}

export interface CompoundCondition {
  op: 'AND' | 'OR'
  conditions: (Condition | CompoundCondition)[]
}

export type ConditionSpec = Condition | CompoundCondition

export type Gender = '男' | '女' | '未知'

export interface Stats {
  physique: number
  intelligence: number
  instinct: number
  will: number
  fortune: number
  synergy: number
}

export type EgoType = '庇护' | '武器' | '装备'

export interface EgoState {
  isAwakened: boolean
  egoName: string
  egoType: EgoType
  distortionProgress: number // 0-100
}

/** 严格遵循用户给出的 LocalStorage 数据模型（键名 cityFateData） */
export interface CityFateData {
  id: string
  name: string
  gender: Gender
  age: number
  isAlive: boolean
  deathCause: string
  stats: Stats
  ego: EgoState
  identity: string
  affiliation: string
  wealth: number
  traits: string[]
  lifeLog: string[]
  keyMoments: string[]
  unlockedAchievements: string[]
  playCount: number
  totalLifespan: number
}

/** 跨周目全局数据（持久化于 cityFateData 的子集） */
export interface GlobalMeta {
  unlockedAchievements: string[]
  playCount: number
  totalLifespan: number
  rebirthPoints: number
  totalEarned: number
  egoMemory?: string
  lastDeath?: {
    name: string
    age: number
    deathCause: string
    identity: string
  }
}

export type EventType =
  | 'child'
  | 'teen'
  | 'adult'
  | 'mid'
  | 'elder'
  | 'ancients'
  | 'backalley'
  | 'nest'
  | 'fixer'
  | 'finger'
  | 'assoc'
  | 'abno'
  | 'special'
  | 'voice'
  | 'death'

export type BranchOutcome = 'ego' | 'distortion' | 'sin'

export interface EventBranch {
  id: string
  text: string
  effects?: AttributeEffects
  conditions?: ConditionSpec
  nextEventId?: number
  deathChainId?: string
  setIdentity?: string
  setAffiliation?: string
  grantTrait?: string
  loseTrait?: string
  outcome?: BranchOutcome
  keyMoment?: string
}

export interface GameEvent {
  id: number
  title: string
  description: string
  type: EventType
  ageRange?: [number, number]
  conditions?: ConditionSpec
  weight?: number
  repeatable?: boolean
  cooldown?: number
  branches?: EventBranch[]
  effects?: AttributeEffects
  tags?: string[]
  portrait?: string
  voiceTrigger?: boolean
  pressureGain?: number
  deathChainEntry?: boolean
}

export type MindStatus = 'NORMAL' | 'AWAKE' | 'DISTORTED' | 'SINNED'

export interface Origin {
  id: string
  name: string
  district: string
  description: string
  stats: Partial<Stats>
  wealth: number
  identity: string
  affiliation: string
  traits: string[]
}

export interface Talent {
  id: string
  name: string
  description: string
  category: string
  effects?: AttributeEffects
  passive?: string
}

export interface EgoTemplate {
  id: string
  name: string
  type: EgoType
  sinTheme: string
  description: string
  effects: AttributeEffects
  passive: string
  unlockReq: { willMin: number; synergyMin: number; instinctMin: number }
}

export interface DistortionForm {
  id: string
  name: string
  appearance: string
  effects: AttributeEffects
  sideEffects: AttributeEffects
  deathRisk: number
}

export interface SinFate {
  type: '傲慢' | '嫉妒' | '暴怒' | '倦怠' | '暴食' | '忧郁' | '色欲'
  name: string
  trigger: ConditionSpec
  endingText: string
  color: string
}

export interface Achievement {
  id: string
  name: string
  category: string
  tier: string
  description: string
  condition: {
    type: 'age' | 'stat' | 'identity' | 'ego' | 'distortion' | 'sin' | 'wealth' | 'playCount' | 'totalLifespan' | 'trait' | 'keyMoment' | 'deathCause'
    target?: number
    attr?: CoreAttr
    value?: string | number
  }
  reward?: { rebirthBonus?: number }
}

export interface DeathType {
  id: string
  name: string
  cause: string
  epitaph: string
  tags?: string[]
}

export interface Identity {
  id: string
  name: string
  category: string
  tier: number
  reputation: number
  description: string
}

/** 运行期状态（不入存档） */
export interface RunState {
  health: number
  pressure: number
  reputation: number
  pressureLocked: boolean
  distortionFormId?: string
  sinType?: string
  lastEventIds: number[]
  cooldownUntil: Record<number, number>
  egoMemoryApplied: boolean
  voiceCrisisDone: boolean
  voiceWhisperDone: boolean
}
