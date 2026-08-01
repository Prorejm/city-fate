import { useMemo } from 'react'
import { MAX_AGE } from '@/engine/GameConfig'
import { useGameStore } from '@/stores/gameStore'
import { AvatarPortrait } from '../Avatar/AvatarPortrait'
import { StatBar } from '../Effects'
import { findLocation, findAction, findNpc, findAssociation, findIdentity, PROFESSIONS } from '@/core/data'
import { actionChance } from '@/core/ActionSystem'
import { actionAvailable } from '@/core/LocationSystem'
import { commissionChance } from '@/core/CommissionSystem'
import { XP_THRESHOLDS, canChooseSubclass } from '@/core/ProfessionSystem'
import { formatWealth } from '@/lib/utils'
import type { CurrentEvent } from '@/stores/gameStore'

function StatPanel() {
  const data = useGameStore((s) => s.data)
  const run = useGameStore((s) => s.run)
  if (!data || !run) return null
  const stats = data.stats
  const rows = [
    { key: 'physique' as const, name: '体质', v: stats.physique, color: 'bg-blood-400' },
    { key: 'intelligence' as const, name: '智力', v: stats.intelligence, color: 'bg-gold-400' },
    { key: 'instinct' as const, name: '直觉', v: stats.instinct, color: 'bg-ash-300' },
    { key: 'will' as const, name: '意志', v: stats.will, color: 'bg-blood-300' },
    { key: 'fortune' as const, name: '运道', v: stats.fortune, color: 'bg-gold-500' },
    { key: 'synergy' as const, name: '共鸣', v: stats.synergy, color: 'bg-ash-500' },
  ]
  const stageLabel = { SURVIVAL: '生存期', SETTLED: '立足期', ADVENTURE: '闯荡期' }[run.stage]
  return (
    <div className="paper-panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-ash-500">身体状态</span>
        <span className="rounded bg-blood-500/20 px-2 py-0.5 font-mono text-[10px] text-blood-300">{stageLabel}</span>
      </div>
      <StatBar value={run.health} color="bg-blood-400" label="健康" />
      <div className="h-2" />
      <StatBar value={run.stamina} color="bg-gold-400" label="体力" />
      <div className="h-2" />
      <StatBar value={run.pressure} color="bg-blood-300" label="压力" />
      <div className="h-2" />
      <StatBar value={data.ego.distortionProgress} color="bg-void-600" label="扭曲" />
      <div className="my-3 h-px bg-void-700" />
      <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">六维属性</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between">
            <span className="text-xs text-ash-400">{r.name}</span>
            <span className={`font-mono text-sm ${r.v >= 8 ? 'text-gold-400' : r.v >= 6 ? 'text-ash-300' : 'text-ash-500'}`}>{r.v}</span>
          </div>
        ))}
      </div>
      <div className="my-3 h-px bg-void-700" />
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        <div className="flex justify-between"><span className="text-ash-500">行动点</span><span className="text-ash-300">{run.actionPoints}</span></div>
        <div className="flex justify-between"><span className="text-ash-500">声望</span><span className="text-ash-300">{run.reputation}</span></div>
        <div className="flex justify-between"><span className="text-ash-500">伙食</span><span className="text-ash-300">{run.foodLevel > 0 ? '已进食' : '饥饿'}</span></div>
        <div className="flex justify-between"><span className="text-ash-500">住处</span><span className="text-ash-300">{['桥洞', '廉价房', '公寓', '巢内'][run.shelterLevel]}</span></div>
      </div>
    </div>
  )
}

