/**
 * Navigation UX + transitions filmées (mega-menu, barre route, fondu page).
 */

import { getScreenshotConfig } from './marketing-screenshot-env.mjs'
import {
  gotoReadyVideo,
  openMegaMenu,
  waitForPageReadyVideo,
  waitForShellLite,
} from './playwright-marketing-helpers.mjs'

const NAV_URL_PATTERNS = {
  Factures: /\/factures\//,
  Devis: /\/devis\//,
  Produits: /\/produits/,
  Clients: /\/clients\//,
  Prospection: /\/prospection/,
  Comptabilité: /\/comptabilite/,
  Taxes: /\/taxes/,
  Abonnements: /\/abonnements/,
  'Tableau de bord': /\/dashboard/,
  Paramètres: /\/parametres/,
}

const NAV_PATH_FALLBACK = {
  Factures: '/factures/inbox',
  Devis: '/devis/inbox',
  Produits: '/produits',
  Clients: '/clients/inbox',
  Prospection: '/prospection',
  Comptabilité: '/comptabilite',
  Taxes: '/taxes',
  Abonnements: '/abonnements',
}

/** @param {import('playwright').Page} page */
export async function uxPause(page, ms = 300) {
  await page.waitForTimeout(ms)
}

/**
 * Laisse le temps à la barre route + fondu MUI (PageTransition / settings / produits).
 * @param {import('playwright').Page} page
 */
export async function watchRouteTransition(page, { urlPattern, keepMenuMs } = {}) {
  const cfg = getScreenshotConfig()
  const menuHold = keepMenuMs ?? cfg.transitionMenuMs
  const fadeMs = cfg.transitionFadeMs
  const routeBarMs = cfg.transitionRouteBarMs

  const popper = page.locator('.MuiPopper-root:visible')
  if (await popper.isVisible().catch(() => false)) {
    await uxPause(page, menuHold)
  }

  if (urlPattern) {
    await page.waitForURL(urlPattern, { timeout: 18_000 }).catch(() => {})
  }

  const routeBar = page.locator('[role="progressbar"][aria-hidden="true"]')
  if (await routeBar.isVisible().catch(() => false)) {
    await uxPause(page, routeBarMs)
    await routeBar.waitFor({ state: 'hidden', timeout: 4000 }).catch(() => {})
  } else {
    await uxPause(page, Math.min(routeBarMs, 280))
  }

  const contentBusy = page.locator(
    '.MuiCircularProgress-root:visible, main .MuiLinearProgress-root:visible, [role="main"] .MuiLinearProgress-root:visible',
  )
  for (let i = 0; i < 35; i++) {
    if ((await contentBusy.count()) === 0) break
    await page.waitForTimeout(90)
  }

  await uxPause(page, fadeMs)
  await waitForShellLite(page)
}

/** Lien barre : Tableau de bord, Paramètres… */
export async function navTopLink(page, label, { paceMs = 280 } = {}) {
  const btn = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') })
  const link = page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })
  if (await btn.isVisible().catch(() => false)) {
    await btn.hover()
    await uxPause(page, paceMs)
    await btn.click({ noWaitAfter: true })
  } else {
    await link.first().hover()
    await uxPause(page, paceMs)
    await link.first().click({ noWaitAfter: true })
  }
  await watchRouteTransition(page, { urlPattern: NAV_URL_PATTERNS[label] })
}

/** Mega-menu → clic module avec menu encore visible pendant la transition. */
export async function navMegaMenuItem(page, groupLabel, itemLabel, { paceMs = 300, baseUrl } = {}) {
  let popper = page.locator('.MuiPopper-root:visible')
  try {
    await openMegaMenu(page, groupLabel)
    popper = page.locator('.MuiPopper-root:visible')
    await popper.waitFor({ state: 'visible', timeout: 8_000 })
  } catch (err) {
    const path = NAV_PATH_FALLBACK[itemLabel]
    if (path && baseUrl) {
      console.warn(`[nav] mega-menu ${groupLabel} → goto ${path} (${err.message})`)
      await gotoReadyVideo(page, path, baseUrl)
      return
    }
    throw err
  }

  const item = popper
    .locator('a')
    .filter({ has: page.getByText(new RegExp(`^${itemLabel}$`, 'i')) })
    .first()

  await item.waitFor({ state: 'visible', timeout: 10_000 })
  await item.hover()
  await uxPause(page, paceMs)
  await item.click({ noWaitAfter: true })

  await watchRouteTransition(page, {
    urlPattern: NAV_URL_PATTERNS[itemLabel],
    keepMenuMs: getScreenshotConfig().transitionMenuMs,
  })
}

