/**
 * 都市·命途 数据校验脚本
 * 校验全部 data/*.json：ID 唯一性、条件引用、效果键、成就条件、事件 ID 段。
 * 用法：node scripts/validate-data.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(root, 'data')

const CORE_ATTRS = ['physique', 'intelligence', 'instinct', 'will', 'fortune', 'synergy']
const EFFECT_KEYS = [...CORE_ATTRS, 'health', 'pressure', 'wealth', 'distortion', 'reputation', 'foodLevel', 'karma']
const OPERATORS = ['>=', '<=', '>', '<', '==']
const ACH_TYPES = ['age', 'stat', 'identity', 'ego', 'distortion', 'sin', 'wealth', 'playCount', 'totalLifespan', 'trait', 'keyMoment', 'deathCause']
const COMMISSION_TIERS = ['传闻', '都市传说', '都市恶疾', '都市梦魇', '都市之星']

const errors = []
const warns = []

function readJson(file) {
  return JSON.parse(readFileSync(join(DATA, file), 'utf8'))
}

function walkConditions(spec, path, check) {
  if (!spec) return
  if (Array.isArray(spec)) {
    spec.forEach((c, i) => walkConditions(c, `${path}[${i}]`, check))
    return
  }
  if (typeof spec !== 'object') {
    errors.push(`${path}: 条件格式非法`)
    return
  }
  if ('op' in spec) {
    if (!['AND', 'OR'].includes(spec.op)) errors.push(`${path}: op 非法 ${spec.op}`)
    walkConditions(spec.conditions, `${path}.conditions`, check)
  } else {
    check(spec, path)
  }
}

function checkConditionKeys(spec, path, label) {
  walkConditions(spec, path, (c) => {
    if (!EFFECT_KEYS.includes(c.attribute)) errors.push(`${path}: ${label} 引用非法属性 '${c.attribute}'`)
    if (!OPERATORS.includes(c.operator)) errors.push(`${path}: ${label} 操作符非法 '${c.operator}'`)
    if (typeof c.value !== 'number') errors.push(`${path}: ${label} value 非数值`)
  })
}

// ---------- 事件校验 ----------
const eventFiles = readdirSync(join(DATA, 'events')).filter((f) => f.endsWith('.json'))
const allEvents = []
const seenIds = new Set()
const segments = [
  ['child', [0, 99]],
  ['teen', [100, 199]],
  ['adult', [200, 299]],
  ['mid', [300, 399]],
  ['elder', [400, 499]],
  ['ancients', [500, 599]],
  ['backalley', [600, 699]],
  ['nest', [700, 799]],
  ['fixer', [800, 899]],
  ['finger', [900, 999]],
  ['assoc', [1000, 1099]],
  ['abno', [1100, 1199]],
  ['special', [1200, 1399]],
  ['voice', [9000, 9299]],
  ['death', [9500, 9999]],
]

for (const file of eventFiles) {
  const list = readJson(`events/${file}`)
  if (!Array.isArray(list)) {
    errors.push(`events/${file}: 必须是数组`)
    continue
  }
  for (const ev of list) {
    if (seenIds.has(ev.id)) errors.push(`事件 ID 重复: ${ev.id}`)
    seenIds.add(ev.id)
    allEvents.push(ev)
    if (!ev.title || !ev.description) errors.push(`事件 ${ev.id}: 缺少 title/description`)
    if (ev.type !== 'voice' && ev.type !== 'death' && (!ev.branches || ev.branches.length === 0)) {
      errors.push(`事件 ${ev.id}: 缺少分支`)
    }
    checkConditionKeys(ev.conditions, `事件${ev.id}.conditions`, '条件')
    for (const [k] of Object.entries(ev.effects ?? {})) {
      if (!EFFECT_KEYS.includes(k)) errors.push(`事件 ${ev.id}: 效果键非法 '${k}'`)
    }
    for (const b of ev.branches ?? []) {
      checkConditionKeys(b.conditions, `事件${ev.id}.分支${b.id}.conditions`, '条件')
      for (const [k] of Object.entries(b.effects ?? {})) {
        if (!EFFECT_KEYS.includes(k)) errors.push(`事件 ${ev.id} 分支 ${b.id}: 效果键非法 '${k}'`)
      }
      if (b.outcome && !['ego', 'distortion', 'sin'].includes(b.outcome)) {
        errors.push(`事件 ${ev.id} 分支 ${b.id}: outcome 非法 '${b.outcome}'`)
      }
    }
  }
}

// 事件 ID 段检查
for (const ev of allEvents) {
  const seg = segments.find(([name]) => name === ev.type)
  if (!seg) {
    warns.push(`事件 ${ev.id}: 未知类型 ${ev.type}`)
    continue
  }
  const [name, [lo, hi]] = seg
  if (ev.id < lo || ev.id > hi) warns.push(`事件 ${ev.id}: 类型 ${name} 建议 ID 落在 [${lo},${hi}]`)
}

// 各年龄池非空
for (const [name] of segments) {
  const cnt = allEvents.filter((e) => e.type === name).length
  if (name !== 'voice' && name !== 'death' && cnt === 0) errors.push(`事件类型 ${name} 为空`)
}

// ---------- 成就校验 ----------
const achievements = readJson('achievements.json')
for (const a of achievements) {
  if (!ACH_TYPES.includes(a.condition.type)) errors.push(`成就 ${a.id}: condition.type 非法 '${a.condition.type}'`)
  if (a.condition.type === 'stat' && !CORE_ATTRS.includes(a.condition.attr)) {
    errors.push(`成就 ${a.id}: attr 非法 '${a.condition.attr}'`)
  }
}

// ---------- 其它 JSON ----------
for (const f of ['origins.json', 'talents.json', 'ego.json', 'distortions.json', 'sins.json', 'identities.json', 'deaths.json']) {
  const list = readJson(f)
  const ids = new Set()
  for (const item of list) {
    if (item.id && ids.has(item.id)) errors.push(`${f}: ID 重复 ${item.id}`)
    if (item.id) ids.add(item.id)
    checkConditionKeys(item.trigger, `${f}.trigger`, '触发条件')
    for (const [k] of Object.entries(item.effects ?? {})) {
      if (!EFFECT_KEYS.includes(k)) errors.push(`${f} ${item.id ?? ''}: 效果键非法 '${k}'`)
    }
    for (const [k] of Object.entries(item.sideEffects ?? {})) {
      if (!['health', 'will', 'physique', 'synergy', 'instinct', 'intelligence'].includes(k)) {
        errors.push(`${f} ${item.id ?? ''}: 副作用键非法 '${k}'`)
      }
    }
  }
}

// 成就引用的身份必须存在于 identities.json
const identityIds = new Set(readJson('identities.json').map((i) => i.id))
for (const a of achievements) {
  if (a.condition.type === 'identity' && !identityIds.has(a.condition.value)) {
    errors.push(`成就 ${a.id}: 引用未知身份 '${a.condition.value}'`)
  }
}

// 结局 outcome 引用的 EGO/扭曲库非空
if (readJson('ego.json').length === 0) errors.push('ego.json 为空')
if (readJson('sins.json').length !== 7) errors.push(`sins.json 应有 7 条大罪，实际 ${readJson('sins.json').length}`)

// ---------- 协会与委托校验 ----------
const associations = readJson('associations.json')
const assocIds = new Set()
for (const a of associations) {
  if (assocIds.has(a.id)) errors.push(`associations.json: ID 重复 ${a.id}`)
  assocIds.add(a.id)
  for (const t of a.tiers ?? []) {
    if (!COMMISSION_TIERS.includes(t)) errors.push(`协会 ${a.id}: 难度非法 '${t}'`)
  }
}
if (associations.length !== 12) errors.push(`associations.json 应有 12 协会，实际 ${associations.length}`)

const commissions = readJson('commissions.json')
const cmIds = new Set()
for (const c of commissions) {
  if (cmIds.has(c.id)) errors.push(`commissions.json: ID 重复 ${c.id}`)
  cmIds.add(c.id)
  if (!assocIds.has(c.associationId)) errors.push(`委托 ${c.id}: 引用未知协会 '${c.associationId}'`)
  if (!COMMISSION_TIERS.includes(c.tier)) errors.push(`委托 ${c.id}: 难度非法 '${c.tier}'`)
  for (const side of ['success', 'fail']) {
    for (const [k] of Object.entries(c[side].effects ?? {})) {
      if (!EFFECT_KEYS.includes(k)) errors.push(`委托 ${c.id}.${side}: 效果键非法 '${k}'`)
    }
  }
}
if (commissions.length < 20) errors.push(`commissions.json 委托模板偏少（${commissions.length}）`)

// ---------- NPC 头像存在性 ----------
const npcs = readJson('npcs.json')
for (const n of npcs) {
  const avatarPath = join(root, 'public', 'avatars', n.avatar)
  try {
    statSync(avatarPath)
  } catch {
    errors.push(`NPC ${n.id}: 头像文件缺失 public/avatars/${n.avatar}`)
  }
}

// ---------- 物品校验 ----------
const items = readJson('items.json')
const itemIds = new Set()
for (const it of items) {
  if (itemIds.has(it.id)) errors.push(`items.json: ID 重复 ${it.id}`)
  itemIds.add(it.id)
  if (!['weapon', 'armor', 'consumable', 'relic'].includes(it.category)) {
    errors.push(`物品 ${it.id}: category 非法 '${it.category}'`)
  }
  if (!['white', 'green', 'blue', 'purple', 'gold'].includes(it.quality)) {
    errors.push(`物品 ${it.id}: quality 非法 '${it.quality}'`)
  }
  for (const [k] of Object.entries(it.effects ?? {})) {
    if (!EFFECT_KEYS.includes(k)) errors.push(`物品 ${it.id}: 效果键非法 '${k}'`)
  }
}
if (items.length < 20) errors.push(`items.json 物品偏少（${items.length}）`)

console.log(`校验完成：事件 ${allEvents.length} 条 / 成就 ${achievements.length} 条 / 协会 ${associations.length} 个 / 委托 ${commissions.length} 条 / 物品 ${items.length} 件`)
if (warns.length) {
  console.log(`\n⚠ 警告 ${warns.length} 条：`)
  warns.forEach((w) => console.log('  -', w))
}
if (errors.length) {
  console.log(`\n✗ 错误 ${errors.length} 条：`)
  errors.slice(0, 50).forEach((e) => console.log('  -', e))
  process.exit(1)
} else {
  console.log('✓ 数据全部合法')
}
