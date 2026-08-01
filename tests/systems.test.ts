import { describe, expect, it } from 'vitest'
import { checkDeath, makeDeath } from '@/core/DeathSystem'
import { canAwakenEgo, awakenEgo } from '@/core/EgoSystem'
import { applyDistortion, resolveSin } from '@/core/DistortionSystem'
import { finalizeDeath, computeRebirthPoints } from '@/core/RebirthSystem'
import { createRun, resolveBranch, rollYear, endYear } from '@/core/GameEngine'
import { findEvent } from '@/core/data'
import { MAX_AGE } from '@/engine/GameConfig'
import type { GlobalMeta } from '@/types'

function makeMeta(): GlobalMeta {
  return { unlockedAchievements: [], playCount: 0, totalLifespan: 0, rebirthPoints: 0, totalEarned: 0 }
}

function makeStats() {
  return { physique: 5, intelligence: 5, instinct: 5, will: 5, fortune: 3, synergy: 2 }
}

describe('死亡系统', () => {
  it('150 岁强制自然老死', () => {
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    data.age = MAX_AGE
    const d = checkDeath(data, run)
    expect(d?.deathId).toBe('natural')
    expect(d?.isAgeMax).toBe(true)
  })

  it('扭曲进度 100 触发扭曲化死亡', () => {
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    data.ego.distortionProgress = 100
    expect(checkDeath(data, run)?.deathId).toBe('distorted')
  })

  it('健康归零死亡，幼年记为夭折', () => {
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    run.health = 0
    data.age = 5
    expect(checkDeath(data, run)?.deathId).toBe('young')
    data.age = 40
    expect(checkDeath(data, run)?.deathId).toBe('disease')
  })

  it('makeDeath 从 deaths.json 取叙事', () => {
    const d = makeDeath('claw')
    expect(d.cause).toBe('触犯禁忌')
    expect(d.epitaph.length).toBeGreaterThan(0)
  })
})

describe('EGO 系统', () => {
  it('满足意志/共鸣/直觉条件可觉醒', () => {
    const { data } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    data.stats.will = 7
    data.stats.synergy = 5
    data.stats.instinct = 4
    expect(canAwakenEgo(data)).toBe(true)
  })

  it('意志不足不可觉醒', () => {
    const { data } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    data.stats.will = 3
    expect(canAwakenEgo(data)).toBe(false)
  })

  it('觉醒后写入 egoName/type 并回退扭曲进度', () => {
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    data.stats.will = 8
    data.stats.synergy = 6
    data.stats.instinct = 5
    data.ego.distortionProgress = 60
    const res = awakenEgo(data, run, () => 0)
    expect(data.ego.isAwakened).toBe(true)
    expect(data.ego.egoName).toBe(res.ego.name)
    expect(data.ego.distortionProgress).toBeLessThan(60)
    expect(run.pressureLocked).toBe(true)
  })
})

describe('扭曲与大罪', () => {
  it('applyDistortion 设定形态并提升进度', () => {
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    const res = applyDistortion(data, run, () => 0)
    expect(res.form.id).toBeTruthy()
    expect(run.distortionFormId).toBe(res.form.id)
    expect(data.ego.distortionProgress).toBeGreaterThanOrEqual(30)
  })

  it('resolveSin 按画像匹配七宗罪', () => {
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    data.stats.physique = 8
    data.stats.will = 2
    run.reputation = 5
    const fate = resolveSin(data, run)
    expect(['傲慢', '嫉妒', '暴怒', '倦怠', '暴食', '忧郁', '色欲']).toContain(fate.type)
    expect(run.sinType).toBe(fate.type)
  })
})

describe('轮回系统', () => {
  it('finalizeDeath 累加 playCount/totalLifespan 并给出遗产点', () => {
    const meta = makeMeta()
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', meta)
    data.age = 50
    data.wealth = 10000
    const { points } = finalizeDeath(data, meta, run)
    expect(meta.playCount).toBe(1)
    expect(meta.totalLifespan).toBe(50)
    expect(points).toBeGreaterThan(0)
    expect(meta.rebirthPoints).toBe(points)
    expect(data.isAlive).toBe(false)
  })

  it('computeRebirthPoints 随成就/EGO 提升', () => {
    const meta = makeMeta()
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', meta)
    data.age = 100
    data.ego.isAwakened = true
    run.distortionFormId = 'piano-body'
    meta.unlockedAchievements = ['a', 'b']
    const p = computeRebirthPoints(data, meta, run)
    expect(p).toBeGreaterThan(100)
  })
})

describe('主引擎', () => {
  it('rollYear 在年龄上限返回死亡', () => {
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    data.age = MAX_AGE
    const plan = rollYear(data, run)
    expect(plan.death?.deathId).toBe('natural')
  })

  it('endYear 年龄推进且老年健康衰减', () => {
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', makeMeta())
    data.age = 61
    const before = run.health
    endYear(data, run)
    expect(data.age).toBe(62)
    expect(run.health).toBeLessThanOrEqual(before)
  })

  it('叩问自我三分支：EGO/扭曲/大罪', () => {
    // EGO 分支
    const meta1 = makeMeta()
    const b1 = createRun('backalley-rat', makeStats(), 'X', '男', meta1)
    b1.data.stats.will = 8
    b1.data.stats.synergy = 6
    b1.data.stats.instinct = 5
    b1.run.pressure = 85
    const voice = findEvent(9001)!
    const egoBranch = voice.branches!.find((b) => b.outcome === 'ego')!
    const r1 = resolveBranch(b1.data, b1.run, meta1, voice, egoBranch)
    expect(r1.egoAwaken).toBeTruthy()
    expect(b1.data.ego.isAwakened).toBe(true)

    // 扭曲分支
    const meta2 = makeMeta()
    const b2 = createRun('backalley-rat', makeStats(), 'X', '男', meta2)
    b2.run.pressure = 85
    const distBranch = voice.branches!.find((b) => b.outcome === 'distortion')!
    const r2 = resolveBranch(b2.data, b2.run, meta2, voice, distBranch)
    expect(r2.distortionForm).toBeTruthy()

    // 大罪分支
    const meta3 = makeMeta()
    const b3 = createRun('backalley-rat', makeStats(), 'X', '男', meta3)
    b3.data.stats.physique = 8
    b3.data.stats.will = 2
    const sinBranch = voice.branches!.find((b) => b.outcome === 'sin')!
    const r3 = resolveBranch(b3.data, b3.run, meta3, voice, sinBranch)
    expect(r3.sinFate).toBeTruthy()
    expect(b3.data.isAlive).toBe(false)
    expect(meta3.playCount).toBe(1)
  })

  it('死亡链事件直接致死', () => {
    const meta = makeMeta()
    const { data, run } = createRun('backalley-rat', makeStats(), 'X', '男', meta)
    const deathEvent = findEvent(9501)!
    const branch = deathEvent.branches![0]
    const r = resolveBranch(data, run, meta, deathEvent, branch)
    expect(r.death?.deathId).toBe('claw')
    expect(data.isAlive).toBe(false)
  })
})
