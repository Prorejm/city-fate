import type { AttributeEffects, CityFateData, CommissionDef, CommissionResult, CommissionTier, RunState } from '@/types'
import { chance, pickN } from '@/engine/Random'
import { applyEffects } from './PropertySystem'
import { grantXp, xpForCommissionTier } from './ProfessionSystem'
import { equipmentChanceMod, equipmentStatBonus } from './ItemSystem'
import { ASSOCIATIONS, COMMISSIONS, findAssociation, findCommission, findIdentity, IDENTITIES } from './data'
import { modernKnowledgeBonus } from './TalentSystem'

/** 难度表：委托难度 -> 门槛与倍率 */
export const TIER_TABLE: Record<CommissionTier, { rankReq: number; repReq: number; goldMult: number; chanceMod: number }> = {
  传闻: { rankReq: 1, repReq: 8, goldMult: 1, chanceMod: 0.1 },
  都市传说: { rankReq: 3, repReq: 25, goldMult: 3, chanceMod: 0.05 },
  都市恶疾: { rankReq: 5, repReq: 55, goldMult: 8, chanceMod: 0 },
  都市梦魇: { rankReq: 7, repReq: 100, goldMult: 20, chanceMod: -0.05 },
  都市之星: { rankReq: 9, repReq: 170, goldMult: 50, chanceMod: -0.1 },
}

/** 收尾人阶位名（1=九阶 ... 10=色彩级） */
export const FIXER_GRADE_NAMES = ['', '九阶', '八阶', '七阶', '六阶', '五阶', '四阶', '三阶', '二阶', '一阶', '色彩级']

/** 帮派路线是否已加入（通过 data.traits 判断） */
export function isFingerMember(data: CityFateData): boolean {
  return data.traits.includes('finger-member') || data.affiliation === '中指' || data.affiliation === '无名指'
}

/** 自动授予收尾人资格：声望 >= 8 且未入行时授予九阶 */
export function ensureFixerGrade(data: CityFateData, run: RunState): boolean {
  if (run.fixerGrade === 0 && run.reputation >= 8 && !isFingerMember(data)) {
    run.fixerGrade = 1
    data.identity = '收尾人（九阶）'
    if (!data.traits.includes('fixer-license')) data.traits.push('fixer-license')
    return true
  }
  return false
}

/** 计算委托成功率（复用行动公式：基础 + 属性偏向 + 现代人学识 + 装备加成） */
export function commissionChance(data: CityFateData, commission: CommissionDef): number {
  let p = commission.baseChance
  if (commission.statBias) {
    const { attr, weight } = commission.statBias
    p += (data.stats[attr] + equipmentStatBonus(data, attr) - 5) * 0.04 * weight
  }
  if (commission.statBias?.attr === 'intelligence') {
    p += modernKnowledgeBonus(data)
  }
  const tier = TIER_TABLE[commission.tier]
  p += tier.chanceMod
  p += equipmentChanceMod(data)
  return Math.max(0.05, Math.min(0.95, p))
}

/** 生成当日委托池：按阶位/声望过滤 + 协会声望反加权 + 去重 */
export function generateCommissionPool(run: RunState, count = 4, rand: () => number = Math.random): CommissionDef[] {
  const grade = Math.max(1, run.fixerGrade)
  const eligible = COMMISSIONS.filter((c) => {
    const t = TIER_TABLE[c.tier]
    return grade >= t.rankReq && run.reputation >= t.repReq
  })
  if (eligible.length === 0) return []
  // 协会声望越低越常出单（反加权）
  const weighted = eligible.filter((c) => {
    const rep = run.assocRep[c.associationId] ?? 0
    const w = 100 - rep
    return w > 0 || eligible.length <= count
  })
  const picked = pickN(weighted.length > 0 ? weighted : eligible, count, rand)
  return picked
}

