import { describe, expect, it } from 'vitest'
import { clampStats, applyEffects, snapshotContext, allocStats } from '@/core/PropertySystem'
import { evalConditions } from '@/engine/ConditionEvaluator'
import { weightedRandom, mulberry32, randInt } from '@/engine/Random'
import { BASE_STATS, ALLOC_POINTS, STAT_MAX } from '@/engine/GameConfig'
import type { CityFateData, RunState } from '@/types'

function makeRun(overrides: Partial<RunState> = {}): RunState {
  return {
    health: 55,
    pressure: 10,
    reputation: 0,
    pressureLocked: false,
    lastEventIds: [],
    cooldownUntil: {},
    egoMemoryApplied: false,
    voiceCrisisDone: false,
    voiceWhisperDone: false,
    stamina: 10,
    locationId: 'backalley-7',
    stage: 'SURVIVAL',
    actionPoints: 3,
    npcStates: [],
    storylineProgress: {},
    roundCount: 0,
    daysInCity: 0,
    unlockedActions: [],
    unlockedLocations: [],
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
    deepNightWindow: false,
    eyeWatchLevel: 0,
    ...overrides,
  }
}

function makeData(overrides: Partial<CityFateData> = {}): CityFateData {
  return {
    id: 't',
    name: '测试者',
    gender: '男',
    age: 20,
    isAlive: true,
    deathCause: '',
    stats: { physique: 5, intelligence: 5, instinct: 5, will: 5, fortune: 3, synergy: 2 },
    ego: { isAwakened: false, egoName: '', egoType: '武器', distortionProgress: 0 },
    identity: '穿越者',
    affiliation: '无',
    wealth: 100,
    traits: [],
    lifeLog: [],
    keyMoments: [],
    unlockedAchievements: [],
    playCount: 1,
    totalLifespan: 0,
    inventory: [],
    equipped: {},
    ...overrides,
  }
}

describe('属性系统', () => {
  it('属性钳制在 0-10', () => {
    const s = clampStats({ physique: -3, intelligence: 12, instinct: 5, will: 5, fortune: 3, synergy: 2 })
    expect(s.physique).toBe(0)
    expect(s.intelligence).toBe(10)
  })

  it('基础属性合计 25 点', () => {
    const total = Object.values(BASE_STATS).reduce((a, b) => a + b, 0)
    expect(total).toBe(ALLOC_POINTS)
  })

  it('应用效果：属性/财富/扭曲/压力', () => {
    const data = makeData()
    const run = makeRun()
    const { bankrupt } = applyEffects(data, run, {
      physique: 2,
      wealth: -500,
      distortion: 30,
      pressure: 20,
    })
    expect(data.stats.physique).toBe(7)
    expect(data.wealth).toBe(0)
    expect(bankrupt).toBe(true)
    expect(data.ego.distortionProgress).toBe(30)
    expect(run.pressure).toBe(30)
  })

  it('压力锁定后增长减半', () => {
    const data = makeData()
    const run = makeRun({ pressureLocked: true, pressure: 10 })
    applyEffects(data, run, { pressure: 20 })
    expect(run.pressure).toBe(20)
  })

  it('snapshotContext 包含全部效果键', () => {
    const data = makeData()
    const run = makeRun({ reputation: 15 })
    const ctx = snapshotContext(data, run)
    expect(ctx.physique).toBe(5)
    expect(ctx.reputation).toBe(15)
    expect(ctx.wealth).toBe(100)
  })
})

describe('条件求值', () => {
  it('单条件 >=', () => {
    expect(evalConditions({ attribute: 'will', operator: '>=', value: 5 }, { will: 6 })).toBe(true)
    expect(evalConditions({ attribute: 'will', operator: '>=', value: 7 }, { will: 6 })).toBe(false)
  })

  it('AND/OR 复合条件', () => {
    const cond = {
      op: 'AND' as const,
      conditions: [
        { attribute: 'physique' as const, operator: '>=' as const, value: 5 },
        {
          op: 'OR' as const,
          conditions: [
            { attribute: 'will' as const, operator: '>=' as const, value: 6 },
            { attribute: 'synergy' as const, operator: '>=' as const, value: 8 },
          ],
        },
      ],
    }
    expect(evalConditions(cond, { physique: 5, will: 4, synergy: 9 })).toBe(true)
    expect(evalConditions(cond, { physique: 5, will: 4, synergy: 3 })).toBe(false)
  })

  it('无条件默认通过', () => {
    expect(evalConditions(undefined, {})).toBe(true)
  })
})

describe('随机工具', () => {
  it('加权随机命中高权重项', () => {
    const rand = mulberry32(42)
    let hits = 0
    for (let i = 0; i < 1000; i++) {
      const idx = weightedRandom(['a', 'b'], (_, i) => (i === 0 ? 9 : 1), rand)
      if (idx === 0) hits++
    }
    expect(hits).toBeGreaterThan(800)
  })

  it('randInt 在闭区间内', () => {
    const rand = mulberry32(7)
    for (let i = 0; i < 100; i++) {
      const v = randInt(1, 3, rand)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(3)
    }
  })

  it('全 0 权重返回 -1', () => {
    expect(weightedRandom(['a'], () => 0)).toBe(-1)
  })
})

describe('分配规则', () => {
  it('单属性不超过上限', () => {
    const s = allocStats(BASE_STATS, { physique: STAT_MAX + 1 })
    expect(s.physique).toBe(STAT_MAX)
  })
})
