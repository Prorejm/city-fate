import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Achievement,
  CityFateData,
  EventBranch,
  GameEvent,
  Gender,
  GlobalMeta,
  RunState,
  SinFate,
  Stats,
} from '@/types'
import type { Phase } from '@/engine/StateManager'
import {
  BranchResolution,
  RunBundle,
  createRun,
  endYear,
  resolveBranch,
  rollYear,
} from '@/core/GameEngine'
import type { DeathResult } from '@/core/DeathSystem'
import type { DistortionApplyResult } from '@/core/DistortionSystem'
import type { EgoAwakenResult } from '@/core/EgoSystem'
import type { EventSelection } from '@/core/EventSystem'
import { checkAchievements } from '@/core/AchievementSystem'
import { findEvent } from '@/core/data'

const INITIAL_META: GlobalMeta = {
  unlockedAchievements: [],
  playCount: 0,
  totalLifespan: 0,
  rebirthPoints: 0,
  totalEarned: 0,
}

/** 平静之年的合成事件（事件池为空时兜底，避免空年循环） */
const QUIET_EVENT: GameEvent = {
  id: -1,
  title: '平静的一年',
  description: '这一年，都市的风平浪静。你安稳地度过了一岁。',
  type: 'backalley',
  weight: 1,
  repeatable: true,
  branches: [{ id: 'quiet', text: '继续生活。', effects: { health: 1 } }],
  portrait: 'calm',
}

export interface NewLifeInput {
  originId: string
  stats: Stats
  name: string
  gender: Gender
}

export interface CharacterDraft {
  originId: string
  name: string
  gender: Gender
}

interface GameStore {
  phase: Phase
  data: CityFateData | null
  run: RunState | null
  meta: GlobalMeta
  draft: CharacterDraft | null
  currentEvents: EventSelection[]
  currentIndex: number
  pendingEgo: EgoAwakenResult | null
  pendingDistortion: DistortionApplyResult | null
  pendingSin: SinFate | null
  death: DeathResult | null
  newlyAchieved: Achievement[]
  yearLog: string

  startNewLife: (input: NewLifeInput) => void
  setDraft: (draft: CharacterDraft) => void
  advanceYear: () => void
  chooseBranch: (branch: EventBranch) => void
  confirmEgo: () => void
  confirmDistortion: () => void
  nextChainEvent: () => void
  goToCreate: () => void
  goToMenu: () => void
  clearNewlyAchieved: () => void
}

