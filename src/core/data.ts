import type {
  Achievement,
  DeathType,
  DistortionForm,
  EgoTemplate,
  GameEvent,
  Identity,
  Origin,
  SinFate,
  Talent,
} from '@/types'

import originsData from '../../data/origins.json'
import talentsData from '../../data/talents.json'
import egoData from '../../data/ego.json'
import distortionsData from '../../data/distortions.json'
import sinsData from '../../data/sins.json'
import identitiesData from '../../data/identities.json'
import achievementsData from '../../data/achievements.json'
import deathsData from '../../data/deaths.json'
import eventsChild from '../../data/events/events-child.json'
import eventsTeen from '../../data/events/events-teen.json'
import eventsAdult from '../../data/events/events-adult.json'
import eventsMid from '../../data/events/events-mid.json'
import eventsElder from '../../data/events/events-elder.json'
import eventsAncients from '../../data/events/events-ancients.json'
import eventsBackalley from '../../data/events/events-backalley.json'
import eventsNest from '../../data/events/events-nest.json'
import eventsFixer from '../../data/events/events-fixer.json'
import eventsFinger from '../../data/events/events-finger.json'
import eventsAssoc from '../../data/events/events-assoc.json'
import eventsAbno from '../../data/events/events-abno.json'
import eventsSpecial from '../../data/events/events-special.json'
import eventsVoice from '../../data/events/events-voice.json'
import eventsDeath from '../../data/events/events-death.json'

export const ORIGINS = originsData as Origin[]
export const TALENTS = talentsData as Talent[]
export const EGO_TEMPLATES = egoData as EgoTemplate[]
export const DISTORTION_FORMS = distortionsData as DistortionForm[]
export const SINS = sinsData as SinFate[]
export const IDENTITIES = identitiesData as Identity[]
export const ACHIEVEMENTS = achievementsData as Achievement[]
export const DEATH_TYPES = deathsData as DeathType[]

const EVENT_MODULES: GameEvent[][] = [
  eventsChild,
  eventsTeen,
  eventsAdult,
  eventsMid,
  eventsElder,
  eventsAncients,
  eventsBackalley,
  eventsNest,
  eventsFixer,
  eventsFinger,
  eventsAssoc,
  eventsAbno,
  eventsSpecial,
  eventsVoice,
  eventsDeath,
] as unknown as GameEvent[][]

/** 合并全部事件并校验 ID 唯一 */
export function loadAllEvents(): GameEvent[] {
  const merged: GameEvent[] = []
  const seen = new Set<number>()
  for (const mod of EVENT_MODULES) {
    for (const ev of mod) {
      if (seen.has(ev.id)) {
        console.warn(`[city-fate] 事件 ID 重复: ${ev.id}`)
        continue
      }
      seen.add(ev.id)
      merged.push(ev)
    }
  }
  return merged
}

let cached: GameEvent[] | null = null
export function getAllEvents(): GameEvent[] {
  if (!cached) cached = loadAllEvents()
  return cached
}

export function findEvent(id: number): GameEvent | undefined {
  return getAllEvents().find((e) => e.id === id)
}

export function findDeathType(id: string): DeathType | undefined {
  return DEATH_TYPES.find((d) => d.id === id)
}

export function findOrigin(id: string): Origin | undefined {
  return ORIGINS.find((o) => o.id === id)
}

export function findIdentity(id: string): Identity | undefined {
  return IDENTITIES.find((i) => i.id === id)
}

export function findEgo(id: string): EgoTemplate | undefined {
  return EGO_TEMPLATES.find((e) => e.id === id)
}

export function findAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

/** 收尾人晋升阶梯（用于 setIdentity: 'fixer-next'） */
const FIXER_LADDER = [
  'fixer-9',
  'fixer-8',
  'fixer-7',
  'fixer-6',
  'fixer-5',
  'fixer-4',
  'fixer-3',
  'fixer-2',
  'fixer-1',
  'fixer-color',
]

export function nextFixerTier(current: string): string | undefined {
  const idx = FIXER_LADDER.indexOf(current)
  if (idx < 0) return 'fixer-9'
  return FIXER_LADDER[idx + 1]
}