function ProfessionPanel() {
  const { run, chooseSubclass } = useGameStore()
  if (!run) return null
  const active = PROFESSIONS.filter((p) => (run.professionLevels[p.id] ?? 0) > 0 || (run.professionXp[p.id] ?? 0) > 0)
  if (active.length === 0) return null
  return (
    <div className="paper-panel p-4">
      <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">职业</div>
      <div className="flex flex-col gap-2">
        {active.map((p) => {
          const lv = run.professionLevels[p.id] ?? 0
          const xp = run.professionXp[p.id] ?? 0
          const next = XP_THRESHOLDS[lv] ?? XP_THRESHOLDS[p.maxLevel - 1]
          const subclass = run.subclassChoice[p.id]
          const sc = subclass ? p.subclasses?.find((s) => s.id === subclass) : undefined
          const canChoose = canChooseSubclass(p, run)
          return (
            <div key={p.id} className="border border-void-700 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ash-300">{p.name}</span>
                <span className="font-mono text-[10px] text-gold-400">Lv.{lv}</span>
              </div>
              {canChoose && p.subclasses && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.subclasses.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => chooseSubclass(p.id, s.id)}
                      className="border border-gold-400 px-2 py-0.5 text-[10px] text-gold-400 transition-colors hover:bg-gold-400/15"
                    >
                      选为{s.name}
                    </button>
                  ))}
                </div>
              )}
              {sc && <div className="mt-1 font-mono text-[10px] text-ash-500">子职 · {sc.name}</div>}
              {lv < p.maxLevel && (
                <div className="mt-1">
                  <div className="h-1 w-full bg-void-700">
                    <div
                      className="h-1 bg-gold-400/60"
                      style={{ width: `${Math.min(100, (xp / next) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-0.5 font-mono text-[9px] text-ash-600">
                    {xp}/{next} XP
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LocationPanel() {
  const { data, run, travelTo } = useGameStore()
  if (!data || !run) return null
  const unlocked = run.unlockedLocations.map(findLocation).filter(Boolean)
  return (
    <div className="paper-panel p-4">
      <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">地点</div>
      <div className="mb-2 rounded border border-blood-500/30 bg-blood-500/10 px-2 py-1.5 text-xs text-ash-300">
        {findLocation(run.locationId)?.name}
      </div>
      <div className="flex flex-col gap-1.5">
        {unlocked
          .filter((l) => l!.id !== run.locationId)
          .map((l) => (
            <button
              key={l!.id}
              onClick={() => travelTo(l!.id)}
              disabled={run.stamina < (l?.staminaCost ?? 1)}
              className="border border-void-600 px-2 py-1 text-left text-xs text-ash-400 transition-colors hover:border-gold-400 hover:text-gold-400 disabled:opacity-40"
            >
              {l!.name} <span className="font-mono text-[9px] text-ash-600">体力{l!.staminaCost}</span>
            </button>
          ))}
      </div>
    </div>
  )
}

function ActionPanel() {
  const { data, run, performAction } = useGameStore()
  if (!data || !run) return null
  const loc = findLocation(run.locationId)
  // 当前地点提供的行动 ∩ 已解锁行动（地点的 actions 列表为权威）
  const actionsHere = (loc?.actions ?? [])
    .filter((id) => run.unlockedActions.includes(id))
    .map(findAction)
    .filter((a): a is NonNullable<typeof a> => !!a)
  const available = actionsHere.filter((a) => actionAvailable(data, run, a.id))
  const locked = actionsHere.filter((a) => !actionAvailable(data, run, a.id))

  return (
    <div className="paper-panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-ash-500">行动</span>
        <span className="font-mono text-[10px] text-ash-600">{available.length} 项可用</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {available.map((a) => {
          const chance = Math.round(actionChance(data, a!) * 100)
          return (
            <button
              key={a!.id}
              onClick={() => performAction(a!.id)}
              className="group border border-void-600 px-3 py-2 text-left transition-all hover:border-blood-400 hover:bg-blood-500/10"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-ash-300">{a!.name}</span>
                <span className="font-mono text-[10px] text-ash-500">{chance}%</span>
              </div>
              <div className="text-[10px] text-ash-500">
                {a!.apCost} AP · {a!.staminaCost} 体力
              </div>
            </button>
          )
        })}
        {locked.map((a) => (
          <div key={a!.id} className="border border-void-700 px-3 py-2 text-sm text-void-600 line-through">
            {a!.name}
          </div>
        ))}
        {available.length === 0 && locked.length === 0 && (
          <div className="px-2 py-3 text-center text-xs text-ash-600">此处暂无可用行动</div>
        )}
      </div>
    </div>
  )
}

function ResultModal({ ev }: { ev: CurrentEvent }) {
  const { run, nextEvent, startRound } = useGameStore()
  const result = ev.result
  if (!result) return null
  const isLastAction = (run?.actionPoints ?? 0) <= 0

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-w-lg p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-ash-500">
          {result.success ? '◇ 行动成功 ◇' : '◇ 行动受挫 ◇'}
        </div>
        <p className="mb-4 text-sm leading-relaxed text-ash-300">{result.text}</p>
        <div className="mb-4 flex flex-wrap gap-2 font-mono text-xs">
          {result.gold !== 0 && (
            <span className={`rounded px-2 py-0.5 ${result.gold >= 0 ? 'bg-gold-400/15 text-gold-400' : 'bg-blood-500/15 text-blood-300'}`}>
              {result.gold >= 0 ? '+' : ''}{result.gold} 眼
            </span>
          )}
          {result.unlockedAction && (
            <span className="rounded bg-gold-400/15 px-2 py-0.5 text-gold-400">解锁新行动：{findAction(result.unlockedAction)?.name}</span>
          )}
        </div>
        {isLastAction ? (
          <button
            onClick={startRound}
            className="w-full border border-gold-400 bg-gold-400/10 py-3 font-serifcn tracking-widest text-gold-400 transition-all hover:bg-gold-400/30"
          >
            进入下一天
          </button>
        ) : (
          <button
            onClick={nextEvent}
            className="w-full border border-void-600 py-3 font-serifcn tracking-widest text-ash-400 transition-all hover:border-ash-400 hover:text-ash-300"
          >
            继续行动（剩余 {run?.actionPoints ?? 0} AP）
          </button>
        )}
      </div>
    </div>
  )
}

function NpcModal({ ev }: { ev: CurrentEvent }) {
  const { nextEvent } = useGameStore()
  void ev
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-w-lg p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-gold-400">◆ 偶遇 ◆</div>
        <p className="mb-4 text-sm leading-relaxed text-ash-300">
          你在街头遇到了一个陌生人。后巷的每个人都有自己的故事——和一个价码。
        </p>
        <button
          onClick={nextEvent}
          className="w-full border border-void-600 py-3 font-serifcn tracking-widest text-ash-400 transition-all hover:border-gold-400 hover:text-gold-400"
        >
          继续
        </button>
      </div>
    </div>
  )
}

function StorylineModal({ ev }: { ev: CurrentEvent }) {
  const { nextEvent } = useGameStore()
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-w-lg border-gold-400/40 p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-gold-400">◆ 命运回响 ◆</div>
        <div className="title-serif mb-3 text-lg text-ash-300">{ev.title}</div>
        <p className="mb-4 text-sm leading-relaxed text-ash-300">{ev.text}</p>
        <button
          onClick={nextEvent}
          className="w-full border border-gold-400 py-3 font-serifcn tracking-widest text-gold-400 transition-all hover:bg-gold-400/15"
        >
          继续
        </button>
      </div>
    </div>
  )
}

/** 委托难度色签（废墟图书馆书页配色） */
const TIER_COLORS: Record<string, string> = {
  传闻: 'text-ash-300 border-ash-600',
  都市传说: 'text-ashLight border-ash-400',
  都市恶疾: 'text-blood-300 border-blood-500',
  都市梦魇: 'text-purple-300 border-purple-500',
  都市之星: 'text-gold-400 border-gold-400',
}

function CommissionBoardModal() {
  const { data, run, performCommission, nextEvent } = useGameStore()
  if (!data || !run) return null
  const pool = run.commissionPool
  const fingerMember = data.traits.includes('finger-member') || data.affiliation === '中指' || data.affiliation === '无名指'
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-gold-400">◆ 协会委托板 ◆</div>
        <div className="title-serif mb-1 text-lg text-ash-300">十二协会 · 今日委托</div>
        <div className="mb-4 text-xs text-ash-500">
          阶位：{run.fixerGrade === 0 ? '未入行' : ['九阶', '八阶', '七阶', '六阶', '五阶', '四阶', '三阶', '二阶', '一阶', '色彩级'][run.fixerGrade - 1]} · 累计协会声望：{run.assocTotal}
        </div>
        {fingerMember && (
          <div className="mb-4 rounded border border-blood-500/40 bg-blood-500/10 px-3 py-2 text-xs text-blood-300">
            你已加入手指——协会不再向你发布委托。若想重新入行，你需要离开帮派。
          </div>
        )}
        {pool.length === 0 && (
          <div className="mb-4 rounded border border-void-600 px-3 py-6 text-center text-sm text-ash-500">
            今日委托板空空如也。提升声望后，协会才会把委托交给你。
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          {pool.map((c) => {
            const assoc = findAssociation(c.associationId)
            const chance = Math.round(commissionChance(data, c) * 100)
            return (
              <div key={c.id} className="border border-void-600 bg-void-900/40 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: assoc?.color ?? '#555' }}
                      title={assoc?.name}
                    />
                    <span className="font-mono text-[10px] text-ash-500">{assoc?.name}</span>
                    <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${TIER_COLORS[c.tier] ?? ''}`}>{c.tier}</span>
                  </div>
                  <span className="font-mono text-[10px] text-ash-500">{chance}%</span>
                </div>
                <div className="mb-1 text-sm text-ash-300">{c.name}</div>
                <p className="mb-2 text-xs leading-relaxed text-ash-500">{c.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-gold-400">{formatWealth(c.success.gold)} 眼</span>
                  <button
                    onClick={() => performCommission(c.id)}
                    disabled={fingerMember}
                    className="border border-gold-400 px-3 py-1 text-xs text-gold-400 transition-all hover:bg-gold-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    接单执行
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <button
          onClick={nextEvent}
          className="mt-4 w-full border border-void-600 py-3 font-serifcn tracking-widest text-ash-400 transition-all hover:border-ash-400 hover:text-ash-300"
        >
          离开委托板
        </button>
      </div>
    </div>
  )
}

function CommissionResultModal({ ev }: { ev: CurrentEvent }) {
  const { nextEvent } = useGameStore()
  const res = ev.commissionResult
  if (!res) return null
  const assoc = findAssociation(res.commission.associationId)
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="paper-panel max-w-lg p-6">
        <div className="mb-1 font-mono text-[10px] tracking-widest text-ash-500">
          {res.success ? '◇ 委托完成 ◇' : '◇ 委托失败 ◇'}
        </div>
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: assoc?.color ?? '#555' }} />
          <span className="font-mono text-xs text-ash-500">{assoc?.name} · {res.commission.tier}</span>
        </div>
        <div className="title-serif mb-2 text-lg text-ash-300">{res.commission.name}</div>
        <p className="mb-4 text-sm leading-relaxed text-ash-300">{res.text}</p>
        <div className="mb-4 flex flex-wrap gap-2 font-mono text-xs">
          <span className={`rounded px-2 py-0.5 ${res.gold >= 0 ? 'bg-gold-400/15 text-gold-400' : 'bg-blood-500/15 text-blood-300'}`}>
            {res.gold >= 0 ? '+' : ''}{res.gold} 眼
          </span>
          {res.assocDelta !== 0 && (
            <span className="rounded bg-ash-500/15 px-2 py-0.5 text-ash-400">
              {assoc?.name} 声望 {res.assocDelta >= 0 ? '+' : ''}{res.assocDelta}
            </span>
          )}
          {res.promoted && (
            <span className="rounded bg-gold-400/15 px-2 py-0.5 text-gold-400">
              晋升：{findIdentity(res.promoted)?.name ?? res.promoted}
            </span>
          )}
        </div>
        <button
          onClick={nextEvent}
          className="w-full border border-gold-400 py-3 font-serifcn tracking-widest text-gold-400 transition-all hover:bg-gold-400/15"
        >
          继续
        </button>
      </div>
    </div>
  )
}

