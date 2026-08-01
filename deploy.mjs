/**
 * 都市·命途 部署脚本（无本地 git，纯 GitHub REST API）
 *
 * 流程：
 *   1. npm run build 构建 dist/
 *   2. 创建/复用公开仓库 city-fate
 *   3. 通过 Git Data API 将源码推送到 main 分支
 *   4. 将 dist/ 推送到 gh-pages 分支
 *   5. 启用 GitHub Pages（source: gh-pages /）
 *
 * 用法（Node 18+，无需任何第三方依赖）：
 *   $env:GH_PAT = 'ghp_xxx'   # 绝不写入任何项目文件
 *   node deploy.mjs
 *
 * 若运行环境存在企业级代理导致 TLS 证书校验失败（UNABLE_TO_VERIFY_LEAF_SIGNATURE），
 * 可临时降级证书校验运行：
 *   $env:NODE_TLS_REJECT_UNAUTHORIZED = '0'; node deploy.mjs
 *
 * PAT 需具备 repo 权限（public_repo 亦可）。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)))
const OWNER = process.env.GH_OWNER ?? 'Prorejm'
const REPO = 'city-fate'
const API = 'https://api.github.com'
const TOKEN = process.env.GH_PAT
const BRANCH = 'main'

if (!TOKEN) {
  console.error('[错误] 未设置 GH_PAT 环境变量。')
  console.error('  用法：$env:GH_PAT = "ghp_xxx"; node deploy.mjs')
  process.exit(1)
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'city-fate-deploy',
}

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!res.ok) {
    return { ok: false, status: res.status, data }
  }
  return { ok: true, status: res.status, data }
}

async function getRef(repo, branch) {
  const r = await api('GET', `/repos/${OWNER}/${repo}/git/ref/heads/${branch}`)
  return r.ok ? r.data : null
}

async function getRepo() {
  const r = await api('GET', `/repos/${OWNER}/${REPO}`)
  return r.ok ? r.data : null
}

/** 收集目录下全部文件（相对路径 → 绝对路径） */
function collectFiles(dir, prefix = '') {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const rel = prefix ? `${prefix}/${name}` : name
    if (name === 'node_modules' || name === 'dist' || name === '.git') continue
    if (/^test_.*\.png$/.test(name)) continue
    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full, rel))
    } else {
      out.push({ rel, full })
    }
  }
  return out
}

/** 获取仓库全部分支引用（判断是否为空仓库） */
async function listRefs() {
  const r = await api('GET', `/repos/${OWNER}/${REPO}/git/refs`)
  return r.ok ? r.data : []
}

/** 空仓库引导：通过 Contents API 创建首个提交，使 Git Data API 可用 */
async function bootstrapEmptyRepo() {
  const refs = await listRefs()
  if (refs.length > 0) return false
  console.log('  ⚠ 仓库为空，创建引导提交 ...')
  const r = await api('PUT', `/repos/${OWNER}/${REPO}/contents/.gitkeep`, {
    message: 'chore: 初始化仓库',
    content: Buffer.from('').toString('base64'),
  })
  if (!r.ok) {
    console.error('[错误] 引导提交失败:', r.status, JSON.stringify(r.data).slice(0, 300))
    process.exit(1)
  }
  return true
}

/** 通过 Git Data API 将一组文件推送到指定分支（整树替换） */
async function pushTree(files, branch, message) {
  const existing = await getRef(REPO, branch)

  // 上传 blob
  const blobs = []
  for (const f of files) {
    const content = readFileSync(f.full)
    const r = await api('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
      content: content.toString('base64'),
      encoding: 'base64',
    })
    if (!r.ok) {
      console.error(`[错误] 上传 blob 失败 ${f.rel}: ${r.status}`, JSON.stringify(r.data).slice(0, 300))
      process.exit(1)
    }
    blobs.push({ path: f.rel, sha: r.data.sha })
  }

  // 构造 tree（base_tree 取该分支当前树；若不存分支，则用空树实现"孤儿"提交）
  let baseTree = null
  let parentSha = null
  if (existing) {
    baseTree = existing.object.sha
    parentSha = existing.object.sha
  } else {
    const empty = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, { tree: [] })
    if (empty.ok) baseTree = empty.data.sha
    // 若仓库已有 main 提交，作为父提交，保证 gh-pages 有历史
    const mainRef = await getRef(REPO, BRANCH)
    if (mainRef) parentSha = mainRef.object.sha
  }

  const treeRes = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
    base_tree: baseTree,
    tree: blobs.map((b) => ({ path: b.path, mode: '100644', type: 'blob', sha: b.sha })),
  })
  if (!treeRes.ok) {
    console.error('[错误] 创建 tree 失败:', treeRes.status, JSON.stringify(treeRes.data).slice(0, 300))
    process.exit(1)
  }

  const commitRes = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message,
    tree: treeRes.data.sha,
    parents: parentSha ? [parentSha] : [],
  })
  if (!commitRes.ok) {
    console.error('[错误] 创建 commit 失败:', commitRes.status, JSON.stringify(commitRes.data).slice(0, 300))
    process.exit(1)
  }

  // 更新分支引用
  const refPath = existing ? `/repos/${OWNER}/${REPO}/git/refs/heads/${branch}` : `/repos/${OWNER}/${REPO}/git/refs`
  const refBody = existing
    ? { sha: commitRes.data.sha, force: true }
    : { ref: `refs/heads/${branch}`, sha: commitRes.data.sha }
  const refRes = await api(existing ? 'PATCH' : 'POST', refPath, refBody)
  if (!refRes.ok) {
    console.error(`[错误] 更新分支 ${branch} 失败:`, refRes.status, JSON.stringify(refRes.data).slice(0, 300))
    process.exit(1)
  }
  console.log(`  ✓ ${branch} <- ${files.length} 个文件 (commit ${commitRes.data.sha.slice(0, 7)})`)
}

