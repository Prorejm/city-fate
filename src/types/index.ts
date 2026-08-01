// ============ 都市·命途 全量类型定义 ============

export type CoreAttr = 'physique' | 'intelligence' | 'instinct' | 'will' | 'fortune' | 'synergy'

export type EffectKey = CoreAttr | 'health' | 'pressure' | 'wealth' | 'distortion' | 'reputation' | 'foodLevel' | 'karma'

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
  // 物品系统
  inventory: InventoryEntry[]
  equipped: EquippedSlots
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

// ============ 穿越者生存模拟 新增类型 ============

/** 委托难度（对应都市灾害等级，由 Hana 协会评定） */
export type CommissionTier = '传闻' | '都市传说' | '都市恶疾' | '都市梦魇' | '都市之星'

/** 十二协会定义 */
export interface AssociationDef {
  id: string
  number: number
  name: string
  etymology: string
  role: string
  color: string
  tiers: CommissionTier[]
}

/** 委托模板（按协会 + 难度分类） */
export interface CommissionDef {
  id: string
  associationId: string
  tier: CommissionTier
  name: string
  description: string
  statBias?: { attr: CoreAttr; weight: number }
  baseChance: number
  success: {
    text: string | string[]
    gold: number
    effects?: AttributeEffects
    assocDelta?: number
  }
  fail: {
    text: string | string[]
    gold: number
    effects?: AttributeEffects
    assocDelta?: number
  }
}

/** 委托执行结果 */
export interface CommissionResult {
  commission: CommissionDef
  success: boolean
  text: string
  gold: number
  effects: AttributeEffects
  promoted?: string // 晋升后的身份 id
  assocDelta: number
}

// ============ DND 式职业系统 ============

/** 职业子职 */
export interface ProfessionSubclass {
  id: string
  name: string
  description: string
}

/** 职业等级特性 */
export interface ProfessionLevel {
  level: number
  unlockActions: string[]
  passive: string
  chooseSubclass?: boolean
}

/** 职业定义 */
export interface ProfessionDef {
  id: string
  name: string
  description: string
  maxLevel: number
  xpSources: string[]
  subclassAt?: number
  subclasses?: ProfessionSubclass[]
  levels: ProfessionLevel[]
}

/** 行动经验来源标记 */
export interface XpSource {
  profession: string
  amount: number
}

// ============ 物品系统 ============

export type ItemQuality = 'white' | 'green' | 'blue' | 'purple' | 'gold'
export type ItemCategory = 'weapon' | 'armor' | 'consumable' | 'relic'
export type EquipmentSlot = 'main-hand' | 'off-hand' | 'armor' | 'accessory'

/** 物品定义 */
export interface ItemDef {
  id: string
  name: string
  category: ItemCategory
  slot: EquipmentSlot | ''
  quality: ItemQuality
  description: string
  durability: number
  effects?: AttributeEffects
  chanceMod?: number
  passive?: string
  value: number
  consumable?: {
    heal?: number
    food?: number
    pressure?: number
    travel?: boolean
    revive?: boolean
  }
}

/** 背包中的一件物品 */
export interface InventoryEntry {
  id: string
  durability: number
}

/** 装备槽（记录物品与剩余耐久） */
export interface EquippedSlots {
  'main-hand'?: { id: string; durability: number }
  'off-hand'?: { id: string; durability: number }
  armor?: { id: string; durability: number }
  accessory?: { id: string; durability: number }
}

/** 物品品质色 */
export const QUALITY_COLORS: Record<ItemQuality, string> = {
  white: '#c3c7cf',
  green: '#5ac08a',
  blue: '#5a9ac0',
  purple: '#b07ac0',
  gold: '#e0c060',
}

/** 天赋分类：穿越天赋 / 开局身份天赋 */
export type TalentKind = 'traverse' | 'identity' | 'regular'

export interface TraverseTalent {
  id: string
  name: string
  kind: TalentKind
  description: string
  effects?: AttributeEffects
  passive?: string
  /** 身份天赋：初始身份/地点/资源/NPC 关系 */
  identity?: {
    initialIdentity: string
    initialLocation: string
    initialWealth: number
    initialAffiliation: string
    traits: string[]
    npcAffinities: Record<string, number>
    unlockActions: string[]
  }
}

