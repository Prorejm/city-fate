import type { ReactNode } from 'react'

export function GlitchText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`glitch inline-block ${className}`}>{children}</span>
}

export function Divider() {
  return (
    <div className="my-3 flex items-center gap-2">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-void-600 to-transparent" />
      <span className="text-blood-400 text-xs">◆</span>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-void-600 to-transparent" />
    </div>
  )
}

export function StatBar({ value, color, label }: { value: number; color: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="w-14 shrink-0 text-right text-xs text-ash-400">{label}</span>}
      <div className="stat-bar-track">
        <div className={`stat-bar-fill ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <span className="w-8 shrink-0 text-xs tabular-nums text-ash-300">{Math.round(value)}</span>
    </div>
  )
}