function VoiceCrisisModal() {
  const { resolveVoiceBranch } = useGameStore()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="paper-panel max-w-xl border-gold-400/50 p-8">
        <div className="mb-2 text-center font-mono text-xs tracking-[0.4em] text-gold-400">叩 问 自 我</div>
        <p className="mb-6 text-center text-sm leading-relaxed text-ash-300">
          深夜，那个甜美的声音再次响起，清晰得无法忽视：
          <br />
          <span className="text-gold-400">「你愿意，看见真正的自己吗？」</span>
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => resolveVoiceBranch('ego')}
            className="border border-gold-400 px-4 py-3 text-sm text-ash-300 transition-all hover:bg-gold-400/15"
          >
            『我接受我的痛苦，也接受我的罪孽。』——拥抱真实的自己
          </button>
          <button
            onClick={() => resolveVoiceBranch('distortion')}
            className="border border-blood-500 px-4 py-3 text-sm text-ash-300 transition-all hover:bg-blood-500/15"
          >
            『我承受了太多痛苦，罪孽不属于我。』——只承认受害者的自己
          </button>
          <button
            onClick={() => resolveVoiceBranch('sin')}
            className="border border-void-600 px-4 py-3 text-sm text-ash-500 transition-all hover:border-void-500"
          >
            『我不想看到任何真实的自己。』——闭上眼睛，拒绝一切
          </button>
        </div>
      </div>
    </div>
  )
}