export type Stage = 'SURVIVAL' | 'SETTLED' | 'ADVENTURE'

export interface LocationDef {
  id: string
  name: string
  description: string
  stage: Stage
  /** 解锁条件 */
  unlock: {
    reputation?: number
    stat?: { attr: CoreAttr; value: number }
    actionId?: string
    trait?: string
  }
  /** 进入消耗体力 */
  staminaCost: number
  actions: string[]
}

export type ActionResultType = 'success' | 'fail' | 'event' | 'npc'

export interface ActionResult {
  text: string
  effects?: AttributeEffects
  gold?: number
  eventId?: number
  npcId?: string
  npcDelta?: number
  stage?: Stage
  unlockAction?: string
  grantTrait?: string
  itemDrops?: string[]
  repair?: boolean
  storyline?: string
  storylineProgress?: number
}

export interface GameAction {
  id: string
  name: string
  description: string
  locationId: string
  stage: Stage
  /** 消耗行动点与体力 */
  apCost: number
  staminaCost: number
  /** 前置条件 */
  conditions?: ConditionSpec
  /** 成功率（0-1），受属性修正 */
  baseChance: number
  statBias?: { attr: CoreAttr; weight: number }
  /** 结果 */
  success: Omit<ActionResult, 'text'> & { text: string | string[] }
  fail: Omit<ActionResult, 'text'> & { text: string | string[] }
  /** 触发随机遭遇权重 */
  encounterChance?: number
  /** 职业经验来源 */
  xp?: XpSource
}

export type NpcRelation = '路人' | '熟人' | '盟友' | '恋人' | '仇敌'

export interface NpcDef {
  id: string
  name: string
  title: string
  description: string
  avatar: string
  locationId: string
  /** 所在位置名称（用于弹窗展示） */
  locationName?: string
  /** 背景故事（弹窗详细文案） */
  background?: string
  /** 互动花絮 */
  flavor?: string
  /** 初始好感 */
  affinity: number
  /** 专属事件（好感达到触发） */
  events: { affinity: number; eventId: number }[]
  storylineId?: string
}

export interface NpcState {
  id: string
  affinity: number
  relation: NpcRelation
  met: boolean
  metLocation: string
}

export interface StorylineDef {
  id: string
  name: string
  description: string
  stages: {
    id: string
    title: string
    text: string
    trigger: {
      type: 'action' | 'round' | 'npcAffinity' | 'storyline' | 'stat' | 'location'
      actionId?: string
      round?: number
      npcId?: string
      affinity?: number
      storylineId?: string
      stat?: { attr: CoreAttr; value: number }
      locationId?: string
    }
    next?: string
    effects?: AttributeEffects
    reward?: { gold?: number; trait?: string; actionId?: string }
  }[]
}

export type RelationShip = 'none' | 'ally' | 'rival' | 'lover' | 'mentor'

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
  // ---- 生存模拟扩展 ----
  stamina: number
  locationId: string
  stage: Stage
  actionPoints: number
  npcStates: NpcState[]
  storylineProgress: Record<string, string> // storylineId -> stageId
  roundCount: number
  daysInCity: number
  unlockedActions: string[]
  unlockedLocations: string[]
  shelterLevel: number // 0=桥洞 1=廉价房 2=公寓 3=巢内
  foodLevel: number // 当日进食状态
  karma: number
  // ---- 委托系统扩展 ----
  fixerGrade: number // 0=未入行 1~9=九阶~一阶 10=色彩级
  assocRep: Record<string, number> // associationId -> 声望(0~100)
  assocTotal: number // 累计协会声望（晋升判定）
  commissionPool: CommissionDef[] // 当日委托池
  commissionsDone: number // 累计完成委托数
  // ---- 职业系统扩展 ----
  professionLevels: Record<string, number> // professionId -> 等级
  professionXp: Record<string, number> // professionId -> 当前经验
  subclassChoice: Record<string, string> // professionId -> 子职 id
  // ---- 扩展机制 ----
  deepNightWindow: boolean // 当日是否处于深宵窗口（3:13-4:34）
  eyeWatchLevel: number // 首脑之眼监视程度（0-100）
}
