import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Achievement,
  CityFateData,
  Gender,
  GlobalMeta,
  GameEvent,
  RunState,
  SinFate,
  Stats,
} from '@/types'
import type { Phase } from '@/engine/StateManager'
import { RunBundle, beginRound, createTraverseRun } from '@/core/GameEngine'
import type { DeathResult } from '@/core/DeathSystem'
import type { DistortionApplyResult } from '@/core/DistortionSystem'
import type { EgoAwakenResult } from '@/core/EgoSystem'
import { ActionOutcome, executeAction, rollEncounter } from '@/core/ActionSystem'
import { travelTo, actionAvailable, currentStage } from '@/core/LocationSystem'
import { meetNpcsAtLocation } from '@/core/NpcSystem'
import { checkStorylines, applyStorylineEffects } from '@/core/StorylineSystem'
import { checkAchievements } from '@/core/AchievementSystem'
import { canAwakenEgo, awakenEgo } from '@/core/EgoSystem'
import { applyDistortion, resolveSin } from '@/core/DistortionSystem'
import { findAction, findIdentity, STORYLINES } from '@/core/data'
import { resolveCommission, generateCommissionPool, ensureFixerGrade, isFingerMember } from '@/core/CommissionSystem'
import { chooseSubclass as chooseSubclassCore } from '@/core/ProfessionSystem'
import { consumeItem, equipItem, unequipItem } from '@/core/ItemSystem'
import type { CommissionResult, EquipmentSlot } from '@/types'
import { useUiStore } from './uiStore'

const INITIAL_META: GlobalMeta = {
  unlockedAchievements: [],
  playCount: 0,
  totalLifespan: 0,
  rebirthPoints: 0,
  totalEarned: 0,
}

export interface NewLifeInput {
  stats: Stats
  name: string
  gender: Gender
  traverseId: string | null
  identityId: string | null
}

export interface CharacterDraft {
  name: string
  gender: Gender
  traverseId: string | null
  identityId: string | null
}

export interface CurrentEvent {
  kind: 'event' | 'npc' | 'storyline' | 'result' | 'action' | 'commission' | 'commission-result' | 'inventory' | 'shop'
  event?: GameEvent
  npcId?: string
  storyId?: string
  stageId?: string
  title?: string
  result?: ActionOutcome
  commissionResult?: CommissionResult
  text?: string
}

interface GameStore {
  phase: Phase
  data: CityFateData | null
  run: RunState | null
  meta: GlobalMeta
  draft: CharacterDraft | null
  currentEvent: CurrentEvent | null
  pendingEgo: EgoAwakenResult | null
  pendingDistortion: DistortionApplyResult | null
  pendingSin: SinFate | null
  death: DeathResult | null
  newlyAchieved: Achievement[]
  roundLog: string[]
  storylineLog: string[]

  startNewLife: (input: NewLifeInput) => void
  setDraft: (draft: CharacterDraft) => void
  startRound: () => void
  performAction: (actionId: string) => void
  performCommission: (commissionId: string) => void
  chooseSubclass: (professionId: string, subclassId: string) => void
  useItem: (index: number) => void
  equipItem: (index: number) => void
  unequipItem: (slot: EquipmentSlot) => void
  openInventory: () => void
  openShop: () => void
  travelTo: (locationId: string) => void
  resolveNpcEvent: (npcId: string) => void
  nextEvent: () => void
  confirmEgo: () => void
  confirmDistortion: () => void
  resolveVoiceBranch: (outcome: 'ego' | 'distortion' | 'sin') => void
  goToCreate: () => void
  goToMenu: () => void
  clearNewlyAchieved: () => void
}

function collectAchievements(data: CityFateData, run: RunState, meta: GlobalMeta): Achievement[] {
  return checkAchievements(data, meta, run)
}