/** Survol mega-menu sans quitter la page. */
export async function showcaseMegaMenu(page, groupLabel, itemLabels, { paceMs = 380 } = {}) {
  await openMegaMenu(page, groupLabel)
  const popper = page.locator('.MuiPopper-root:visible')
  await popper.waitFor({ timeout: 10_000 })

  for (const label of itemLabels) {
    const item = popper
      .locator('a')
      .filter({ has: page.getByText(new RegExp(`^${label}$`, 'i')) })
      .first()
    if (await item.isVisible().catch(() => false)) {
      await item.hover()
      await uxPause(page, paceMs)
    }
  }
}

/** Sidebar paramètres — fondu AnimatedSettingsOutlet. */
export async function navSettingsSidebar(page, itemLabel, { paceMs = 280 } = {}) {
  if (!page.url().includes('/parametres')) {
    await navTopLink(page, 'Paramètres', { paceMs })
  }
  const item = page
    .locator('a[href*="/parametres"]')
    .filter({ has: page.getByText(new RegExp(itemLabel, 'i')) })
    .first()
  await item.waitFor({ state: 'visible', timeout: 12_000 })
  await item.hover()
  await uxPause(page, paceMs)
  await item.click({ noWaitAfter: true })
  await watchRouteTransition(page, { keepMenuMs: 200 })
}

/** Clic 1ʳᵉ ligne inbox → fiche (transition route + fondu). */
export async function openFirstTableRow(page, urlPattern) {
  const row = page.locator('table tbody tr').first()
  await row.waitFor({ state: 'visible', timeout: 12_000 })
  await row.hover()
  await uxPause(page, 240)
  await row.click({ noWaitAfter: true })
  await watchRouteTransition(page, { urlPattern })
}

/** Modes Catalogue / Liste / Compact (comme captures produits). */
export async function showcaseProductViews(page, { paceMs = 420 } = {}) {
  await waitForPageReadyVideo(page)
  for (const mode of ['Catalogue', 'Liste', 'Compact']) {
    const btn = page.getByRole('button', { name: new RegExp(`^${mode}$`, 'i') })
    if (!(await btn.isVisible().catch(() => false))) continue
    await btn.hover()
    await uxPause(page, paceMs * 0.45)
    await btn.click({ noWaitAfter: true })
    await uxPause(page, paceMs + 200)
  }
}

/** CTA barre « Nouvelle facture ». */
export async function hoverNewInvoiceCta(page) {
  const cta = page.getByRole('link', { name: /nouvelle facture/i }).or(
    page.getByRole('button', { name: /nouvelle facture/i }),
  )
  if (await cta.first().isVisible().catch(() => false)) {
    await cta.first().hover()
    await uxPause(page, 480)
  }
}

/** Mega-menu → clic final sur un item (ferme le tour showcase par une vraie navigation). */
export async function showcaseMegaMenuThenGo(page, groupLabel, itemLabel, { paceMs = 400, baseUrl } = {}) {
  try {
    await showcaseMegaMenu(page, groupLabel, ['Clients', 'Devis', 'Factures', 'Produits'], { paceMs })
  } catch (err) {
    if (baseUrl && NAV_PATH_FALLBACK[itemLabel]) {
      console.warn(`[nav] showcase fallback → ${NAV_PATH_FALLBACK[itemLabel]}`)
      await gotoReadyVideo(page, NAV_PATH_FALLBACK[itemLabel], baseUrl)
      return
    }
    throw err
  }
  const popper = page.locator('.MuiPopper-root:visible')
  const item = popper
    .locator('a')
    .filter({ has: page.getByText(new RegExp(`^${itemLabel}$`, 'i')) })
    .first()
  if (await item.isVisible().catch(() => false)) {
    await item.hover()
    await uxPause(page, paceMs)
    await item.click({ noWaitAfter: true })
    await watchRouteTransition(page, { urlPattern: NAV_URL_PATTERNS[itemLabel] })
  }
}
