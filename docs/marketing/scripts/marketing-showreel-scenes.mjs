/**
 * Actions interactives par plan storyboard — navigation UX (menus, barre, sidebar).
 */

import {
  gotoReadyVideo,
  navigateToFirstQuoteDetail,
  playScrollAnimation,
  waitForPageReadyVideo,
} from './playwright-marketing-helpers.mjs'
import { fillQuoteModalDemo } from './playwright-marketing-forms.mjs'
import {
  navTopLink,
  navMegaMenuItem,
  navSettingsSidebar,
  showcaseMegaMenuThenGo,
  showcaseProductViews,
  openFirstTableRow,
  hoverNewInvoiceCta,
  uxPause,
} from './marketing-nav-ux.mjs'

export function slugToPath(slug) {
  const map = {
    dashboard: '/dashboard',
    'factures-inbox': '/factures/inbox',
    'devis-inbox': '/devis/inbox',
    'devis-nouveau-modal': '/devis/inbox',
    'devis-detail': '/devis/inbox',
    'facture-detail': '/factures/inbox',
    comptabilite: '/comptabilite',
    parametres: '/parametres',
    'parametres-entreprise': '/parametres/entreprise',
    'parametres-efacture': '/parametres/facturation-electronique',
    'menu-commercial': '/dashboard',
    'menu-finance': '/dashboard',
    'produits-catalogue': '/produits',
  }
  return map[slug] ?? '/dashboard'
}

/**
 * @param {import('playwright').Page} page
 * @param {string} slug
 * @param {string} baseUrl
 * @param {{ paceMs?: number }} [opts]
 */
export async function performStoryboardScene(page, slug, baseUrl, opts = {}) {
  const pace = opts.paceMs ?? 320

  switch (slug) {
    case 'dashboard': {
      if (!page.url().includes('/dashboard')) {
        await navTopLink(page, 'Tableau de bord')
      } else {
        await waitForPageReadyVideo(page)
      }
      await playScrollAnimation(page, { maxSteps: 3 })
      break
    }

    case 'factures-inbox':
      await navMegaMenuItem(page, 'Commercial', 'Factures', { paceMs: pace, baseUrl })
      await hoverNewInvoiceCta(page)
      await playScrollAnimation(page, { maxSteps: 3 })
      break

    case 'devis-inbox':
      await navMegaMenuItem(page, 'Commercial', 'Devis', { paceMs: pace, baseUrl })
      await playScrollAnimation(page, { maxSteps: 3 })
      break

    case 'devis-nouveau-modal': {
      if (!page.url().includes('/devis')) {
        await navMegaMenuItem(page, 'Commercial', 'Devis', { paceMs: pace, baseUrl })
      }
      const nouveauBtn = page.getByRole('button', { name: /nouveau devis/i }).first()
      await nouveauBtn.hover()
      await uxPause(page, pace)
      await nouveauBtn.click()
      await page.getByRole('dialog').waitFor({ timeout: 12_000 })
      await uxPause(page, 280)
      await fillQuoteModalDemo(page, { paceMs: pace })
      break
    }

    case 'devis-detail':
      await page.keyboard.press('Escape').catch(() => {})
      await uxPause(page, 200)
      if (page.url().includes('/devis/inbox') || page.url().includes('/devis/brouillons')) {
        await openFirstTableRow(page, /\/devis\/voir\//)
      } else {
        try {
          await navMegaMenuItem(page, 'Commercial', 'Devis', { paceMs: pace, baseUrl })
          await openFirstTableRow(page, /\/devis\/voir\//)
        } catch {
          await navigateToFirstQuoteDetail(page, baseUrl)
        }
      }
      await playScrollAnimation(page, { maxSteps: 3 })
      break

    case 'facture-detail':
      await navMegaMenuItem(page, 'Commercial', 'Factures', { paceMs: pace, baseUrl })
      await page.getByRole('button', { name: /nouvelle facture/i }).first().hover()
      await uxPause(page, pace)
      await page.getByRole('button', { name: /nouvelle facture/i }).first().click()
      await page.getByRole('dialog').waitFor({ timeout: 12_000 })
      await uxPause(page, pace * 2)
      await page.keyboard.press('Escape').catch(() => {})
      break

    case 'parametres-efacture':
      await navSettingsSidebar(page, 'Réforme 2026', { paceMs: pace })
      await playScrollAnimation(page, { maxSteps: 3 })
      break

    case 'parametres-entreprise':
      await navSettingsSidebar(page, 'Entreprise', { paceMs: pace })
      await playScrollAnimation(page, { maxSteps: 3 })
      break

    case 'menu-commercial':
      await showcaseMegaMenuThenGo(page, 'Commercial', 'Produits', { paceMs: pace + 60, baseUrl })
      await showcaseProductViews(page, { paceMs: pace + 100 })
      break

    case 'menu-finance':
      if (!page.url().includes('/dashboard')) {
        await navTopLink(page, 'Tableau de bord')
      }
      await showcaseMegaMenuThenGo(page, 'Finance', 'Comptabilité', { paceMs: pace + 60, baseUrl })
      break

    case 'produits-catalogue':
      await navMegaMenuItem(page, 'Commercial', 'Produits', { paceMs: pace, baseUrl })
      await showcaseProductViews(page, { paceMs: pace + 100 })
      break

    default:
      await gotoReadyVideo(page, slugToPath(slug), baseUrl)
      await playScrollAnimation(page, { maxSteps: 2 })
  }
}

/** Pause entre deux plans (showreel). */
export async function pauseAfterScene(page, holdMs = 1200) {
  await page.waitForTimeout(Math.max(400, holdMs))
}
