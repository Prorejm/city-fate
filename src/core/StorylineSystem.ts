import type { CityFateData, RunState, StorylineDef } from '@/types'
import { STORYLINES, findStoryline } from './data'
import { getNpcState } from './NpcSystem'

export interface StorylineEvent {
  storyline: StorylineDef
  stageId: string
  text: string
  title: string
  effects?: StorylineDef['stages'][number]['effects']
  reward?: StorylineDef['stages'][number]['reward']
  nextStageId?: string
}

/** 检查所有剧情线的可触发阶段，返回本次推进的剧情事件 */
export function checkStorylines(
  data: CityFateData,
  run: RunState,
  lastActionId?: string,
): StorylineEvent[] {
  const progressed: StorylineEvent[] = []
  for (const sl of STORYLINES) {
    const currentId = run.storylineProgress[sl.id]
    // 找下一个未触发的阶段
    const stage = sl.stages.find((s) => {
      if (currentId) {
        // 若当前进度已有阶段，只允许触发 next 指向的阶段
        const cur = sl.stages.find((x) => x.id === currentId)
        return cur?.next === s.id
      }
      // 未开始：只能触发第一个阶段
      return s.id === sl.stages[0].id
    })
    if (!stage) continue

    const t = stage.trigger
    let triggered = false
    switch (t.type) {
      case 'round':
        triggered = run.roundCount >= (t.round ?? 0)
        break
      case 'action':
        triggered = lastActionId === t.actionId
        break
      case 'npcAffinity': {
        const st = getNpcState(run, t.npcId ?? '')
        triggered = (st?.affinity ?? 0) >= (t.affinity ?? 50)
        break
      }
      case 'storyline':
        triggered = !!run.storylineProgress[t.storylineId ?? '']
        break
      case 'stat':
        triggered = data.stats[t.stat?.attr ?? 'will'] >= (t.stat?.value ?? 8)
        break
      case 'location':
        triggered = run.locationId === t.locationId
        break
    }

    if (triggered) {
      run.storylineProgress[sl.id] = stage.id
      progressed.push({
        storyline: sl,
        stageId: stage.id,
        text: stage.text,
        title: stage.title,
        effects: stage.effects,
        reward: stage.reward,
        nextStageId: stage.next,
      })
      // 奖励
      if (stage.reward?.gold) data.wealth += stage.reward.gold
      if (stage.reward?.trait && !data.traits.includes(stage.reward.trait)) data.traits.push(stage.reward.trait)
      if (stage.reward?.actionId && !run.unlockedActions.includes(stage.reward.actionId)) {
        run.unlockedActions.push(stage.reward.actionId)
      }
    }
  }
  return progressed
}

/** 应用剧情阶段效果（由 store 调用） */
export function applyStorylineEffects(
  data: CityFateData,
  run: RunState,
  effects: StorylineDef['stages'][number]['effects'] | undefined,
): void {
  if (!effects) return
  for (const [k, v] of Object.entries(effects)) {
    if (k === 'physique' || k === 'intelligence' || k === 'instinct' || k === 'will' || k === 'fortune' || k === 'synergy') {
      data.stats[k as keyof typeof data.stats] = Math.max(0, Math.min(10, data.stats[k as keyof typeof data.stats] + (v as number)))
    } else if (k === 'health' || k === 'stamina') {
      run[k] = Math.max(0, Math.min(100, (run[k] as number) + (v as number)))
    } else if (k === 'pressure') {
      run.pressure = Math.max(0, Math.min(100, run.pressure + (v as number)))
    } else if (k === 'reputation') {
      run.reputation = Math.max(0, run.reputation + (v as number))
    } else if (k === 'wealth') {
      data.wealth = Math.max(0, data.wealth + (v as number))
    } else if (k === 'distortion') {
      data.ego.distortionProgress = Math.max(0, Math.min(100, data.ego.distortionProgress + (v as number)))
    }
  }
}

export function allStorylines(): StorylineDef[] {
  return STORYLINES
}

export function storylineById(id: string): StorylineDef | undefined {
  return findStoryline(id)
}
