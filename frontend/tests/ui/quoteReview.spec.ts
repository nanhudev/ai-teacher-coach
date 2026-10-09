import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

test('teacher can detect, fix and export a quotation without uploading input', async ({ page }) => {
  const posted: string[] = []
  page.on('request', r => { if (r.postData()) posted.push(r.postData()!) })
  await page.goto('/review')
  await page.getByRole('button', { name: '暂不允许' }).click()
  await page.getByRole('button', { name: '试用《师说》错字案例' }).click()
  await expect(page.getByRole('heading', { name: '存在待复核引用' })).toBeVisible()
  await expect(page.getByText('1 / 2 条引用有逐字支持。', { exact: false })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出复核记录' }).click()
  const file = await (await downloadPromise).path()
  const exported = JSON.parse(await fs.readFile(file!, 'utf8'))
  expect(exported.status).toBe('needs_review')
  expect(exported.supported).toBe(1)
  const dir = process.env.EVIDENCE_SCREENSHOT_DIR
  if (dir) {
    await fs.mkdir(dir, { recursive: true })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(dir, 'quotation-desktop.png'), fullPage: true })
  }
  await page.getByRole('textbox', { name: '教案或课件文案' }).fill('“师者，所以传道受业解惑也。”')
  await expect(page.getByRole('heading', { name: '逐字引用有原文支持' })).toBeVisible()
  expect(posted.some(p => p.includes('传道') || p.includes('受业'))).toBe(false)
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  expect(stored).not.toContain('传道')
  await page.reload()
  await expect(page.getByRole('textbox', { name: '教材原文' })).toHaveValue('')
})

test('missing source and absent quotes remain explicitly unverified', async ({ page }) => {
  await page.goto('/review')
  await page.getByRole('textbox', { name: '教案或课件文案' }).fill('“未经证实的文字”')
  await expect(page.getByRole('heading', { name: '请先补充原文' })).toBeVisible()
  await page.getByRole('textbox', { name: '教材原文' }).fill('原文')
  await page.getByRole('textbox', { name: '教案或课件文案' }).fill('未加引号的概述')
  await expect(page.getByRole('heading', { name: '未发现带引号的引用' })).toBeVisible()
})

test('mobile review fits the viewport and is reachable from home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.getByRole('button', { name: '暂不允许' }).click()
  await page.getByRole('link', { name: '优化已有课' }).click()
  await expect(page.getByRole('heading', { name: '每一句引用，都能回到原文' })).toBeVisible()
  await page.getByRole('button', { name: '试用《师说》错字案例' }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const dir = process.env.EVIDENCE_SCREENSHOT_DIR
  if (dir) { await page.evaluate(() => document.fonts.ready); await page.screenshot({ path: path.join(dir, 'quotation-mobile.png'), fullPage: true }) }
})

test('Chinese headings render with the local font when external font services are unavailable', async ({ page }) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort())
  await page.goto('/review')
  await page.evaluate(() => document.fonts.ready)
  const client = await page.context().newCDPSession(page)
  await client.send('DOM.enable'); await client.send('CSS.enable')
  const { root } = await client.send('DOM.getDocument')
  const { nodeId } = await client.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1' })
  const { fonts } = await client.send('CSS.getPlatformFontsForNode', { nodeId })
  expect(fonts.some(f => f.isCustomFont && f.familyName.includes('Noto Sans SC') && f.glyphCount > 0)).toBe(true)
})
