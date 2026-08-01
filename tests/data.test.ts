import { describe, expect, it } from 'vitest'
import { getAllEvents, ACHIEVEMENTS, ORIGINS, EGO_TEMPLATES, SINS, DISTORTION_FORMS, DEATH_TYPES } from '@/core/data'

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
})
