import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/city-fate/'
const errors = []
const shots = []

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message))

try {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'test_01_menu.png', fullPage: false })
  shots.push('菜单')

  // 开始新的人生
  await page.getByText('开始新的人生').click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'test_02_create.png', fullPage: true })
  shots.push('创建角色')

  // 选择出生 → 分配
  await page.getByRole('button', { name: '出生', exact: true }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: 'test_03_allocate.png', fullPage: true })
  shots.push('属性分配')

  // 属性分配（直接确认剩余 0 点）
  const startBtn = page.getByRole('button', { name: '踏入都市' })
  await startBtn.click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'test_04_game.png', fullPage: true })
  shots.push('游戏中')

  // 连续游玩 12 年（每次点击第一个可用分支）
  let played = 0
  for (let i = 0; i < 12; i++) {
    const branchBtns = page.locator('button.group')
    const count = await branchBtns.count()
    if (count === 0) break
    // 找第一个未禁用的分支
    let clicked = false
    for (let j = 0; j < count; j++) {
      const disabled = await branchBtns.nth(j).isDisabled()
      if (!disabled) {
        await branchBtns.nth(j).click()
        clicked = true
        break
      }
    }
    if (!clicked) break
    played++
    // 若出现 EGO/扭曲/死亡演出，先确认
    await page.waitForTimeout(350)
    for (const confirm of ['握住这份力量', '接受这份扭曲', '重开一世', '返回标题']) {
      const c = page.getByRole('button', { name: confirm })
      if ((await c.count()) > 0) {
        await c.click()
        await page.waitForTimeout(400)
        break
      }
    }
  }
  shots.push(`游玩 ${played} 个事件`)

  await page.screenshot({ path: 'test_05_after_play.png', fullPage: true })

  // 成就面板
  const achBtn = page.getByRole('button', { name: '成就' })
  if ((await achBtn.count()) > 0) {
    await achBtn.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: 'test_06_achievements.png', fullPage: true })
    shots.push('成就面板')
    await page.mouse.click(650, 60)
  }

  // localStorage 检查
  const storage = await page.evaluate(() => {
    const raw = localStorage.getItem('cityFateData')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return { parseError: true }
    }
  })
  console.log('cityFateData:', JSON.stringify(storage?.meta ?? storage).slice(0, 200))

  console.log('流程完成：', shots.join(' → '))
} catch (e) {
  errors.push('FLOW: ' + e.message)
  await page.screenshot({ path: 'test_fail.png', fullPage: true })
}

await browser.close()

if (errors.length) {
  console.log('\n❌ 运行时错误：')
  errors.forEach((e) => console.log('  -', e.slice(0, 300)))
  process.exit(1)
} else {
  console.log('\n✓ 冒烟测试通过：无控制台错误')
}
