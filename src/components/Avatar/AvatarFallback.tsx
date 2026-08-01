import type { CityFateData, RunState } from '@/types'
import { buildAvatarState } from './AvatarPortrait'

interface Props {
  data: CityFateData
  run: RunState
  size?: number
}

/** da.js 加载失败时的静态 SVG 立绘（程序化剪影） */
export function AvatarFallback({ data, run, size = 220 }: Props) {
  const state = buildAvatarState(data, run, 'normal')
  const isChild = data.age < 13
  const distorted = state.mind === 'DISTORTED'
  const sinned = state.mind === 'SINNED'
  const awake = state.mind === 'AWAKE'
  const skin = sinned ? '#3a3a3f' : distorted ? '#8a5a5a' : '#b8b0a8'
  const cloth = distorted ? '#5c1010' : state.identity.includes('fixer') ? '#33333d' : '#2a2a30'

  return (
    <svg
      viewBox="0 0 100 160"
      width={size}
      height={size * 1.6}
      className="animate-breathe"
      style={{ filter: 'drop-shadow(0 0 18px rgba(0,0,0,0.8))' }}
    >
      <rect width="100" height="160" fill="#16161a" />
      {awake && <circle cx="50" cy="80" r="46" fill="#c09a3f" opacity="0.25" />}
      {/* 身体 */}
      <rect x="38" y="78" width="24" height="52" rx="10" fill={cloth} />
      {/* 头 */}
      <circle cx="50" cy="52" r={isChild ? 12 : 15} fill={skin} />
      {/* 眼睛 */}
      <circle cx="45" cy="50" r={sinned || distorted ? 2.4 : 2} fill={sinned ? '#8a1f1f' : awake ? '#c09a3f' : '#1c1c21'} />
      <circle cx="55" cy="50" r={sinned || distorted ? 2.4 : 2} fill={sinned ? '#8a1f1f' : awake ? '#c09a3f' : '#1c1c21'} />
      {/* 嘴 */}
      {distorted ? (
        <path d="M42 62 Q50 70 58 62" stroke="#5c1010" strokeWidth="1.5" fill="none" />
      ) : (
        <path d="M45 60 Q50 65 55 60" stroke={sinned ? '#8a1f1f' : '#6b6b6b'} strokeWidth="1.4" fill="none" />
      )}
      {/* 头发 */}
      <path d={`M${50 - 16} 52 Q${50 - 17} ${isChild ? 26 : 22} ${50} ${isChild ? 24 : 20} Q${50 + 17} ${isChild ? 26 : 22} ${50 + 16} 52`} fill="#1c1c21" />
      {awake && <path d="M30 60 Q50 40 70 60" stroke="#c09a3f" strokeWidth="1.6" fill="none" opacity="0.8" />}
      {/* 手臂 */}
      <rect x="30" y="84" width="7" height="26" rx="3" fill={cloth} />
      <rect x="63" y="84" width="7" height="26" rx="3" fill={cloth} />
      {distorted && (
        <path d="M28 96 Q18 104 22 118 Q26 130 34 126" stroke="#5c1010" strokeWidth="3" fill="none" />
      )}
      {/* 腿 */}
      <rect x="40" y="128" width="8" height="22" rx="3" fill={cloth} />
      <rect x="52" y="128" width="8" height="22" rx="3" fill={cloth} />
    </svg>
  )
}
