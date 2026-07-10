#!/usr/bin/env node
/**
 * Smoke UX mobile — landing publique et page /essayer.
 *
 * Usage :
 *   npm run marketing:mobile-ux
 *   FACTURIO_BASE_URL=http://localhost:5173 npm run marketing:mobile-ux
 *
 * Ne nécessite pas le backend (pages publiques uniquement).
 */

import {
  assertAppReachable,
  envBaseUrl,
  gotoReady,
  loadPlaywright,
  createMarketingContext,
} from './playwright-marketing-helpers.mjs'

const BASE_URL = envBaseUrl()
const MOBILE_VIEWPORT = { width: 390, height: 844 }

/** @param {import('playwright').Page} page */
async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth > doc.clientWidth + 2
  })
  if (overflow) {
    throw new Error('Débordement horizontal détecté sur mobile')
  }
}

/** @param {import('playwright').Page} page */
async function testLandingMobile(page) {
  await gotoReady(page, '/', BASE_URL)
  await page.setViewportSize(MOBILE_VIEWPORT)

  const heroTitle = page.getByRole('heading', { level: 1 })
  await heroTitle.waitFor({ state: 'visible', timeout: 15_000 })

  const signup = page.getByRole('link', { name: /commencer gratuitement/i }).first()
  await signup.waitFor({ state: 'visible', timeout: 10_000 })

  const demo = page.getByRole('link', { name: /essayer la démo/i }).first()
  await demo.waitFor({ state: 'visible', timeout: 10_000 })

  await assertNoHorizontalOverflow(page)
  console.log('[mobile-ux] landing OK')
}

/** @param {import('playwright').Page} page */
async function testEssayerMobile(page) {
  await gotoReady(page, '/essayer', BASE_URL)
  await page.setViewportSize(MOBILE_VIEWPORT)

  await page.getByRole('heading', { name: /démo pour freelances dev/i }).waitFor({
    state: 'visible',
    timeout: 15_000,
  })

  const enterBtn = page.getByRole('button', { name: /entrer dans la démo/i })
  await enterBtn.waitFor({ state: 'visible', timeout: 10_000 })

  const signupLink = page.getByRole('button', { name: /créer mon compte gratuit/i })
  await signupLink.waitFor({ state: 'visible', timeout: 10_000 })

  await assertNoHorizontalOverflow(page)
  console.log('[mobile-ux] /essayer OK')
}

async function main() {
  await assertAppReachable(BASE_URL)
  const { chromium } = await loadPlaywright()
  const browser = await chromium.launch({ headless: true })
  const context = await createMarketingContext(browser, { viewport: MOBILE_VIEWPORT })
  const page = await context.newPage()

  try {
    await testLandingMobile(page)
    await testEssayerMobile(page)
    console.log('[mobile-ux] Tous les tests mobile ont réussi.')
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[mobile-ux] Échec:', err.message ?? err)
  process.exit(1)
})
