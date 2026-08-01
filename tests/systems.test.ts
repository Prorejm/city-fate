import { describe, expect, it } from 'vitest'
import { checkDeath, makeDeath } from '@/core/DeathSystem'
import { canAwakenEgo } from '@/core/EgoSystem'
import { applyDistortion, resolveSin } from '@/core/DistortionSystem'
import { finalizeDeath } from '@/core/RebirthSystem'
import { createTraverseRun, beginRound } from '@/core/GameEngine'
import { executeAction, actionChance } from '@/core/ActionSystem'
import { travelTo, currentStage, actionAvailable } from '@/core/LocationSystem'
import { adjustAffinity, meetNpcsAtLocation } from '@/core/NpcSystem'
import { checkStorylines } from '@/core/StorylineSystem'
import { ensureFixerGrade, generateCommissionPool, resolveCommission, promoteFixer, isFingerMember } from '@/core/CommissionSystem'
import { grantXp, chooseSubclass, canChooseSubclass, totalProfessionLevel, XP_THRESHOLDS } from '@/core/ProfessionSystem'
import { addItem, equipItem, consumeItem, equipmentBonuses, rollQuality } from '@/core/ItemSystem'
import type { GlobalMeta } from '@/types'

function makeMeta(): GlobalMeta {
  return { unlockedAchievements: [], playCount: 0, totalLifespan: 0, rebirthPoints: 0, totalEarned: 0 }
}

function makeStats() {
  return { physique: 5, intelligence: 5, instinct: 5, will: 5, fortune: 3, synergy: 2 }
}

function makeTraverseRun(meta: GlobalMeta) {
  return createTraverseRun(makeStats(), '穿越者', '男', meta, 'modern-knowledge', 'backalley-orphan')
}

describe('死亡系统', () => {
  it('健康归零死亡', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.health = 0
    expect(checkDeath(data, run)?.deathId).toBe('disease')
  })

  it('makeDeath 从 deaths.json 取叙事', () => {
    const d = makeDeath('claw')
    expect(d.cause).toBe('触犯禁忌')
    expect(d.epitaph.length).toBeGreaterThan(0)
  })
})

describe('天赋系统', () => {
  it('身份天赋决定初始身份/地点/财富', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    expect(data.identity).toBe('后巷遗孤')
    expect(run.locationId).toBe('backalley-7')
    expect(data.wealth).toBe(30)
    expect(data.stats.instinct).toBeGreaterThanOrEqual(6)
  })

  it('收尾人学徒初始地点为协会', () => {
    const meta = makeMeta()
    const { run } = createTraverseRun(makeStats(), 'X', '男', meta, null, 'fixer-apprentice')
    expect(run.locationId).toBe('fixer-guild')
    expect(run.unlockedActions).toContain('fixer-board')
  })
})

describe('地点与行动系统', () => {
  it('阶段判定：生存期→立足期', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    expect(currentStage(data, run)).toBe('SURVIVAL')
    data.wealth = 800
    run.shelterLevel = 1
    expect(currentStage(data, run)).toBe('SETTLED')
    run.reputation = 30
    expect(currentStage(data, run)).toBe('ADVENTURE')
  })

  it('travelTo 消耗体力并移动', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.unlockedLocations.push('alley-market')
    const before = run.stamina
    const res = travelTo(data, run, 'alley-market')
    expect(res.ok).toBe(true)
    expect(run.locationId).toBe('alley-market')
    expect(run.stamina).toBe(before - 1)
  })

  it('体力不足无法移动', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.unlockedLocations.push('alley-market')
    run.stamina = 0
    expect(travelTo(data, run, 'alley-market').ok).toBe(false)
  })

  it('executeAction 消耗 AP 与体力并返回结果', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.actionPoints = 3
    run.stamina = 10
    const outcome = executeAction(data, run, 'odd-job', () => 0.5)
    expect(outcome).not.toBeNull()
    expect(run.actionPoints).toBe(2)
    expect(run.stamina).toBe(8)
    expect(outcome!.success).toBe(true)
    expect(outcome!.gold).toBeGreaterThan(0)
  })

  it('行动成功率随属性变化', () => {
    const { data } = makeTraverseRun(makeMeta())
    const { findAction } = { findAction: null } as never
    void findAction
    const action = { baseChance: 0.5, statBias: { attr: 'physique' as const, weight: 1 } } as never
    const p1 = actionChance(data, action as never)
    data.stats.physique = 10
    const p2 = actionChance(data, action as never)
    expect(p2).toBeGreaterThan(p1)
  })
})