function collectYearAchievements(data: CityFateData, run: RunState, meta: GlobalMeta): Achievement[] {
  return checkAchievements(data, meta, run)
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      phase: 'MENU',
      data: null,
      run: null,
      meta: { ...INITIAL_META },
      draft: null,
      currentEvents: [],
      currentIndex: 0,
      pendingEgo: null,
      pendingDistortion: null,
      pendingSin: null,
      death: null,
      newlyAchieved: [],
      yearLog: '',

      startNewLife: (input) => {
        const { meta } = get()
        const bundle: RunBundle = createRun(input.originId, input.stats, input.name, input.gender, meta)
        set({
          data: bundle.data,
          run: bundle.run,
          phase: 'PLAYING',
          draft: null,
          currentEvents: [],
          currentIndex: 0,
          pendingEgo: null,
          pendingDistortion: null,
          pendingSin: null,
          death: null,
          newlyAchieved: [],
          yearLog: '',
        })
        get().advanceYear()
      },

      setDraft: (draft) => {
        set({ draft, phase: 'ALLOCATE' })
      },

      advanceYear: () => {
        const { data, run, meta } = get()
        if (!data || !run) return
        const plan = rollYear(data, run)
        if (plan.death) {
          data.deathCause = data.deathCause || plan.death.cause
          data.isAlive = false
          set({ phase: 'DEATH', death: plan.death, currentEvents: [], currentIndex: 0 })
          return
        }
        let events = plan.events
        if (events.length === 0) {
          events = [{ event: QUIET_EVENT }]
        }
        // 年度成就检查
        const gained = collectYearAchievements(data, run, meta)
        if (gained.length > 0) set({ newlyAchieved: [...get().newlyAchieved, ...gained] })
        set({ currentEvents: events, currentIndex: 0 })
      },

      chooseBranch: (branch) => {
        const { data, run, meta, currentEvents, currentIndex } = get()
        if (!data || !run) return
        const current = currentEvents[currentIndex]
        if (!current) return
        const resolution: BranchResolution = resolveBranch(data, run, meta, current.event, branch)

        const newly = [...get().newlyAchieved]
        if (resolution.newlyAchieved.length > 0) newly.push(...resolution.newlyAchieved)
        set({ newlyAchieved: newly, yearLog: resolution.log })

        if (resolution.death) {
          set({ phase: 'DEATH', death: resolution.death, currentEvents: [], currentIndex: 0 })
          return
        }
        if (resolution.egoAwaken) {
          set({ pendingEgo: resolution.egoAwaken, phase: 'EGO_AWAKEN' })
          return
        }
        if (resolution.distortionForm) {
          set({ pendingDistortion: resolution.distortionForm, phase: 'DISTORTION' })
          return
        }
        if (resolution.sinFate) {
          set({ death: { deathId: 'sin', name: resolution.sinFate.name, cause: '大罪化', epitaph: resolution.sinFate.endingText }, phase: 'DEATH' })
          return
        }
        if (resolution.nextEventId !== undefined) {
          const next = findEvent(resolution.nextEventId)
          if (next) {
            set({ currentEvents: [{ event: next }], currentIndex: 0 })
            return
          }
        }
        // 本年度下一个事件
        if (currentIndex + 1 < currentEvents.length) {
          set({ currentIndex: currentIndex + 1 })
        } else {
          const { log, death } = endYear(data, run)
          if (death) {
            data.deathCause = data.deathCause || death.cause
            data.isAlive = false
            set({ phase: 'DEATH', death, currentEvents: [], currentIndex: 0 })
            return
          }
          const gained = collectYearAchievements(data, run, meta)
          if (gained.length > 0) set({ newlyAchieved: [...get().newlyAchieved, ...gained] })
          set({ currentEvents: [], currentIndex: 0, yearLog: log })
          get().advanceYear()
        }
      },

      confirmEgo: () => {
        set({ pendingEgo: null, phase: 'PLAYING' })
        const { currentEvents, currentIndex, data, run, meta } = get()
        if (currentIndex + 1 < currentEvents.length) {
          set({ currentIndex: currentIndex + 1 })
        } else {
          if (!data || !run) return
          const { log, death } = endYear(data, run)
          if (death) {
            data.deathCause = data.deathCause || death.cause
            data.isAlive = false
            set({ phase: 'DEATH', death, currentEvents: [], currentIndex: 0 })
            return
          }
          const gained = collectYearAchievements(data, run, meta)
          if (gained.length > 0) set({ newlyAchieved: [...get().newlyAchieved, ...gained] })
          set({ currentEvents: [], currentIndex: 0, yearLog: log })
          get().advanceYear()
        }
      },

      confirmDistortion: () => {
        set({ pendingDistortion: null, phase: 'PLAYING' })
        get().confirmEgo() // 与 EGO 确认后的继续流程一致
      },

      nextChainEvent: () => {
        const { currentEvents, currentIndex } = get()
        if (currentIndex + 1 < currentEvents.length) set({ currentIndex: currentIndex + 1 })
      },

      goToCreate: () => {
        set({
          phase: 'CREATE',
          data: null,
          run: null,
          currentEvents: [],
          currentIndex: 0,
          pendingEgo: null,
          pendingDistortion: null,
          pendingSin: null,
          death: null,
        })
      },

      goToMenu: () => {
        set({
          phase: 'MENU',
          data: null,
          run: null,
          currentEvents: [],
          currentIndex: 0,
          pendingEgo: null,
          pendingDistortion: null,
          pendingSin: null,
          death: null,
        })
      },

      clearNewlyAchieved: () => set({ newlyAchieved: [] }),
    }),
    {
      name: 'cityFateData',
      version: 1,
      partialize: (state) => ({
        meta: state.meta,
      }),
      merge: (persisted, current) => {
        const p = persisted as { meta?: Partial<GlobalMeta> } | undefined
        return {
          ...current,
          meta: {
            ...INITIAL_META,
            ...(p?.meta ?? {}),
          },
        }
      },
    },
  ),
)
