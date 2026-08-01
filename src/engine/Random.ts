/** 随机工具：Mulberry32 种子随机 + 加权选择 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 按权重随机选一项，返回下标；全 0 权重返回 -1 */
export function weightedRandom<T>(items: T[], weight: (item: T, index: number) => number, rand: () => number = Math.random): number {
  const weights = items.map((it, i) => Math.max(0, weight(it, i)))
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return -1
  let roll = rand() * total
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return i
  }
  return weights.length - 1
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function pickN<T>(arr: T[], n: number, rand: () => number = Math.random): T[] {
  return shuffle(arr, rand).slice(0, n)
}

export function chance(p: number, rand: () => number = Math.random): boolean {
  return rand() < p
}

/** 在 [min,max] 闭区间内随机整数 */
export function randInt(min: number, max: number, rand: () => number = Math.random): number {
  return Math.floor(rand() * (max - min + 1)) + min
}
