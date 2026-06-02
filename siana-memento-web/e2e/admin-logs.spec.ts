import { test, expect, type Page } from '@playwright/test'

const ADMIN_USER = { id: 1, email: 'aldo@test.com', fullName: 'Aldo Test', isAdmin: true }

const COMPLETED = {
  id: 1,
  createdAt: '2026-06-01T10:00:00.000Z',
  status: 'completed',
  iterationNumber: 1,
  attempts: 1,
  durationMs: 8500,
  geminiModel: 'gemini-2.5-flash-image',
  apiCostCents: 50,
  costEstimated: true,
  errorMessage: null,
  template: 'boheme',
  userId: 7,
  promptUsed: 'prompt initial',
  feedback: null,
}

const FAILED = {
  id: 2,
  createdAt: '2026-06-01T11:00:00.000Z',
  status: 'failed',
  iterationNumber: 2,
  attempts: 3,
  durationMs: 24000,
  geminiModel: 'gemini-2.5-flash-image',
  apiCostCents: 50,
  costEstimated: true,
  errorMessage: 'Timeout Gemini après 3 tentatives',
  template: 'moderne',
  userId: 7,
  promptUsed: 'prompt iteration payload',
  feedback: 'plus de fleurs',
}

function makeData(items: unknown[], page = 1, lastPage = 1, total = items.length) {
  return { meta: { total, perPage: 20, currentPage: page, lastPage }, items }
}

async function mockAdmin(page: Page) {
  await page.context().route('**/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: { user: ADMIN_USER } } })
  )
}

test.describe('Logs de génération admin', () => {
  test('affiche la table des générations avec les colonnes attendues (AC#1)', async ({ page }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/logs**', (route) =>
      route.fulfill({ json: { success: true, data: makeData([COMPLETED, FAILED]) } })
    )

    await page.goto('/admin/logs')
    await expect(page.getByRole('heading', { name: 'Logs de génération' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Date/heure' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Template' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Coût' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Statut' })).toBeVisible()

    await expect(page.getByText('boheme')).toBeVisible()
    await expect(page.getByText('Réussi')).toBeVisible()
    await expect(page.getByText('Échec', { exact: true })).toBeVisible()
    // coût en € fr-FR (50 centimes → 0,50 €)
    await expect(page.getByText(/0,50/).first()).toBeVisible()
  })

  test('toggle « échecs seulement » → requête failedOnly=true + détail erreur (AC#2)', async ({
    page,
  }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/logs**', (route) => {
      const url = new URL(route.request().url())
      const failedOnly = url.searchParams.get('failedOnly') === 'true'
      const items = failedOnly ? [FAILED] : [COMPLETED, FAILED]
      route.fulfill({ json: { success: true, data: makeData(items) } })
    })

    await page.goto('/admin/logs')
    await expect(page.getByText('Réussi')).toBeVisible()

    const reqPromise = page.waitForRequest(
      (r) => r.url().includes('/api/admin/logs') && r.url().includes('failedOnly=true')
    )
    await page.getByText('Échecs seulement').click()
    await reqPromise

    await expect(page.getByText('Réussi')).toHaveCount(0)
    await expect(page.getByText('Échec', { exact: true })).toBeVisible()

    // Détail de l'erreur : message complet + contexte/payload (AC#2)
    await page.getByRole('button', { name: 'Détail' }).click()
    await expect(page.getByText('Timeout Gemini après 3 tentatives')).toBeVisible()
    await expect(page.getByText(/Payload/)).toBeVisible()
  })

  test('état vide bienveillant', async ({ page }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/logs**', (route) =>
      route.fulfill({ json: { success: true, data: makeData([], 1, 1, 0) } })
    )

    await page.goto('/admin/logs')
    await expect(page.getByText('Aucune génération')).toBeVisible()
  })

  test('erreur API → état d’erreur sans crash', async ({ page }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/logs**', (route) =>
      route.fulfill({
        status: 500,
        json: { success: false, error: { code: 'LOGS_FAILED', message: 'boom' } },
      })
    )

    await page.goto('/admin/logs')
    await expect(page.getByText('Impossible de charger les logs')).toBeVisible()
  })

  test('pagination : « Suivant » demande page=2', async ({ page }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/logs**', (route) => {
      const url = new URL(route.request().url())
      const pageNum = Number(url.searchParams.get('page') ?? '1')
      route.fulfill({ json: { success: true, data: makeData([COMPLETED], pageNum, 3, 50) } })
    })

    await page.goto('/admin/logs')
    await expect(page.getByText('Page 1 / 3')).toBeVisible()

    const reqPromise = page.waitForRequest(
      (r) => r.url().includes('/api/admin/logs') && r.url().includes('page=2')
    )
    await page.getByRole('button', { name: 'Suivant' }).click()
    await reqPromise
    await expect(page.getByText('Page 2 / 3')).toBeVisible()
  })
})
