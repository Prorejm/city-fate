import type { AttributeEffects, CityFateData, GameAction, RunState } from '@/types'
import { chance, weightedRandom } from '@/engine/Random'
import { applyEffects } from './PropertySystem'
import { grantXp } from './ProfessionSystem'
import { equipmentChanceMod, equipmentStatBonus, wearEquipment, repairEquipment } from './ItemSystem'
import { findAction, findNpc, findItem } from './data'
import { modernKnowledgeBonus } from './TalentSystem'

export interface ActionOutcome {
  text: string
  success: boolean
  gold: number
  eventId?: number
  npcId?: string
  npcDelta?: number
  effects: AttributeEffects
  unlockedAction?: string
  unlockLocation?: string
  storylineProgress?: number
  singularityExchange?: boolean
  craftWeapon?: boolean
}

/** 行动成功率：基础 + 属性偏向 + 现代人学识 + 装备加成 */
export function actionChance(data: CityFateData, action: GameAction): number {
  let p = action.baseChance
  if (action.statBias) {
    const { attr, weight } = action.statBias
    p += (data.stats[attr] + equipmentStatBonus(data, attr) - 5) * 0.04 * weight
  }
  if (action.statBias?.attr === 'intelligence') {
    p += modernKnowledgeBonus(data)
  }
  p += equipmentChanceMod(data)
  return Math.max(0.05, Math.min(0.95, p))
}