/** 根据剧情阶段 id 构建剧情弹窗事件 */
function storylineModalFor(stageId: string): CurrentEvent | null {
  for (const sl of STORYLINES) {
    const stage = sl.stages.find((s) => s.id === stageId)
    if (stage) {
      return { kind: 'storyline', storyId: sl.id, stageId, title: stage.title, text: stage.text }
    }
  }
  return null
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      phase: 'MENU',
      data: null,
      run: null,
      meta: { ...INITIAL_META },
      draft: null,
      currentEvent: null,
      pendingEgo: null,
      pendingDistortion: null,
      pendingSin: null,
      death: null,
      newlyAchieved: [],
      roundLog: [],
      storylineLog: [],

      startNewLife: (input) => {
        const { meta } = get()
        const bundle: RunBundle = createTraverseRun(
          input.stats,
          input.name,
          input.gender,
          meta,
          input.traverseId,
          input.identityId,
        )
        // 第一回合
        const round = beginRound(bundle.data, bundle.run, meta)
        // 开局剧情线（如穿越之谜·初醒）优先弹窗
        const storyEv = round.storylines.length > 0 ? storylineModalFor(round.storylines[0]) : null
        set({
          data: bundle.data,
          run: bundle.run,
          phase: 'PLAYING',
          draft: null,
          currentEvent: storyEv,
          pendingEgo: null,
          pendingDistortion: null,
          pendingSin: null,
          death: round.death ?? null,
          newlyAchieved: [],
          roundLog: [round.log],
          storylineLog: round.storylines,
        })
        if (round.death) set({ phase: 'DEATH', currentEvent: null })
      },

      setDraft: (draft) => {
        set({ draft, phase: 'ALLOCATE' })
      },

      startRound: () => {
        const { data, run, meta } = get()
        if (!data || !run) return
        const round = beginRound(data, run, meta)
        // 收尾人资格自动授予（声望 ≥ 8 且非手指成员）
        if (ensureFixerGrade(data, run)) {
          useUiStore.getState().pushToast('Hana 协会认定你为九阶收尾人', 'info')
        }
        const gained = collectAchievements(data, run, meta)
        // 回合内触发的剧情线优先弹窗
        const storyEv = round.storylines.length > 0 ? storylineModalFor(round.storylines[0]) : null
        set((s) => ({
          currentEvent: storyEv,
          roundLog: [...s.roundLog.slice(-40), round.log],
          storylineLog: [...s.storylineLog, ...round.storylines],
          newlyAchieved: [...s.newlyAchieved, ...gained],
          death: round.death ?? s.death,
        }))
        if (round.death) set({ phase: 'DEATH', currentEvent: null })
      },

      performAction: (actionId) => {
        const { data, run, meta } = get()
        if (!data || !run) return
        const action = findAction(actionId)
        if (!action) return
        if (!actionAvailable(data, run, actionId)) return

        const outcome = executeAction(data, run, actionId)
        if (!outcome) return

        // 协会委托板：打开委托面板（不执行普通结果）
        if (actionId === 'assoc-board') {
          if (isFingerMember(data)) {
            useUiStore.getState().pushToast('你已加入手指，协会拒绝你的委托申请', 'danger')
            return
          }
          if (run.fixerGrade === 0) {
            ensureFixerGrade(data, run)
          }
          if (run.commissionPool.length === 0) {
            run.commissionPool = generateCommissionPool(run, 4)
          }
          set({ currentEvent: { kind: 'commission' } })
          return
        }

        // 集市购买：打开商店（不执行普通结果）
        if (actionId === 'market-buy') {
          set({ currentEvent: { kind: 'shop' } })
          return
        }

        // 剧情线检查
        const progressed = checkStorylines(data, run, actionId)
        for (const p of progressed) {
          applyStorylineEffects(data, run, p.effects)
        }
        const storylineLog = progressed.map((p) => p.stageId)

        // 地点 NPC 结识
        const newNpcs = meetNpcsAtLocation(run, run.locationId)
        for (const npc of newNpcs) {
          useUiStore.getState().pushToast(`你结识了 ${npc.name}（${npc.title}）`, 'info')
        }

        // 刷新阶段/地点
        run.stage = currentStage(data, run)
        if (run.stage !== 'SURVIVAL') {
          run.actionPoints = 4
        }

        // 成就检查
        const gained = collectAchievements(data, run, meta)

        // 生命日志
        data.lifeLog = [...data.lifeLog.slice(-300), `第${run.daysInCity}天｜${action.name}：${outcome.text}`]

        // 内心之声：压力 ≥ 80 触发叩问自我
        if (run.pressure >= 80 && !run.voiceCrisisDone) {
          run.voiceCrisisDone = true
          set({
            currentEvent: { kind: 'event', text: '叩问自我' },
            newlyAchieved: [...get().newlyAchieved, ...gained],
            storylineLog: [...get().storylineLog, ...storylineLog],
          })
          return
        }

        // 剧情线推进优先弹窗
        if (progressed.length > 0) {
          const ev = storylineModalFor(progressed[0].stageId)
          if (ev) {
            set({
              currentEvent: ev,
              newlyAchieved: [...get().newlyAchieved, ...gained],
              storylineLog: [...get().storylineLog, ...storylineLog],
            })
            return
          }
        }

        // 随机遭遇
        const encounter = rollEncounter(run, action)
        if (encounter !== undefined) {
          set({
            currentEvent: { kind: 'npc', npcId: 'random' },
            newlyAchieved: [...get().newlyAchieved, ...gained],
            storylineLog: [...get().storylineLog, ...storylineLog],
          })
          return
        }

        set({
          currentEvent: { kind: 'result', result: outcome },
          newlyAchieved: [...get().newlyAchieved, ...gained],
          storylineLog: [...get().storylineLog, ...storylineLog],
        })
      },

      performCommission: (commissionId) => {
        const { data, run, meta } = get()
        if (!data || !run) return
        const commission = run.commissionPool.find((c) => c.id === commissionId)
        if (!commission) return
        const result = resolveCommission(data, run, commissionId)
        if (!result) return
        // 从委托池移除该单
        run.commissionPool = run.commissionPool.filter((c) => c.id !== commissionId)

        // 剧情线检查（委托完成后可能触发）
        const progressed = checkStorylines(data, run, commissionId)
        for (const p of progressed) {
          applyStorylineEffects(data, run, p.effects)
        }
        const storylineLog = progressed.map((p) => p.stageId)

        // 成就检查
        const gained = collectAchievements(data, run, meta)

        // 晋升提示
        if (result.promoted) {
          const ident = findIdentity(result.promoted)
          if (ident) {
            useUiStore.getState().pushToast(`你晋升为 ${ident.name}`, 'info')
          }
        }

        // 生命日志
        data.lifeLog = [...data.lifeLog.slice(-300), `第${run.daysInCity}天｜委托·${commission.name}：${result.text}`]

        set({
          currentEvent: { kind: 'commission-result', commissionResult: result },
          newlyAchieved: [...get().newlyAchieved, ...gained],
          storylineLog: [...get().storylineLog, ...storylineLog],
        })
      },

      chooseSubclass: (professionId, subclassId) => {
        const { run } = get()
        if (!run) return
        if (chooseSubclassCore(run, professionId, subclassId)) {
          useUiStore.getState().pushToast('子职已确定', 'info')
          set({})
        }
      },

      useItem: (index) => {
        const { data, run } = get()
        if (!data || !run) return
        const result = consumeItem(data, run, index, (patch) => {
          if (patch.health !== undefined) run.health = patch.health
          if (patch.pressure !== undefined) run.pressure = patch.pressure
          if (patch.foodLevel !== undefined) run.foodLevel = patch.foodLevel
        })
        if (result) {
          useUiStore.getState().pushToast(`使用：${result}`, 'info')
          set({})
        }
      },

      equipItem: (index) => {
        const { data } = get()
        if (!data) return
        if (equipItem(data, index)) {
          useUiStore.getState().pushToast('已装备', 'info')
          set({})
        }
      },

      unequipItem: (slot) => {
        const { data } = get()
        if (!data) return
        if (unequipItem(data, slot)) {
          useUiStore.getState().pushToast('已卸下', 'info')
          set({})
        }
      },

      openInventory: () => {
        set({ currentEvent: { kind: 'inventory' } })
      },

      openShop: () => {
        set({ currentEvent: { kind: 'shop' } })
      },

      travelTo: (locationId) => {
        const { data, run } = get()
        if (!data || !run) return
        const res = travelTo(data, run, locationId)
        if (!res.ok) {
          useUiStore.getState().pushToast('无法前往该地点（体力不足或未解锁）', 'danger')
          return
        }
        const newNpcs = meetNpcsAtLocation(run, locationId)
        for (const npc of newNpcs) {
          useUiStore.getState().pushToast(`你结识了 ${npc.name}（${npc.title}）`, 'info')
        }
        set({ currentEvent: null })
      },

      resolveNpcEvent: (npcId) => {
        void npcId
        set({ currentEvent: null })
      },

      nextEvent: () => {
        set({ currentEvent: null })
      },

      confirmEgo: () => {
        set({ pendingEgo: null, currentEvent: null, phase: 'PLAYING' })
      },

      confirmDistortion: () => {
        set({ pendingDistortion: null, currentEvent: null, phase: 'PLAYING' })
      },

      resolveVoiceBranch: (outcome) => {
        const { data, run } = get()
        if (!data || !run) return
        if (outcome === 'ego') {
          if (canAwakenEgo(data)) {
            const ego = awakenEgo(data, run)
            set({ pendingEgo: ego, phase: 'EGO_AWAKEN', currentEvent: null })
            return
          }
          const dist = applyDistortion(data, run)
          set({ pendingDistortion: dist, phase: 'DISTORTION', currentEvent: null })
          return
        }
        if (outcome === 'distortion') {
          const dist = applyDistortion(data, run)
          set({ pendingDistortion: dist, phase: 'DISTORTION', currentEvent: null })
          return
        }
        // sin
        const sin = resolveSin(data, run)
        data.deathCause = `大罪化（${sin.type}）`
        data.isAlive = false
        const death: DeathResult = {
          deathId: 'sin',
          name: sin.name,
          cause: '大罪化',
          epitaph: sin.endingText,
        }
        set({ pendingSin: sin, death, phase: 'DEATH', currentEvent: null })
      },

      goToCreate: () => {
        set({
          phase: 'CREATE',
          data: null,
          run: null,
          currentEvent: null,
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
          currentEvent: null,
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
      version: 2,
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
