/**
 * dynamic-avatar-drawer (LGPL v3) 适配器 —— 唯一接触 da.js 的模块。
 * 若库的 API 与预期不符，只修改本文件；其余模块不受影响。
 */
import type { Gender } from '@/types'

export type AvatarMind = 'NORMAL' | 'AWAKE' | 'DISTORTED' | 'SINNED'

export interface AvatarState {
  gender: Gender
  age: number
  physique: number
  expression: string
  mind: AvatarMind
  identity: string
  affiliation: string
  sinType?: string
  egoName?: string
}

interface DaGlobal {
  __version__?: string
  loaded: boolean
  load: () => Promise<void>
  loadMods: () => void
  Player: new (config: Record<string, unknown>) => PlayerInstance
  Expression: Record<string, unknown>
  draw: (player: PlayerInstance, canvas: HTMLCanvasElement, config: Record<string, unknown>) => void
  Jacket: new (opts?: Record<string, unknown>) => unknown
  LooseJacket: new (opts?: Record<string, unknown>) => unknown
  DressShirt: new (opts?: Record<string, unknown>) => unknown
  Sweater: new (opts?: Record<string, unknown>) => unknown
  Tee: new (opts?: Record<string, unknown>) => unknown
  LongTightPants: new (opts?: Record<string, unknown>) => unknown
  ShortTightPants: new (opts?: Record<string, unknown>) => unknown
  ShortPants: new (opts?: Record<string, unknown>) => unknown
  LongPants: new (opts?: Record<string, unknown>) => unknown
  NeckTie: new (opts?: Record<string, unknown>) => unknown
  Glasses: new (opts?: Record<string, unknown>) => unknown
  SimpleCap: new (opts?: Record<string, unknown>) => unknown
  FlatShoes: new (opts?: Record<string, unknown>) => unknown
  ClosedToePumps: new (opts?: Record<string, unknown>) => unknown
  Cuirass: new (opts?: Record<string, unknown>) => unknown
  Armor: new (opts?: Record<string, unknown>) => unknown
}

interface PlayerInstance {
  Mods: Record<string, number>
  fem: number
  skeleton: string
  wearClothing: (c: unknown) => void
  removeAllClothing: () => void
  applyExpression: (e: unknown) => void
  wieldItem: (i: unknown) => void
  removeItem: (i: unknown) => void
  [key: string]: unknown
}

let da: DaGlobal | null = null
let player: PlayerInstance | null = null
let loadedFlag = false
let loadPromise: Promise<boolean> | null = null
let rafId = 0