function LifeLog() {
  const lifeLog = useGameStore((s) => s.data?.lifeLog)
  const entries = useMemo(() => (lifeLog ?? []).slice(-30), [lifeLog])
  return (
    <div className="paper-panel flex h-full flex-col p-4">
      <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">人生档案</div>
      <div className="scroll-thin min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {entries.map((e, i) => (
          <div key={i} className="border-l border-void-700 pl-3 text-xs leading-relaxed text-ash-400">
            {e}
          </div>
        ))}
      </div>
    </div>
  )
}

function HudHeader() {
  const { data, run, goToMenu } = useGameStore()
  if (!data || !run) return null
  return (
    <div className="paper-panel flex items-center justify-between gap-4 px-5 py-3">
      <div>
        <div className="title-serif text-lg text-ash-300">{data.name}</div>
        <div className="font-mono text-[11px] text-ash-500">
          {data.gender} · {data.identity} · {run.stage === 'SURVIVAL' ? '生存期' : run.stage === 'SETTLED' ? '立足期' : '闯荡期'}
        </div>
      </div>
      <div className="hidden items-center gap-6 md:flex">
        <div className="text-center">
          <div className="font-mono text-xl text-gold-400">{run.daysInCity}</div>
          <div className="font-mono text-[10px] text-ash-500">天数 / {MAX_AGE * 7}</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl text-gold-400">{formatWealth(data.wealth)}</div>
          <div className="font-mono text-[10px] text-ash-500">眼</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl text-gold-400">{run.reputation}</div>
          <div className="font-mono text-[10px] text-ash-500">声望</div>
        </div>
      </div>
      <div className="text-right">
        <div className="mb-1 font-mono text-[11px] text-ash-400">{data.affiliation || '无'}</div>
        <button onClick={goToMenu} className="font-mono text-[11px] text-ash-600 hover:text-blood-300">
          逃离此世
        </button>
      </div>
    </div>
  )
}