describe('NPC 系统', () => {
  it('初始地点 NPC 已结识', () => {
    const { run } = makeTraverseRun(makeMeta())
    expect(run.locationId).toBe('backalley-7')
    const butcher = run.npcStates.find((s) => s.id === 'butcher-kai')
    expect(butcher?.met).toBe(true)
    expect(butcher?.metLocation).toBe('backalley-7')
  })

  it('进入新地点结识该地 NPC', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.unlockedLocations.push('alley-market')
    travelTo(data, run, 'alley-market')
    const met = meetNpcsAtLocation(run, 'alley-market')
    expect(met.length).toBeGreaterThan(0)
    const ali = run.npcStates.find((s) => s.id === 'ali')
    expect(ali?.met).toBe(true)
  })

  it('好感度与关系联动', () => {
    const { run } = makeTraverseRun(makeMeta())
    const st = run.npcStates.find((s) => s.id === 'old-zhou')!
    st.affinity = 15
    st.relation = '熟人'
    const res = adjustAffinity(run, 'old-zhou', 30)
    expect(res).not.toBeNull()
    expect(st.relation).toBe('盟友')
  })
})

describe('剧情线系统', () => {
  it('回合触发剧情线', () => {
    const meta = makeMeta()
    const { data, run } = makeTraverseRun(meta)
    run.roundCount = 1
    const progressed = checkStorylines(data, run)
    expect(progressed.some((p) => p.stageId === 'tm-1')).toBe(true)
  })

  it('NPC 好感触发剧情线（前置阶段完成后）', () => {
    const meta = makeMeta()
    const { data, run } = makeTraverseRun(meta)
    // 先完成 tm-1（回合 1 触发）
    run.roundCount = 1
    checkStorylines(data, run)
    expect(run.storylineProgress['traverse-mystery']).toBe('tm-1')
    // 再提高阿梨好感触发 tm-2
    const st = run.npcStates.find((s) => s.id === 'ali')!
    st.affinity = 45
    const progressed = checkStorylines(data, run)
    expect(progressed.some((p) => p.stageId === 'tm-2')).toBe(true)
  })
})

describe('回合系统', () => {
  it('beginRound 重置行动点并推进天数', () => {
    const meta = makeMeta()
    const { data, run } = makeTraverseRun(meta)
    run.actionPoints = 0
    const round = beginRound(data, run, meta)
    expect(run.roundCount).toBe(1)
    expect(run.daysInCity).toBe(1)
    expect(run.actionPoints).toBe(3)
    expect(round.log.length).toBeGreaterThan(0)
  })

  it('饥饿时健康流失', () => {
    const meta = makeMeta()
    const { data, run } = makeTraverseRun(meta)
    run.foodLevel = 0
    const before = run.health
    beginRound(data, run, meta)
    expect(run.health).toBeLessThan(before)
  })
})

describe('EGO / 扭曲 / 大罪', () => {
  it('觉醒 EGO 需属性达标', () => {
    const { data } = makeTraverseRun(makeMeta())
    data.stats.will = 8
    data.stats.synergy = 6
    data.stats.instinct = 5
    expect(canAwakenEgo(data)).toBe(true)
    data.stats.will = 3
    expect(canAwakenEgo(data)).toBe(false)
  })

  it('applyDistortion 设定形态', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    const res = applyDistortion(data, run, () => 0)
    expect(run.distortionFormId).toBe(res.form.id)
  })

  it('resolveSin 匹配七宗罪', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    data.stats.physique = 8
    data.stats.will = 2
    run.reputation = 5
    const fate = resolveSin(data, run)
    expect(['傲慢', '嫉妒', '暴怒', '倦怠', '暴食', '忧郁', '色欲']).toContain(fate.type)
  })
})

describe('轮回系统', () => {
  it('finalizeDeath 累加全局数据', () => {
    const meta = makeMeta()
    const { data, run } = makeTraverseRun(meta)
    data.wealth = 10000
    const { points } = finalizeDeath(data, meta, run)
    expect(meta.playCount).toBe(1)
    expect(points).toBeGreaterThan(0)
  })
})