/** 执行委托：掷骰 -> 应用效果 -> 更新协会声望 -> 晋升检查 */
export function resolveCommission(
  data: CityFateData,
  run: RunState,
  commissionId: string,
  rand: () => number = Math.random,
): CommissionResult | null {
  const commission = findCommission(commissionId)
  if (!commission) return null
  const ok = chance(commissionChance(data, commission), rand)
  const outcome = ok ? commission.success : commission.fail

  // 应用效果（gold 单独处理，effects 只含属性/健康/压力等）
  const effects: AttributeEffects = { ...(outcome.effects ?? {}) }
  let gold = outcome.gold ?? 0
  if (data.traits.includes('system-holder') && gold > 0) gold += Math.floor(gold * 0.2)
  const r = applyEffects(data, run, effects)
  void r
  // 金钱
  data.wealth = Math.max(0, data.wealth + Math.round(gold))

  // 协会声望
  const assocDelta = outcome.assocDelta ?? 0
  const assocId = commission.associationId
  run.assocRep[assocId] = Math.max(0, Math.min(100, (run.assocRep[assocId] ?? 0) + assocDelta))
  if (assocDelta > 0) run.assocTotal += assocDelta

  // 完成计数与老手特质
  if (ok) {
    run.commissionsDone += 1
    if (run.commissionsDone >= 30 && !data.traits.includes('assoc-veteran')) {
      data.traits.push('assoc-veteran')
    }
    // 委托完成经验 → 收尾人职业
    grantXp(run, 'fixer', xpForCommissionTier(commission.tier))
  }

  // 关键时刻
  if (ok && commission.tier === '都市之星' && !data.keyMoments.includes('commission-urbanstar')) {
    data.keyMoments.push('commission-urbanstar')
  }
  if (ok && !data.keyMoments.includes('commission-first')) {
    data.keyMoments.push('commission-first')
  }

  // 文案选择
  const texts = Array.isArray(outcome.text) ? outcome.text : [outcome.text]
  const text = texts[Math.floor(rand() * texts.length)]

  // 晋升检查
  const promoted = promoteFixer(data, run)

  return { commission, success: ok, text, gold, effects, promoted, assocDelta }
}

/** 晋升检查：assocTotal 跨阈值时沿 FIXER_LADDER 晋升 */
export function promoteFixer(data: CityFateData, run: RunState): string | undefined {
  if (run.fixerGrade <= 0) return undefined
  const ladder = [
    { grade: 1, id: 'fixer-9', total: 8 },
    { grade: 2, id: 'fixer-8', total: 16 },
    { grade: 3, id: 'fixer-7', total: 25 },
    { grade: 4, id: 'fixer-6', total: 38 },
    { grade: 5, id: 'fixer-5', total: 55 },
    { grade: 6, id: 'fixer-4', total: 75 },
    { grade: 7, id: 'fixer-3', total: 100 },
    { grade: 8, id: 'fixer-2', total: 130 },
    { grade: 9, id: 'fixer-1', total: 170 },
    { grade: 10, id: 'fixer-color', total: 230 },
  ]
  let promoted: string | undefined
  for (const step of ladder) {
    if (run.assocTotal >= step.total && run.fixerGrade < step.grade) {
      run.fixerGrade = step.grade
      const ident = findIdentity(step.id)
      if (ident) data.identity = ident.name
      promoted = step.id
    }
  }
  // 未满足任何晋升，确保至少 identity 名称同步
  if (!promoted) {
    const current = findIdentityByIdentityName(data.identity)
    if (!current) {
      const ident = findIdentity('fixer-9')
      if (ident && run.fixerGrade >= 1) data.identity = ident.name
    }
  }
  return promoted
}

function findIdentityByIdentityName(name: string) {
  return IDENTITIES.find((i) => i.name === name)
}

/** 当前阶位名称 */
export function fixerGradeName(run: RunState): string {
  return FIXER_GRADE_NAMES[Math.max(0, Math.min(10, run.fixerGrade))] ?? '未入行'
}

export { ASSOCIATIONS, findAssociation }
