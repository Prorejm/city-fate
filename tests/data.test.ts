import { describe, expect, it } from 'vitest'
import { getAllEvents, ACHIEVEMENTS, ORIGINS, EGO_TEMPLATES, SINS, DISTORTION_FORMS, DEATH_TYPES, TRAVERSE_TALENTS, LOCATIONS, ACTIONS, NPCS, STORYLINES, ASSOCIATIONS, COMMISSIONS, ITEMS } from '@/core/data'

describe('数据完整性', () => {
  it('事件 ID 全局唯一', () => {
    const events = getAllEvents()
    const ids = events.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('事件总数达标（≥100）', () => {
    expect(getAllEvents().length).toBeGreaterThanOrEqual(100)
  })

  it('每个年龄池非空', () => {
    const types = ['child', 'teen', 'adult', 'mid', 'elder', 'ancients']
    for (const t of types) {
      expect(getAllEvents().filter((e) => e.type === t).length, `${t} 池为空`).toBeGreaterThan(0)
    }
  })

  it('成就 60+ 且 id 唯一', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(60)
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
  })

  it('大罪恰为七种', () => {
    expect(SINS.length).toBe(7)
  })

  it('出身 8 种且含出生地', () => {
    expect(ORIGINS.length).toBe(8)
    for (const o of ORIGINS) {
      expect(o.district.length).toBeGreaterThan(0)
      expect(o.description.length).toBeGreaterThan(10)
    }
  })

  it('EGO 库与扭曲形态非空', () => {
    expect(EGO_TEMPLATES.length).toBeGreaterThan(10)
    expect(DISTORTION_FORMS.length).toBeGreaterThan(5)
  })

  it('死亡类型含叙事', () => {
    expect(DEATH_TYPES.length).toBeGreaterThan(10)
    for (const d of DEATH_TYPES) {
      expect(d.epitaph.length).toBeGreaterThan(10)
    }
  })

  it('内心之声关键抉择事件存在且强制插队', () => {
    const crisis = getAllEvents().find((e) => e.id === 9001)
    expect(crisis?.voiceTrigger).toBe(true)
    expect(crisis?.branches?.length).toBe(3)
  })

  it('穿越天赋包含穿越类与身份类', () => {
    expect(TRAVERSE_TALENTS.filter((t) => t.kind === 'traverse').length).toBeGreaterThanOrEqual(6)
    expect(TRAVERSE_TALENTS.filter((t) => t.kind === 'identity').length).toBeGreaterThanOrEqual(7)
  })

  it('地点与行动数据完整', () => {
    expect(LOCATIONS.length).toBeGreaterThanOrEqual(8)
    expect(ACTIONS.length).toBeGreaterThanOrEqual(20)
    for (const loc of LOCATIONS) {
      expect(loc.actions.length).toBeGreaterThan(0)
    }
  })

  it('NPC 头像引用存在且剧情线完整', () => {
    expect(NPCS.length).toBeGreaterThanOrEqual(18)
    for (const n of NPCS) {
      expect(n.avatar.length).toBeGreaterThan(0)
    }
    expect(STORYLINES.length).toBeGreaterThanOrEqual(15)
    for (const s of STORYLINES) {
      expect(s.stages.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('十二协会完整且委托引用合法', () => {
    expect(ASSOCIATIONS.length).toBe(12)
    expect(new Set(ASSOCIATIONS.map((a) => a.id)).size).toBe(12)
    expect(COMMISSIONS.length).toBeGreaterThanOrEqual(20)
    const assocIds = new Set(ASSOCIATIONS.map((a) => a.id))
    for (const c of COMMISSIONS) {
      expect(assocIds.has(c.associationId)).toBe(true)
      expect(['传闻', '都市传说', '都市恶疾', '都市梦魇', '都市之星']).toContain(c.tier)
    }
  })

  it('物品库完整且含文学遗物', () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(24)
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length)
    const cats = new Set(ITEMS.map((i) => i.category))
    expect(cats.has('weapon')).toBe(true)
    expect(cats.has('armor')).toBe(true)
    expect(cats.has('consumable')).toBe(true)
    expect(cats.has('relic')).toBe(true)
    // 文学遗物彩蛋
    expect(ITEMS.some((i) => i.id === 'r-mambrino')).toBe(true)
    expect(ITEMS.some((i) => i.id === 'r-gungnir-shard')).toBe(true)
    expect(ITEMS.some((i) => i.id === 'r-whale-bone')).toBe(true)
  })
})
