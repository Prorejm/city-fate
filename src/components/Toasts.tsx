import { useUiStore } from '@/stores/uiStore'

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-fadeUp paper-panel px-4 py-3 text-sm ${
            t.kind === 'achievement' ? 'border-gold-400/60' : t.kind === 'danger' ? 'border-blood-400' : ''
          }`}
        >
          <div className={`font-mono text-[10px] ${t.kind === 'achievement' ? 'text-gold-400' : t.kind === 'danger' ? 'text-blood-300' : 'text-ash-500'}`}>
            {t.kind === 'achievement' ? '◆ 成就解锁 ◆' : t.kind === 'danger' ? '◆ 警告 ◆' : '◆ 情报 ◆'}
          </div>
          <div className="mt-1 text-ash-300">{t.text}</div>
        </div>
      ))}
    </div>
  )
}
