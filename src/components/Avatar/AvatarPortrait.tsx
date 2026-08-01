import { useEffect, useRef, useState } from 'react'
import type { CityFateData, RunState } from '@/types'
import { AvatarFallback } from './AvatarFallback'
import { loadAvatarLib, renderAvatar, avatarLibReady, resetAvatar } from '@/lib/avatarAdapter'

export function buildAvatarState(data: CityFateData, run: RunState, expression: string): {
  gender: '男' | '女' | '未知'
  age: number
  physique: number
  expression: string
  mind: 'NORMAL' | 'AWAKE' | 'DISTORTED' | 'SINNED'
  identity: string
  affiliation: string
  sinType?: string
  egoName?: string
} {
  const mind = run.sinType
    ? 'SINNED'
    : data.ego.isAwakened
      ? 'AWAKE'
      : run.distortionFormId || data.ego.distortionProgress >= 60
        ? 'DISTORTED'
        : 'NORMAL'
  return {
    gender: data.gender,
    age: data.age,
    physique: data.stats.physique,
    expression,
    mind,
    identity: data.identity,
    affiliation: data.affiliation,
    sinType: run.sinType,
    egoName: data.ego.egoName || undefined,
  }
}

interface Props {
  data: CityFateData
  run: RunState
  expression?: string
  size?: number
}

export function AvatarPortrait({ data, run, expression = 'normal', size = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const prevKey = useRef('')

  useEffect(() => {
    let alive = true
    loadAvatarLib().then((ok) => {
      if (!alive) return
      setReady(ok && avatarLibReady())
      if (!ok) setFailed(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || failed) return
    if (!ready) return
    const state = buildAvatarState(data, run, expression)
    const key = `${state.gender}|${Math.floor(state.age / 12)}|${state.mind}|${state.identity}|${state.expression}|${state.sinType ?? ''}`
    if (key !== prevKey.current) {
      const ok = renderAvatar(canvas, state)
      if (!ok) setFailed(true)
      prevKey.current = key
    }
  }, [data, run, expression, ready, failed])

  // 立绘切换时的短暂过场
  useEffect(() => {
    resetAvatar()
    return () => resetAvatar()
  }, [])

  if (failed) {
    return (
      <div style={{ width: size, height: size * 1.6 }}>
        <AvatarFallback data={data} run={run} size={size} />
      </div>
    )
  }

  const isChild = data.age < 13
  return (
    <div className="relative" style={{ width: size, height: size * 1.6 }}>
      {ready ? (
        <canvas
          ref={canvasRef}
          width={180}
          height={400}
          className="absolute inset-0 m-auto animate-breathe"
          style={{
            transform: isChild ? 'scale(0.62)' : 'scale(0.92)',
            transformOrigin: 'center bottom',
            filter: run.distortionFormId ? 'hue-rotate(-20deg) saturate(1.4)' : undefined,
          }}
        />
      ) : (
        <AvatarFallback data={data} run={run} size={size} />
      )}
      {data.ego.isAwakened && (
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gold-400/10 blur-2xl" />
      )}
    </div>
  )
}
