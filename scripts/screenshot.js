import { chromium } from 'playwright'
import path from 'path'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('https://sfkm.me', { waitUntil: 'networkidle' })
  const screenshotPath = path.resolve('./public/preview.png')
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await browser.close()
  console.log('Screenshot saved:', screenshotPath)
}

main()