/**
 * Remplissage des formulaires pour captures / workflow marketing.
 */

/** @param {import('playwright').Page} page */
async function waitForFinanceDialog(page) {
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ timeout: 15_000 })
  await page.waitForTimeout(600)
  return dialog
}

/** @param {import('playwright').Page} page */
async function pickClientInDialog(page, query = 'Atelier') {
  const dialog = await waitForFinanceDialog(page)
  const clientCombo = dialog.getByRole('combobox', { name: /^client$/i })
  await clientCombo.waitFor({ state: 'visible', timeout: 20_000 })
  await clientCombo.click()
  if (query) await clientCombo.fill(query)
  await page.waitForTimeout(600)
  const options = page.getByRole('option')
  if ((await options.count()) === 0 && query) {
    await clientCombo.fill('')
    await page.waitForTimeout(400)
  }
  const option = options.first()
  await option.waitFor({ state: 'visible', timeout: 12_000 })
  await option.click()
  await page.waitForTimeout(350)
}

/** @param {import('playwright').Page} page */
async function fillFirstLineInDialog(page, description, unitPrice) {
  const dialog = page.getByRole('dialog')
  const row = dialog.locator('table tbody tr').first()
  await row.waitFor({ timeout: 10_000 })
  const descCombo = row.getByRole('combobox')
  await descCombo.click()
  await descCombo.fill(description)
  await page.waitForTimeout(200)
  const price = row.locator('input[inputmode="numeric"]')
  await price.click()
  await price.fill(String(unitPrice))
  await page.waitForTimeout(350)
}

/** @param {import('playwright').Page} page */
export async function fillQuoteModalDemo(page, { paceMs = 320 } = {}) {
  const dialog = page.getByRole('dialog')
  const clientCombo = dialog.getByRole('combobox', { name: /^client$/i })
  await clientCombo.waitFor({ state: 'visible', timeout: 20_000 })
  await clientCombo.click()
  await page.waitForTimeout(paceMs)
  await clientCombo.fill('Atelier')
  await page.waitForTimeout(paceMs)
  const option = page.getByRole('option').first()
  await option.waitFor({ state: 'visible', timeout: 12_000 })
  await option.click()
  await page.waitForTimeout(paceMs)

  const row = dialog.locator('table tbody tr').first()
  await row.waitFor({ timeout: 10_000 })
  const descCombo = row.getByRole('combobox')
  await descCombo.click()
  await page.waitForTimeout(paceMs / 2)
  await descCombo.fill('Développement React — navigation, API et déploiement')
  await page.waitForTimeout(paceMs)
  const price = row.locator('input[inputmode="numeric"]')
  await price.click()
  await price.fill('1850')
  await page.waitForTimeout(paceMs)
}

/** @param {import('playwright').Page} page */
export async function fillQuoteModal(page) {
  await pickClientInDialog(page, 'Atelier')
  await fillFirstLineInDialog(
    page,
    'Développement React — navigation, API et déploiement',
    1850,
  )
}

/** @param {import('playwright').Page} page */
export async function fillInvoiceModal(page) {
  await pickClientInDialog(page, 'Atelier')
  await fillFirstLineInDialog(page, 'Maintenance applicative — correctifs & mises à jour', 490)
}

/** Remplit uniquement le client (workflow étape intermédiaire). */
export async function fillQuoteClientOnly(page) {
  await pickClientInDialog(page, 'Atelier')
}

export async function fillInvoiceClientOnly(page) {
  await pickClientInDialog(page, 'Atelier')
}

/** @param {import('playwright').Page} page */
export async function fillNewProductWizard(page) {
  const dialog = await waitForFinanceDialog(page)
  await dialog.getByLabel(/nom du produit/i).fill('Audit performance React')
  await page.getByRole('button', { name: /suivant/i }).click()
  await page.waitForTimeout(350)
  await page.getByRole('button', { name: /suivant/i }).click()
  await page.waitForTimeout(350)
  await dialog.getByLabel(/prix unitaire/i).fill('890')
  await page.waitForTimeout(300)
}

/** @param {import('playwright').Page} page */
export async function fillEditProductWizard(page) {
  const dialog = await waitForFinanceDialog(page)
  const name = dialog.getByLabel(/nom du produit/i)
  await name.clear()
  await name.fill('Site vitrine React — forfait premium')
  await page.getByRole('button', { name: /suivant/i }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /suivant/i }).click()
  await page.waitForTimeout(300)
  const price = dialog.getByLabel(/prix unitaire/i)
  await price.clear()
  await price.fill('2490')
  await page.waitForTimeout(300)
}

/** @param {import('playwright').Page} page */
export async function openFirstProductForEdit(page) {
  await page.getByRole('button', { name: /^catalogue$/i }).click({ timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(800)
  const card = page.locator('.MuiCard-root').filter({ hasText: /site|vitrine|react|api|développement/i }).first()
  if ((await card.count()) > 0) {
    await card.click({ timeout: 10_000 })
  } else {
    await page.getByRole('button', { name: /^liste$/i }).click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(500)
    const row = page.locator('tr, [class*="MuiCard-root"]').first()
    await row.click({ timeout: 10_000 })
  }
  await page.getByRole('dialog').waitFor({ timeout: 15_000 })
}
