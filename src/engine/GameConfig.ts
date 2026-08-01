import type { Stats } from '@/types'

/** 都市·命途 核心配置 */
export const MAX_AGE = 150
export const ALLOC_POINTS = 25
export const STAT_MIN = 0
export const STAT_MAX = 10

/** 初始属性（合计恰为 25 点） */
export const BASE_STATS: Stats = {
  physique: 5,
  intelligence: 5,
  instinct: 5,
  will: 5,
  fortune: 3,
  synergy: 2,
}

/** 精神压力阈值 */
export const PRESSURE_WHISPER = 60 // 低语预兆
export const PRESSURE_CRISIS = 80 // 叩问自我（强制）
export const DISTORTION_MAX = 100

/** EGO 觉醒校验 */
export const EGO_WILL_MIN = 6
export const EGO_SYNERGY_MIN = 4
export const EGO_INSTINCT_MIN = 3

/** 每年事件数：0-12岁1件 / 13-60岁1-2件 / 61岁后1件 */
export function eventsPerYear(age: number): number {
  if (age <= 12) return 1
  if (age >= 61) return 1
  return Math.random() < 0.45 ? 2 : 1
}

/** 衍生值初始公式 */
export function initHealth(stats: Stats): number {
  return clamp(Math.round(stats.physique * 2 + 30), 0, 100)
}

export function initPressure(stats: Stats): number {
  return clamp(15 - Math.floor(stats.will / 3 + stats.synergy / 4), 0, 100)
}

/** 老年自然衰减：60 岁后每年衰减 */
export function ageHealthDecay(age: number): number {
  if (age <= 60) return 0
  const severity = age - 60
  if (severity <= 20) return 1
  if (severity <= 50) return 2
  return 3
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
