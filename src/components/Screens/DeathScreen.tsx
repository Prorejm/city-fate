import { useMemo } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { Divider } from '../Effects'
import { findIdentity } from '@/core/data'
import { formatWealth } from '@/lib/utils'
import { totalProfessionLevel } from '@/core/ProfessionSystem'

/** 依据一生的经历评定最终称号 */
function finalTitle(data: NonNullable<ReturnType<typeof useGameStore.getState>['data']>, run: NonNullable<ReturnType<typeof useGameStore.getState>['run']>): { title: string; color: string; desc: string } {
  const grade = run.fixerGrade
  const totalLv = totalProfessionLevel(run)
  const done = run.commissionsDone
  const wealth = data.wealth
  const ego = data.ego.isAwakened
  const distorted = !!run.distortionFormId
  const sin = !!run.sinType

  if (sin) return { title: '被罪孽吞噬者', color: 'text-blood-300', desc: '你的灵魂沉入大罪的深渊，成为都市的噩梦之一。' }
  if (distorted) return { title: '扭曲者', color: 'text-blood-400', desc: '你只认痛苦，不认罪孽——扭曲接纳了你。' }
  if (ego) return { title: 'E.G.O 觉醒者', color: 'text-gold-400', desc: '你拥抱了自己的痛苦与罪孽，让光芒化为现实。' }
  if (grade >= 10) return { title: '色彩级收尾人', color: 'text-gold-400', desc: "你的名字被刻进都市的历史——'殷红''靛蓝'之列。" }
  if (grade >= 7) return { title: '一阶收尾人', color: 'text-gold-400', desc: '你站在收尾人金字塔的顶端，受协会与后巷敬畏。' }
  if (totalLv >= 15) return { title: '多面手传奇', color: 'text-purple-300', desc: '你精通多个职业，都市的规则在你手中自如流转。' }
  if (done >= 30) return { title: '协会老手', color: 'text-ash-300', desc: '三十单委托，协会的委托人与你称兄道弟。' }
  if (wealth >= 1000000) return { title: '一区之富', color: 'text-gold-400', desc: '你买得下一条巷。财富本身就是传奇。' }
  if (grade >= 1) return { title: '持证收尾人', color: 'text-ash-300', desc: '你曾在委托板上写下自己的名字，为金钱与情报奔走。' }
  return { title: '第七区无名之辈', color: 'text-ash-500', desc: '都市吞没了你的名字，如同吞没大多数人。' }
}

export function DeathScreen() {
  const { data, run, death, meta, goToCreate, goToMenu } = useGameStore()
  const title = useMemo(() => (data && run ? finalTitle(data, run) : null), [data, run])
  if (!data || !run || !death) return null
  const identity = findIdentity(data.identity)
  const achievements = data.unlockedAchievements.length

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 py-12">
      <div className="paper-panel w-full p-8 text-center">
        <div className="mb-2 font-mono text-xs tracking-[0.5em] text-blood-400">终 局 · 再 次 穿 越</div>
        <h1 className="title-serif mb-6 text-4xl text-ash-300">
          {data.name} · 第 {run.daysInCity} 天
        </h1>
        <div className="mb-2 font-mono text-sm text-blood-300">死因：{death.cause}</div>
        {title && (
          <div className={`mb-6 font-serifcn text-2xl tracking-[0.2em] ${title.color}`}>
            「{title.title}」
          </div>
        )}
        <div className="mx-auto mb-8 max-w-lg border-l-2 border-blood-500/60 pl-4 text-left text-sm italic leading-relaxed text-ash-400">
          {title?.desc ?? death.epitaph}
        </div>

        <Divider />

        <div className="grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">最终身份</div>
            <div className="mt-1 text-sm text-ash-300">{identity?.name ?? data.identity}</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">所属</div>
            <div className="mt-1 text-sm text-ash-300">{data.affiliation || '无'}</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">终年</div>
            <div className="mt-1 text-sm text-ash-300">{data.age} 岁</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">财富</div>
            <div className="mt-1 text-sm text-gold-400">{formatWealth(data.wealth)}</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">委托完成</div>
            <div className="mt-1 text-sm text-ash-300">{run.commissionsDone} 单</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">职业等级</div>
            <div className="mt-1 text-sm text-ash-300">合计 {totalProfessionLevel(run)} 级</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">觉醒 E.G.O</div>
            <div className="mt-1 text-sm text-gold-400">{data.ego.egoName || '无'}</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">特质</div>
            <div className="mt-1 text-sm text-ash-300">{data.traits.length} 项</div>
          </div>
          <div className="rounded border border-void-700 bg-void-950/60 p-3">
            <div className="font-mono text-[10px] text-ash-500">成就</div>
            <div className="mt-1 text-sm text-gold-400">{achievements} 项</div>
          </div>
        </div>

        <Divider />

        {/* 一生编年史：关键时刻时间线 */}
        <div className="mb-2 text-left">
          <div className="mb-2 font-mono text-[10px] tracking-widest text-ash-500">一生编年史</div>
          <div className="scroll-thin flex max-h-44 flex-col gap-1.5 overflow-y-auto pr-1">
            {data.lifeLog.slice(-24).map((e, i) => (
              <div key={i} className="border-l border-void-700 pl-3 text-left text-[11px] leading-relaxed text-ash-400">
                {e}
              </div>
            ))}
          </div>
        </div>

        <Divider />

        <div className="mb-8 flex items-center justify-center gap-10">
          <div>
            <div className="font-mono text-[10px] text-ash-500">累计轮回</div>
            <div className="font-mono text-2xl text-gold-400">{meta.playCount}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-ash-500">累计寿命</div>
            <div className="font-mono text-2xl text-gold-400">{Math.floor(meta.totalLifespan)} 岁</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-ash-500">遗产点</div>
            <div className="font-mono text-2xl text-gold-400">{meta.rebirthPoints}</div>
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={goToCreate}
            className="border border-blood-500 bg-blood-600/20 px-8 py-3 font-serifcn tracking-[0.3em] text-ash-300 transition-all hover:bg-blood-600/50 hover:text-white"
          >
            再次穿越
          </button>
          <button
            onClick={goToMenu}
            className="border border-void-600 px-8 py-3 font-serifcn tracking-[0.3em] text-ash-400 transition-all hover:border-ash-500 hover:text-ash-300"
          >
            返回标题
          </button>
        </div>
      </div>
    </div>
  )
}
