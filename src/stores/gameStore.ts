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
import { deathFromChain } from '@/core/DeathSystem'
import { applyEffects } from '@/core/PropertySystem'
import { finalizeDeath } from '@/core/RebirthSystem'
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
  kind: 'event' | 'npc' | 'storyline' | 'result' | 'action' | 'commission' | 'commission-result' | 'inventory' | 'shop' | 'compendium' | 'singularity'
  event?: GameEvent
  npcId?: string
  storyId?: string
  stageId?: string
  title?: string
  result?: ActionOutcome
  commissionResult?: CommissionResult
  text?: string
}

/** 当日结算摘要 */
export interface DaySummary {
  day: number
  actionsTaken: string[]
  itemsGained: string[]
  npcsMet: string[]
  log: string
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
  daySummary: DaySummary | null

  startNewLife: (input: NewLifeInput) => void
  setDraft: (draft: CharacterDraft) => void
  startRound: () => void
  showDaySummary: () => void
  confirmDaySummary: () => void
  performAction: (actionId: string) => void
  performCommission: (commissionId: string) => void
  chooseSubclass: (professionId: string, subclassId: string) => void
  useItem: (index: number) => void
  equipItem: (index: number) => void
  unequipItem: (slot: EquipmentSlot) => void
  openInventory: () => void
  openShop: () => void
  openCompendium: () => void
  travelTo: (locationId: string) => void
  resolveNpcEvent: (npcId: string) => void
  resolveEventBranch: (branchId: string) => void
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
      daySummary: null,

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
        // 回合内触发的剧情线优先弹窗；其次每日事件
        const storyEv = round.storylines.length > 0 ? storylineModalFor(round.storylines[0]) : null
        let ev: CurrentEvent | null = storyEv
        if (!ev && round.event) {
          ev = { kind: 'event', event: round.event, title: round.event.title, text: round.event.description }
        }
        set((s) => ({
          currentEvent: ev,
          daySummary: null,
          roundLog: [...s.roundLog.slice(-40), round.log],
          storylineLog: [...s.storylineLog, ...round.storylines],
          newlyAchieved: [...s.newlyAchieved, ...gained],
          death: round.death ?? s.death,
        }))
        if (round.death) set({ phase: 'DEATH', currentEvent: null })
      },

      showDaySummary: () => {
        const { data, run } = get()
        if (!data || !run) return
        // 从生命日志提取当日记录
        const todayLogs = data.lifeLog.filter((l) => l.startsWith(`第${run.daysInCity}天`))
        const actionsTaken = todayLogs
          .map((l) => l.split('｜')[1]?.split('：')[0])
          .filter((x): x is string => !!x && !x.startsWith('事件') && !x.startsWith('你 '))
        const itemsGained: string[] = []
        const npcsMet = todayLogs
          .filter((l) => l.includes('结识'))
          .map((l) => l.split('结识')[1]?.replace(/[（(].*$/, '') ?? '')
          .filter(Boolean)
        set({
          daySummary: {
            day: run.daysInCity,
            actionsTaken: [...new Set(actionsTaken)],
            itemsGained,
            npcsMet: [...new Set(npcsMet)],
            log: todayLogs.join('\n'),
          },
          currentEvent: null,
        })
      },

      confirmDaySummary: () => {
        set({ daySummary: null, currentEvent: null })
        get().startRound()
      },

      performAction: (actionId) => {
        const { data, run, meta } = get()
        if (!data || !run) return
        const action = findAction(actionId)
        if (!action) return
        if (!actionAvailable(data, run, actionId)) return

        // 面板类行动：不消耗资源、不执行结算，直接打开面板
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
        if (actionId === 'market-buy') {
          set({ currentEvent: { kind: 'shop' } })
          return
        }
        if (actionId === 'singularity-exchange') {
          set({ currentEvent: { kind: 'singularity' } })
          return
        }
        if (actionId === 'open-inventory') {
          set({ currentEvent: { kind: 'inventory' } })
          return
        }

        const outcome = executeAction(data, run, actionId)
        if (!outcome) return

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
          const km = `npc-${npc.id}`
          if (!data.keyMoments.includes(km)) data.keyMoments.push(km)
        }

        // 刷新阶段（不再重置 AP——beginRound 统一管理）
        run.stage = currentStage(data, run)

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

        // 随机遭遇（返回真实 NPC id）
        const encounter = rollEncounter(run, action)
        if (encounter !== undefined) {
          set({
            currentEvent: { kind: 'npc', npcId: encounter },
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

      openCompendium: () => {
        set({ currentEvent: { kind: 'compendium' } })
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
        // NPC 互动：标记结识后继续
        const { data, run } = get()
        if (!run) return
        const st = run.npcStates.find((s) => s.id === npcId)
        if (st && !st.met) {
          st.met = true
          st.metLocation = run.locationId
          const km = `npc-${npcId}`
          if (data && !data.keyMoments.includes(km)) data.keyMoments.push(km)
        }
        set({ currentEvent: null })
      },

      resolveEventBranch: (branchId) => {
        const { data, run, meta, currentEvent } = get()
        if (!data || !run || !currentEvent?.event) return
        const ev = currentEvent.event
        const branch = ev.branches?.find((b) => b.id === branchId)
        if (!branch) {
          set({ currentEvent: null })
          return
        }
        // 分支效果
        const branchEffects = { ...(branch.effects ?? {}), ...(ev.effects ?? {}) }
        applyEffects(data, run, branchEffects)
        if (branch.grantTrait && !data.traits.includes(branch.grantTrait)) data.traits.push(branch.grantTrait)
        if (branch.loseTrait) data.traits = data.traits.filter((t) => t !== branch.loseTrait)
        if (branch.setIdentity) data.identity = branch.setIdentity
        if (branch.setAffiliation) data.affiliation = branch.setAffiliation
        if (branch.keyMoment && !data.keyMoments.includes(branch.keyMoment)) data.keyMoments.push(branch.keyMoment)
        if (branch.outcome === 'ego' || branch.outcome === 'distortion' || branch.outcome === 'sin') {
          get().resolveVoiceBranch(branch.outcome)
          return
        }
        if (branch.deathChainId) {
          const d = deathFromChain(branch.deathChainId)
          data.deathCause = d.cause
          data.isAlive = false
          finalizeDeath(data, meta, run)
          set({ death: d, phase: 'DEATH', currentEvent: null })
          return
        }
        const gained = collectAchievements(data, run, meta)
        data.lifeLog = [...data.lifeLog.slice(-300), `第${run.daysInCity}天｜事件·${ev.title}：${branch.text}`]
        set({
          currentEvent: null,
          newlyAchieved: [...get().newlyAchieved, ...gained],
        })
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
