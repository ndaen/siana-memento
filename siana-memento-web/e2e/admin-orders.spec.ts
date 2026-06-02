import { test, expect, type Page } from '@playwright/test'

const ADMIN_USER = { id: 1, email: 'aldo@test.com', fullName: 'Aldo Test', isAdmin: true }

const PAID = {
  id: 1,
  createdAt: '2026-06-01T10:00:00.000Z',
  status: 'paid',
  amountCents: 1990,
  userId: 7,
  userEmail: 'sophie@example.com',
  template: 'boheme',
  emailSentAt: '2026-06-01T10:01:00.000Z',
}

const EMAIL_FAILED = {
  id: 2,
  createdAt: '2026-06-01T11:00:00.000Z',
  status: 'email_failed',
  amountCents: 1990,
  userId: 8,
  userEmail: 'marc@example.com',
  template: 'moderne',
  emailSentAt: null,
}

function makeData(items: unknown[], page = 1, lastPage = 1, total = items.length) {
  return { meta: { total, perPage: 20, currentPage: page, lastPage }, items }
}

async function mockAdmin(page: Page) {
  await page.context().route('**/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: { user: ADMIN_USER } } })
  )
}

test.describe('Commandes admin', () => {
  test('affiche la table des commandes avec les colonnes attendues (AC#1)', async ({ page }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/orders?**', (route) =>
      route.fulfill({ json: { success: true, data: makeData([PAID, EMAIL_FAILED]) } })
    )

    await page.goto('/admin/orders')
    await expect(page.getByRole('heading', { name: 'Commandes' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Date/heure' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Client' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Montant' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Statut' })).toBeVisible()

    await expect(page.getByText('sophie@example.com')).toBeVisible()
    await expect(page.getByText('Payée')).toBeVisible()
    await expect(page.getByText('Email échoué', { exact: true })).toBeVisible()
    await expect(page.getByText(/19,90/).first()).toBeVisible()
  })

  test('toggle « échecs email seulement » → requête status=email_failed (AC#1)', async ({
    page,
  }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/orders?**', (route) => {
      const url = new URL(route.request().url())
      const failedOnly = url.searchParams.get('status') === 'email_failed'
      const items = failedOnly ? [EMAIL_FAILED] : [PAID, EMAIL_FAILED]
      route.fulfill({ json: { success: true, data: makeData(items) } })
    })

    await page.goto('/admin/orders')
    await expect(page.getByText('Payée')).toBeVisible()

    const reqPromise = page.waitForRequest(
      (r) => r.url().includes('/api/admin/orders') && r.url().includes('status=email_failed')
    )
    await page.getByText('Échecs email seulement').click()
    await reqPromise

    await expect(page.getByText('Payée')).toHaveCount(0)
    await expect(page.getByText('Email échoué', { exact: true })).toBeVisible()
  })

  test('renvoi de l’email : clic → POST resend + statut mis à jour + toast (AC#1)', async ({
    page,
  }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/orders?**', (route) =>
      route.fulfill({ json: { success: true, data: makeData([EMAIL_FAILED]) } })
    )
    await page.context().route('**/resend-email', (route) =>
      route.fulfill({ json: { success: true, data: { id: 2, status: 'paid', emailSentAt: null } } })
    )

    await page.goto('/admin/orders')
    await expect(page.getByText('Email échoué', { exact: true })).toBeVisible()

    const reqPromise = page.waitForRequest(
      (r) => r.url().includes('/resend-email') && r.method() === 'POST'
    )
    await page.getByRole('button', { name: "Renvoyer l'email" }).click()
    await reqPromise

    // Mise à jour optimiste : la ligne quitte l'état échec, le badge devient « Payée ».
    await expect(page.getByText('Payée')).toBeVisible()
    await expect(page.getByText('Email échoué', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Email renvoyé avec succès.')).toBeVisible()
  })

  test('sous le filtre « échecs seulement », un renvoi réussi retire la ligne (F5)', async ({
    page,
  }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/orders?**', (route) => {
      const url = new URL(route.request().url())
      const failedOnly = url.searchParams.get('status') === 'email_failed'
      const items = failedOnly ? [EMAIL_FAILED] : [PAID, EMAIL_FAILED]
      route.fulfill({ json: { success: true, data: makeData(items) } })
    })
    await page.context().route('**/resend-email', (route) =>
      route.fulfill({ json: { success: true, data: { id: 2, status: 'paid', emailSentAt: null } } })
    )

    await page.goto('/admin/orders')
    await page.getByText('Échecs email seulement').click()
    await expect(page.getByText('Email échoué', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: "Renvoyer l'email" }).click()

    await expect(page.getByText('Email renvoyé avec succès.')).toBeVisible()
    // La ligne réparée quitte la liste filtrée → état vide « Aucun échec email ».
    await expect(page.getByText('Email échoué', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Aucun échec email')).toBeVisible()
  })

  test('échec du renvoi → toast d’erreur, statut conservé', async ({ page }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/orders?**', (route) =>
      route.fulfill({ json: { success: true, data: makeData([EMAIL_FAILED]) } })
    )
    await page.context().route('**/resend-email', (route) =>
      route.fulfill({
        status: 502,
        json: { success: false, error: { code: 'SEND_FAILED', message: "L'envoi a échoué." } },
      })
    )

    await page.goto('/admin/orders')
    await page.getByRole('button', { name: "Renvoyer l'email" }).click()

    await expect(page.getByText("L'envoi a échoué.")).toBeVisible()
    await expect(page.getByText('Email échoué', { exact: true })).toBeVisible()
  })

  test('état vide bienveillant', async ({ page }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/orders?**', (route) =>
      route.fulfill({ json: { success: true, data: makeData([], 1, 1, 0) } })
    )

    await page.goto('/admin/orders')
    await expect(page.getByText('Aucune commande')).toBeVisible()
  })

  test('erreur API → état d’erreur sans crash', async ({ page }) => {
    await mockAdmin(page)
    await page.context().route('**/api/admin/orders?**', (route) =>
      route.fulfill({
        status: 500,
        json: { success: false, error: { code: 'ORDERS_FAILED', message: 'boom' } },
      })
    )

    await page.goto('/admin/orders')
    await expect(page.getByText('Impossible de charger les commandes')).toBeVisible()
  })
})