async function main() {
  // 0. 校验 token
  const me = await api('GET', '/user')
  if (!me.ok) {
    console.error('[错误] PAT 无效或权限不足:', me.status)
    process.exit(1)
  }
  const actualOwner = me.data.login
  console.log(`[0/5] 认证成功：${actualOwner}`)

  // 1. 构建
  console.log('[1/5] 构建 dist/ ...')
  // 由调用方先执行 npm run build；此处仅校验
  const distDir = join(ROOT, 'dist')
  if (!statSync(distDir, { throwIfNoEntry: false })?.isDirectory?.()) {
    console.error('[错误] dist/ 不存在，请先执行 npm run build')
    process.exit(1)
  }

  // 2. 创建/复用仓库
  console.log('[2/5] 仓库检查/创建 ...')
  let repo = await getRepo()
  if (!repo) {
    const r = await api('POST', '/user/repos', {
      name: REPO,
      private: false,
      description: '都市·命途 — 月亮计划世界观人生重开模拟器',
      autoInit: true,
    })
    if (!r.ok) {
      console.error('[错误] 创建仓库失败:', r.status, JSON.stringify(r.data).slice(0, 300))
      process.exit(1)
    }
    repo = r.data
    console.log('  ✓ 已创建公开仓库')
  } else {
    console.log('  ✓ 仓库已存在')
  }

  // 3. 推送源码到 main
  console.log('[3/5] 推送源码到 main ...')
  const bootstrapped = await bootstrapEmptyRepo()
  const sourceFiles = collectFiles(ROOT)
  await pushTree(sourceFiles, BRANCH, 'chore: 都市·命途 源码部署')
  if (bootstrapped) {
    // 清理引导文件
    await api('DELETE', `/repos/${OWNER}/${REPO}/contents/.gitkeep`, { message: 'chore: 清理引导文件' })
    console.log('  ✓ 已清理引导文件')
  }

  // 4. 推送 dist 到 gh-pages
  console.log('[4/5] 推送构建产物到 gh-pages ...')
  const distFiles = collectFiles(distDir).map((f) => ({ ...f, rel: f.rel.replaceAll(sep, '/') }))
  await pushTree(distFiles, 'gh-pages', 'deploy: GitHub Pages 构建产物')

  // 5. 启用 Pages
  console.log('[5/5] 启用 GitHub Pages ...')
  const pg = await api('POST', `/repos/${OWNER}/${REPO}/pages`, {
    source: { branch: 'gh-pages', path: '/' },
  })
  if (pg.ok) {
    console.log('  ✓ Pages 已启用')
  } else if (pg.status === 409) {
    // 已启用但源可能不同，更新源
    const up = await api('PUT', `/repos/${OWNER}/${REPO}/pages`, {
      source: { branch: 'gh-pages', path: '/' },
    })
    console.log(up.ok ? '  ✓ Pages 源已更新为 gh-pages' : `  ⚠ Pages 已启用（无需重复配置）`)
  } else {
    console.log(`  ⚠ Pages 启用返回 ${pg.status}（可能需稍后生效或手动检查）`)
  }

  console.log('\n========================================')
  console.log('部署完成！')
  console.log(`  仓库：https://github.com/${OWNER}/${REPO}`)
  console.log(`  网页：https://${OWNER}.github.io/${REPO}/`)
  console.log('========================================')
  console.log('提示：GitHub Pages 首次启用需等待 1-3 分钟生效。')
  console.log('安全提示：部署完成后建议轮换（revoke）本次使用的 PAT。')
}

main().catch((e) => {
  console.error('[错误]', e.message)
  process.exit(1)
})