/** 动态加载 da.js 脚本并等待资源就绪 */
export function loadAvatarLib(): Promise<boolean> {
  if (loadPromise) return loadPromise
  loadPromise = new Promise<boolean>((resolve) => {
    const w = window as unknown as { da?: DaGlobal }
    if (w.da) {
      da = w.da
      finishInit(da).then(resolve)
      return
    }
    const script = document.createElement('script')
    script.src = import.meta.env.BASE_URL + 'vendor/da/da.js'
    script.onload = () => {
      da = w.da ?? null
      if (!da) {
        resolve(false)
        return
      }
      finishInit(da).then(resolve)
    }
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
  return loadPromise
}

async function finishInit(lib: DaGlobal): Promise<boolean> {
  try {
    await lib.load()
    lib.loadMods()
    loadedFlag = lib.loaded
    return loadedFlag
  } catch {
    return false
  }
}

export function avatarLibReady(): boolean {
  return loadedFlag
}

const COLOR = {
  ash: 0x33333d,
  ashLight: 0x4a4a55,
  blood: 0x7d1717,
  bone: 0xd9d9d9,
  gold: 0xc09a3f,
  void: 0x16161a,
  white: 0xf0f0f0,
  fingerThumb: 0x8a1f1f,
  fingerIndex: 0xd8d8d8,
  fingerMiddle: 0x5a3a6e,
  fingerRing: 0x2a4a6e,
  fingerPinky: 0x6e8a3a,
}

function clothingFor(state: AvatarState): unknown[] {
  const out: unknown[] = []
  if (!da) return out
  const id = state.identity
  const aff = state.affiliation
  const mind = state.mind
  try {
    const top =
      id.startsWith('fixer') || aff.includes('协会')
        ? new da.Jacket({ color: mind === 'DISTORTED' ? COLOR.blood : COLOR.ash })
        : aff.includes('翼') || id === 'wing-feather' || id === 'wing-executive'
          ? new da.DressShirt({ color: COLOR.white })
          : aff.includes('拇指')
            ? new da.Jacket({ color: COLOR.fingerThumb })
            : aff.includes('食指')
              ? new da.Jacket({ color: COLOR.fingerIndex })
              : aff.includes('中指')
                ? new da.Jacket({ color: COLOR.fingerMiddle })
                : aff.includes('图书馆') || id === 'librarian'
                  ? new da.LooseJacket({ color: COLOR.void })
                  : id === 'limbus-manager'
                    ? new da.Jacket({ color: COLOR.ash })
                    : mind === 'DISTORTED' || mind === 'SINNED'
                      ? new da.Sweater({ color: COLOR.blood })
                      : new da.Tee({ color: COLOR.ash })
    out.push(top)
    const pants = new da.LongTightPants({ color: mind === 'SINNED' ? COLOR.void : COLOR.ashLight })
    out.push(pants)
    if (id === 'wing-feather' || id === 'wing-executive') out.push(new da.NeckTie({ color: COLOR.blood }))
    if (id === 'fixer-color') out.push(new da.NeckTie({ color: COLOR.gold }))
    if (mind === 'AWAKE') out.push(new da.Cuirass({ color: COLOR.gold }))
    if (state.sinType) out.push(new da.Glasses({ color: COLOR.void }))
    if (id === 'limbus-manager') out.push(new da.SimpleCap({ color: COLOR.void }))
    const shoes = state.gender === '女' ? new da.ClosedToePumps({ color: COLOR.void }) : new da.FlatShoes({ color: COLOR.void })
    out.push(shoes)
  } catch {
    /* 服装失败不影响整体 */
  }
  return out
}

function expressionKey(state: AvatarState): string {
  if (state.mind === 'DISTORTED') return 'angry'
  if (state.mind === 'SINNED') return 'suspicious'
  if (state.mind === 'AWAKE') return 'bliss'
  const e = state.expression
  if (e === 'cry' || e === 'sad' || e === 'funeral' || e === 'lonely') return 'sad'
  if (e === 'angry' || e === 'war' || e === 'gang-war' || e === 'danger') return 'angry'
  if (e === 'fear' || e === 'afraid' || e === 'horror' || e === 'sweeper' || e === 'night') return 'surprised'
  if (e === 'love' || e === 'happy' || e === 'family' || e === 'friends' || e === 'calm') return 'happy'
  if (e === 'sleepy' || e === 'drug' || e === 'smoke') return 'sleepy'
  if (e === 'mischief' || e === 'casino' || e === 'gamble') return 'mischievous'
  return 'neutral'
}

function buildPlayer(state: AvatarState): PlayerInstance | null {
  if (!da) return null
  try {
    const p = new da.Player({
      name: 'citizen',
      fem: state.gender === '女' ? 9 : state.gender === '男' ? 2 : 5,
      skeleton: 'human',
    })
    // 外貌参数：肤色（灰白）、瞳色（血红/金）
    p.Mods.skinHue = 20
    p.Mods.skinSaturation = state.mind === 'DISTORTED' ? 45 : 12
    p.Mods.skinLightness = state.mind === 'SINNED' ? 35 : 55
    p.Mods.irisHue = state.mind === 'AWAKE' ? 40 : state.mind === 'DISTORTED' ? 0 : 30
    p.Mods.irisSaturation = state.mind === 'AWAKE' ? 70 : 45
    p.Mods.irisLightness = 18
    // 体质映射为体型：身材参数（尝试设置，失败忽略）
    const bulk = 0.35 + (state.physique / 10) * 0.5
    p.Mods.cheekFullness = (bulk - 0.5) * 20
    p.Mods.eyeWidth = 2
    p.Mods.browTilt = state.mind === 'DISTORTED' ? -8 : state.mind === 'AWAKE' ? 8 : 5
    p.applyExpression(da.Expression[expressionKey(state)] ?? da.Expression.neutral)
    return p
  } catch {
    return null
  }
}

/** 创建/更新立绘并绘制到 canvas */
export function renderAvatar(canvas: HTMLCanvasElement, state: AvatarState): boolean {
  if (!da || !loadedFlag) return false
  try {
    if (!player) {
      player = buildPlayer(state)
      if (!player) return false
    }
    player.removeAllClothing()
    for (const c of clothingFor(state)) player.wearClothing(c)
    player.applyExpression(da.Expression[expressionKey(state)] ?? da.Expression.neutral)
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    da.draw(
      player,
      canvas,
      {
        nameColor: '#00000000',
        genderColor: '#00000000',
        heightColor: '#00000000',
        heightBarColor: '#00000000',
        backgroundColor: '#16161a',
        transparentBackground: false,
        printAdditionalInfo: false,
        printVitals: false,
        printHeight: false,
        renderShoeSideView: true,
      },
    )
    return true
  } catch {
    return false
  }
}

export function resetAvatar(): void {
  player = null
}

/** 渐变过渡：在 duration 毫秒内把 mods 从 from 平滑过渡到 to（每帧重绘） */
export function tweenAvatar(canvas: HTMLCanvasElement, from: AvatarState, to: AvatarState, duration = 400, onDone?: () => void): void {
  cancelAnimationFrame(rafId)
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    // 简化：混合表达式与立绘状态
    const mixed: AvatarState = {
      ...to,
      expression: t < 0.5 ? from.expression : to.expression,
      mind: t < 0.5 ? from.mind : to.mind,
    }
    renderAvatar(canvas, mixed)
    if (t < 1) {
      rafId = requestAnimationFrame(step)
    } else {
      renderAvatar(canvas, to)
      onDone?.()
    }
  }
  rafId = requestAnimationFrame(step)
}