describe('委托系统', () => {
  it('声望 8 自动授予九阶', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.reputation = 8
    expect(ensureFixerGrade(data, run)).toBe(true)
    expect(run.fixerGrade).toBe(1)
    expect(data.traits).toContain('fixer-license')
  })

  it('委托池按阶位过滤难度', () => {
    const { run } = makeTraverseRun(makeMeta())
    run.fixerGrade = 1
    run.reputation = 10
    const pool = generateCommissionPool(run, 4, () => 0.5)
    for (const c of pool) {
      expect(['传闻', '都市传说']).toContain(c.tier)
    }
    // 九阶看不到都市之星
    const hasStar = pool.some((c) => c.tier === '都市之星')
    expect(hasStar).toBe(false)
  })

  it('resolveCommission 成功更新协会声望', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.fixerGrade = 1
    run.reputation = 10
    const res = resolveCommission(data, run, 'cm-zwei-escort', () => 0.1)
    expect(res).not.toBeNull()
    expect(res!.success).toBe(true)
    expect(run.assocRep['zwei']).toBeGreaterThan(0)
    expect(run.commissionsDone).toBe(1)
    expect(data.wealth).toBeGreaterThan(0)
  })

  it('promoteFixer 按阈值晋升', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.fixerGrade = 1
    run.assocTotal = 20
    const promoted = promoteFixer(data, run)
    expect(promoted).toBe('fixer-8')
    expect(run.fixerGrade).toBe(2)
  })

  it('加入手指后协会委托板不可用', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    data.traits.push('finger-member')
    run.unlockedActions.push('assoc-board')
    run.locationId = 'fixer-guild'
    run.actionPoints = 3
    expect(isFingerMember(data)).toBe(true)
    expect(actionAvailable(data, run, 'assoc-board')).toBe(false)
  })

  it('成为收尾人后帮派任务不可用', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.fixerGrade = 1
    run.unlockedActions.push('finger-job')
    run.locationId = 'finger-den'
    run.actionPoints = 3
    run.stamina = 10
    expect(actionAvailable(data, run, 'finger-job')).toBe(false)
  })
})

describe('职业系统', () => {
  it('行动经验累积并升级解锁行动', () => {
    const { run } = makeTraverseRun(makeMeta())
    grantXp(run, 'fixer', 120)
    expect(run.professionLevels['fixer']).toBe(2)
    expect(run.unlockedActions).toContain('guild-bounty')
  })

  it('升级门槛递增', () => {
    expect(XP_THRESHOLDS[0]).toBe(0)
    expect(XP_THRESHOLDS[1]).toBe(100)
    expect(XP_THRESHOLDS[2]).toBe(250)
  })

  it('达到子职等级后可选择子职', () => {
    const { run } = makeTraverseRun(makeMeta())
    grantXp(run, 'fixer', 300)
    expect(run.professionLevels['fixer']).toBe(3)
    expect(canChooseSubclass({ id: 'fixer', subclassAt: 3, subclasses: [], levels: [] } as never, run)).toBe(true)
    expect(chooseSubclass(run, 'fixer', 'assoc-path')).toBe(true)
    expect(run.subclassChoice['fixer']).toBe('assoc-path')
  })

  it('总职业等级为各职业之和', () => {
    const { run } = makeTraverseRun(makeMeta())
    grantXp(run, 'fixer', 120)
    grantXp(run, 'workshop', 120)
    expect(totalProfessionLevel(run)).toBe(4)
  })

  it('委托完成经验流入收尾人职业', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    run.fixerGrade = 1
    run.reputation = 10
    resolveCommission(data, run, 'cm-zwei-escort', () => 0.1)
    expect(run.professionXp['fixer']).toBeGreaterThan(0)
  })
})

describe('物品系统', () => {
  it('加入背包并可装备', () => {
    const { data } = makeTraverseRun(makeMeta())
    expect(addItem(data, 'w-dagger')).toBe(true)
    expect(data.inventory.length).toBe(1)
    expect(equipItem(data, 0)).toBe(true)
    expect(data.equipped['main-hand']).toBe('w-dagger')
    expect(data.inventory.length).toBe(0)
  })

  it('装备提供属性加成与成功率修正', () => {
    const { data } = makeTraverseRun(makeMeta())
    addItem(data, 'w-fixer-sword')
    equipItem(data, 0)
    const { effects, chanceMod } = equipmentBonuses(data)
    expect(effects.physique).toBe(2)
    expect(chanceMod).toBe(0.04)
  })

  it('消耗品使用后从背包移除', () => {
    const { data, run } = makeTraverseRun(makeMeta())
    addItem(data, 'c-bandage')
    const before = run.health
    consumeItem(data, run, 0, (p) => {
      if (p.health !== undefined) run.health = p.health
    })
    expect(run.health).toBeGreaterThan(before)
    expect(data.inventory.length).toBe(0)
  })

  it('品质掉落返回合法品质', () => {
    const q = rollQuality(() => 0.1)
    expect(['white', 'green', 'blue', 'purple', 'gold']).toContain(q)
    const q2 = rollQuality(() => 0.99)
    expect(['white', 'green', 'blue', 'purple', 'gold']).toContain(q2)
  })
})
