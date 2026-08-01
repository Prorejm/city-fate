import type { NpcDef, NpcRelation, NpcState, RunState } from '@/types'
import { NPCS, findNpc } from './data'

export function relationFor(affinity: number): NpcRelation {
  if (affinity >= 60) return '恋人'
  if (affinity >= 40) return '盟友'
  if (affinity >= 15) return '熟人'
  if (affinity < 0) return '仇敌'
  return '路人'
}

/** 初始化 NPC 状态 */
export function initNpcStates(run: RunState): NpcState[] {
  return NPCS.map((n) => ({
    id: n.id,
    affinity: n.affinity,
    relation: relationFor(n.affinity),
    met: n.locationId === run.locationId,
    metLocation: n.locationId === run.locationId ? run.locationId : '',
  }))
}

/** 进入地点时结识该地点的 NPC */
export function meetNpcsAtLocation(run: RunState, locationId: string): NpcDef[] {
  const newly: NpcDef[] = []
  for (const npc of NPCS) {
    if (npc.locationId !== locationId) continue
    const st = run.npcStates.find((s) => s.id === npc.id)
    if (st && !st.met) {
      st.met = true
      st.metLocation = locationId
      newly.push(npc)
    }
  }
  return newly
}

/** 调整 NPC 好感（带关系更新） */
export function adjustAffinity(run: RunState, npcId: string, delta: number): { state: NpcState; newRelation: NpcRelation } | null {
  const st = run.npcStates.find((s) => s.id === npcId)
  if (!st) return null
  st.affinity = Math.max(-100, Math.min(100, st.affinity + delta))
  st.relation = relationFor(st.affinity)
  return { state: st, newRelation: st.relation }
}

/** 获取当前地点的 NPC（已结识） */
export function npcsAt(run: RunState, locationId: string): NpcState[] {
  return run.npcStates.filter((s) => {
    const npc = findNpc(s.id)
    return npc && npc.locationId === locationId && s.met
  })
}

export function npcDefOf(id: string): NpcDef | undefined {
  return findNpc(id)
}

export function getNpcState(run: RunState, npcId: string): NpcState | undefined {
  return run.npcStates.find((s) => s.id === npcId)
}

export function cityFateNpcList(): NpcDef[] {
  return NPCS
}
