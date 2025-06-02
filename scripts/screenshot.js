import { chromium } from 'playwright'
import path from 'path'

async function screenshotWithTheme(theme, filename) {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setViewportSize({ width: 2560, height: 1600 })
  await page.emulateMedia({ colorScheme: theme }) // 指定主题
  await page.goto('https://sfkm.me/#music', { waitUntil: 'networkidle' })
  const screenshotPath = path.resolve(filename)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await browser.close()
  console.log(`Screenshot (${theme}) saved:`, screenshotPath)
}

async function main() {
  await screenshotWithTheme('light', './images/preview-light.png')
  await screenshotWithTheme('dark', './images/preview-dark.png')
}

main()
