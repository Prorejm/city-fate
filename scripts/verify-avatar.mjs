import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('https://Prorejm.github.io/city-fate/', { waitUntil: 'networkidle' })
await page.getByText('开始新的人生').click()
await page.getByRole('button', { name: '出生', exact: true }).click()
await page.getByRole('button', { name: '踏入都市' }).click()
await page.waitForTimeout(2500)
const info = await page.evaluate(() => {
  const da = window.da
  const canvas = document.querySelector('canvas')
  let painted = false
  if (canvas) {
    const ctx = canvas.getContext('2d')
    try {
      const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      painted = d.some((v) => v !== 0)
    } catch {
      painted = false
    }
  }
  return {
    daLoaded: !!da,
    daVersion: da?.__version__ ?? null,
    daReady: da?.loaded ?? null,
    canvasCount: document.querySelectorAll('canvas').length,
    canvasPainted: painted,
  }
})
console.log(JSON.stringify(info, null, 2))
await browser.close()
