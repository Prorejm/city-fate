export type Phase =
  | 'MENU'
  | 'CREATE'
  | 'ALLOCATE'
  | 'PLAYING'
  | 'EGO_AWAKEN'
  | 'DISTORTION'
  | 'DEATH'

export const PHASE_ORDER: Phase[] = [
  'MENU',
  'CREATE',
  'ALLOCATE',
  'PLAYING',
  'EGO_AWAKEN',
  'DISTORTION',
  'DEATH',
]

export function isValidPhase(p: string): p is Phase {
  return (PHASE_ORDER as string[]).includes(p)
}
