export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function uid(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function formatWealth(n: number): string {
  if (n >= 1_0000_0000) return (n / 1_0000_0000).toFixed(1) + '亿眼'
  if (n >= 1_0000) return (n / 1_0000).toFixed(1) + '万眼'
  return n + '眼'
}

/** 都市风格随机名 */
const SURNAMES = ['韩', '白', '李', '金', '崔', '郑', '姜', '柳', '安', '沈', '尹', '许', '文', '秦', '苏', '罗']
const GIVEN = ['启', '翎', '烬', '澜', '曦', '默', '砚', '恪', '冽', '昭', '珩', '弦', '岑', '弈', '杳', '凛', '濯', '雾']
export function randomName(rand: () => number = Math.random): string {
  const s = SURNAMES[Math.floor(rand() * SURNAMES.length)]
  const g1 = GIVEN[Math.floor(rand() * GIVEN.length)]
  return s + g1 + GIVEN[Math.floor(rand() * GIVEN.length)]
}

export function truncate(arr: string[], max: number): string[] {
  return arr.length > max ? arr.slice(arr.length - max) : arr
}