export function GameScreen() {
  const { data, run, currentEvent } = useGameStore()
  if (!data || !run) return null
  const expression = currentEvent?.kind === 'event' ? 'fear' : 'normal'
  const egoAwakened = data.ego.isAwakened
  const npcAtLocation = run.npcStates.filter((s) => {
    const npc = findNpc(s.id)
    return npc && npc.locationId === run.locationId && s.met
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-4">
      <HudHeader />

      <div className="grid flex-1 gap-4 lg:grid-cols-[260px_1fr_300px]">
        <div className="flex flex-col gap-4">
          <div className="paper-panel relative flex items-end justify-center overflow-hidden py-3">
            <AvatarPortrait data={data} run={run} expression={expression} size={180} />
            {egoAwakened && (
              <div className="absolute left-2 top-2 rounded bg-gold-400/15 px-2 py-1 font-mono text-[10px] text-gold-400">
                E.G.O · {data.ego.egoName}
              </div>
            )}
            {run.distortionFormId && (
              <div className="absolute left-2 top-2 rounded bg-blood-500/20 px-2 py-1 font-mono text-[10px] text-blood-300">
                扭曲
              </div>
            )}
            {run.sinType && (
              <div className="absolute left-2 top-2 rounded bg-blood-600/30 px-2 py-1 font-mono text-[10px] text-blood-300">
                大罪 · {run.sinType}
              </div>
            )}
          </div>
          <StatPanel />
          <ProfessionPanel />
          <LocationPanel />
        </div>

        <div className="flex flex-col gap-4">
          {/* 当前地点角色 */}
          <div className="paper-panel p-4">
            <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">此地人物</div>
            <div className="flex flex-wrap gap-2">
              {npcAtLocation.length === 0 && <span className="text-xs text-ash-600">没有认识的人在这里</span>}
              {npcAtLocation.map((s) => {
                const npc = findNpc(s.id)
                if (!npc) return null
                return (
                  <div key={s.id} className="flex items-center gap-2 rounded border border-void-600 px-2 py-1">
                    <img
                      src={`${import.meta.env.BASE_URL}avatars/${npc.avatar}`}
                      alt={npc.name}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                    <div>
                      <div className="text-xs text-ash-300">{npc.name}</div>
                      <div className="font-mono text-[9px] text-ash-500">{s.relation} · 好感{s.affinity}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <ActionPanel />
          <div className="flex-1" />
        </div>

        <LifeLog />
      </div>

      {currentEvent?.kind === 'result' && <ResultModal ev={currentEvent} />}
      {currentEvent?.kind === 'npc' && <NpcModal ev={currentEvent} />}
      {currentEvent?.kind === 'storyline' && <StorylineModal ev={currentEvent} />}
      {currentEvent?.kind === 'commission' && <CommissionBoardModal />}
      {currentEvent?.kind === 'commission-result' && <CommissionResultModal ev={currentEvent} />}
      {currentEvent?.kind === 'event' && currentEvent.text === '叩问自我' && <VoiceCrisisModal />}
    </div>
  )
}
