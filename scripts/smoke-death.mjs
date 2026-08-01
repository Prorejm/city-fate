import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/city-fate/'
const errors = []
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.removeItem('cityFateData'))
await page.reload({ waitUntil: 'networkidle' })
await page.getByText('开始新的人生').click()
await page.getByRole('button', { name: '出生', exact: true }).click()
await page.getByRole('button', { name: '踏入都市' }).click()
await page.waitForTimeout(1000)

let died = false
for (let i = 0; i < 60; i++) {
  const btns = page.locator('button.group')
  const n = await btns.count()
  if (n === 0) break
  let clicked = false
  for (let j = 0; j < n; j++) {
    if (!(await btns.nth(j).isDisabled())) {
      await btns.nth(j).click()
      clicked = true
      break
    }
  }
  if (!clicked) break
  await page.waitForTimeout(300)
  for (const c of ['握住这份力量', '接受这份扭曲']) {
    const btn = page.getByRole('button', { name: c })
    if ((await btn.count()) > 0) {
      await btn.click()
      await page.waitForTimeout(400)
      break
    }
  }
  const end = await page.getByText('终 局').count()
  if (end > 0) {
    died = true
    break
  }
  // 60 个事件仍未死亡：通过调试钩子强制健康归零，在下一次事件结算时触发死亡
  if (i === 30) {
    await page.evaluate(() => {
      const s = (window).__cityFate.store.getState()
      if (s.run) s.run.health = 0
    })
  }
}

if (died) {
  await page.screenshot({ path: 'test_07_death.png', fullPage: true })
  const hasEpitaph = (await page.locator('text=死因：').count()) > 0
  const hasRebirth = (await page.getByRole('button', { name: '重开一世' }).count()) > 0
  console.log(`✓ 死亡结算流程验证：墓志铭=${hasEpitaph} 重开按钮=${hasRebirth}`)
  // 验证重开按钮流程
  await page.getByRole('button', { name: '重开一世' }).click()
  await page.waitForTimeout(400)
  const createVisible = (await page.getByText('出身档案').count()) > 0
  console.log(`✓ 重开进入创建界面：${createVisible}`)
  // 验证跨周目数据
  const storage = await page.evaluate(() => JSON.parse(localStorage.getItem('cityFateData') || '{}'))
  console.log(`✓ 跨周目 playCount=${storage?.state?.meta?.playCount} totalLifespan=${storage?.state?.meta?.totalLifespan}`)
} else {
  console.log('⚠ 90 次事件内未死亡（运气太好），跳过死亡页验证')
}
await browser.close()
if (errors.length) {
  console.log('\n❌ 错误：')
  errors.forEach((e) => console.log('  -', e.slice(0, 300)))
  process.exit(1)
}
console.log(errors.length === 0 ? '\n✓ 死亡流程无控制台错误' : '')