/** 执行行动：判定成败、应用效果、返回结果 */
export function executeAction(
  data: CityFateData,
  run: RunState,
  actionId: string,
  rand: () => number = Math.random,
): ActionOutcome | null {
  const action = findAction(actionId)
  if (!action) return null
  // 资源扣除
  run.actionPoints -= action.apCost
  run.stamina = Math.max(0, run.stamina - action.staminaCost)

  const ok = chance(actionChance(data, action), rand)
  const outcome = ok ? action.success : action.fail

  // 应用效果（注意：effects 里的 stamina 由行动自身扣除，这里只应用正向效果）
  const effects = { ...(outcome.effects ?? {}) }
  let gold = outcome.gold ?? 0
  // 系统持有者加成
  if (data.traits.includes('system-holder') && gold > 0) {
    gold += Math.floor(gold * 0.2)
  }
  const r = applyEffects(data, run, effects)
  void r

  // NPC 好感变化
  let npcDelta = outcome.npcDelta ?? 0
  const npcId = outcome.npcId
  if (npcId && npcDelta !== 0) {
    const st = run.npcStates.find((s) => s.id === npcId)
    if (st) {
      st.affinity = Math.max(-100, Math.min(100, st.affinity + npcDelta))
    }
  } else if (npcId) {
    // 无好感变化的行为也标记结识
    const st = run.npcStates.find((s) => s.id === npcId)
    if (st && !st.met) {
      st.met = true
      st.metLocation = run.locationId
    }
  }

  // 解锁行动
  const unlockedAction = outcome.unlockAction
  if (unlockedAction && !run.unlockedActions.includes(unlockedAction)) {
    run.unlockedActions.push(unlockedAction)
  }

  // 授予特质
  const grantTrait = outcome.grantTrait
  if (grantTrait && !data.traits.includes(grantTrait)) {
    data.traits.push(grantTrait)
  }

  // 职业经验（行动成功时）
  if (ok && action.xp) {
    grantXp(run, action.xp.profession, action.xp.amount)
  }

  // 物品掉落（成功时按权重掉落）
  if (ok && outcome.itemDrops && outcome.itemDrops.length > 0) {
    const pool = outcome.itemDrops.filter((id) => !!findItem(id))
    if (pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * pool.length)]
      data.inventory = [...data.inventory, { id: pick, durability: findItem(pick)?.durability ?? 0 }]
    }
  }

  // 维修装备
  if (ok && outcome.repair) {
    const n = repairEquipment(data)
    if (n > 0) {
      data.lifeLog = [...data.lifeLog.slice(-300), `你修复了 ${n} 件装备。`]
    }
  }

  // 战斗/危险行动消耗装备耐久
  const DURABILITY_ACTIONS = new Set([
    'hunt-blood', 'track-blood', 'guild-bounty', 'taboo-hunt', 'taboo-trace',
    'investigate-distortion', 'abno-explore', 'collect-relic', 'scavenge-ruins',
    'suburb-expedition', 'lake-whaling',
  ])
  if (DURABILITY_ACTIONS.has(actionId)) {
    const broken = wearEquipment(data, ok ? 2 : 1)
    for (const name of broken) {
      data.lifeLog = [...data.lifeLog.slice(-300), `你的 ${name} 在战斗中损坏了。`]
    }
  }

  // 奇点亲和：翼/工坊系行动累积奇点点数（成功时）
  if (ok) {
    const SINGULARITY_ACTIONS = new Set([
      'wing-project', 'wing-exam', 'wing-meeting', 'singularity-exchange',
      'master-forge', 'signature-weapon', 'commission-weapon',
    ])
    if (SINGULARITY_ACTIONS.has(actionId)) {
      run.singularityPoints += actionId === 'wing-project' || actionId === 'signature-weapon' ? 8 : 5
    }
    // 工坊锻造信任累积
    if (['apprentice-forge', 'commission-weapon', 'master-forge', 'signature-weapon'].includes(actionId)) {
      run.workshopTrust += actionId === 'signature-weapon' ? 8 : actionId === 'master-forge' ? 5 : 2
    }
  }

  // 奇点亲和天赋：翼/工坊系行动金币收益 +15%
  if (data.traits.includes('singularity-affinity')) {
    const SINGULARITY_GOLD_ACTIONS = new Set(['wing-project', 'wing-meeting', 'master-forge', 'signature-weapon'])
    if (SINGULARITY_GOLD_ACTIONS.has(actionId) && gold > 0) {
      gold += Math.floor(gold * 0.15)
    }
  }

  // 定制武器：产出随机品质武器（智力与工坊信任提升高品质概率）
  if (ok && outcome.craftWeapon) {
    const base = 0.4 + data.stats.intelligence * 0.03 + Math.min(0.25, run.workshopTrust * 0.02)
    const r = Math.random()
    let crafted: string
    if (r < base) crafted = 'w-fixer-sword'
    else if (r < base + 0.25) crafted = 'w-plasma-blade'
    else if (r < base + 0.4) crafted = 'w-zwei-greatsword'
    else crafted = 'w-moonlight-saber'
    data.inventory = [...data.inventory, { id: crafted, durability: findItem(crafted)?.durability ?? 0 }]
    data.lifeLog = [...data.lifeLog.slice(-300), `你定制了一把 ${findItem(crafted)?.name}。`]
  }

  // 文案选择
  const texts = Array.isArray(outcome.text) ? outcome.text : [outcome.text]
  const text = texts[Math.floor(rand() * texts.length)]

  return {
    text,
    success: ok,
    gold,
    eventId: outcome.eventId,
    npcId,
    npcDelta,
    effects,
    unlockedAction,
    singularityExchange: outcome.singularityExchange,
  }
}

/** 行动触发随机遭遇：返回真实 NPC id 或 undefined */
export function rollEncounter(
  run: RunState,
  action: GameAction,
  rand: () => number = Math.random,
): string | undefined {
  const chanceVal = action.encounterChance ?? 0
  if (!chanceVal || !chance(chanceVal, rand)) return undefined
  // 从行动所在地的 NPC 与事件中选取
  const npcsHere = run.npcStates.filter((s) => {
    const npc = findNpc(s.id)
    return npc && npc.locationId === run.locationId && s.met
  })
  if (npcsHere.length > 0 && chance(0.5, rand)) {
    const picked = npcsHere[Math.floor(rand() * npcsHere.length)]
    return picked.id // 返回真实 NPC id，由 UI 渲染其立绘与背景
  }
  return undefined
}

export { weightedRandom }
