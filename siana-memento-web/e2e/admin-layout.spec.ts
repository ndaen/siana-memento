import { test, expect, type Page } from '@playwright/test'

const ADMIN_USER = { id: 1, email: 'aldo@test.com', fullName: 'Aldo Test', isAdmin: true }
const REGULAR_USER = { id: 2, email: 'user@test.com', fullName: 'User Test', isAdmin: false }

const MOCK_METRICS = {
  periodDays: 30,
  revenue: 19900,
  ordersCount: 10,
  avgApiCost: 50,
  grossMargin: 14900,
  conversionRate: 0.05,
  apiCostEstimated: true,
  cac: { utmAvailable: false, channels: { organique: null, paid: null, social: null, referral: null } },
}

/** Mocke /auth/me (et les métriques admin) au niveau context pour couvrir le cross-origin. */
async function mockSession(
  page: Page,
  session: { user?: typeof ADMIN_USER | typeof REGULAR_USER } | null
) {
  const context = page.context()
  await context.route('**/auth/me', (route) => {
    if (session?.user) {
      return route.fulfill({ json: { success: true, data: { user: session.user } } })
    }
    return route.fulfill({ json: { success: false, error: { code: 'UNAUTHORIZED' } } })
  })
  await context.route('**/api/admin/metrics', (route) =>
    route.fulfill({ json: { success: true, data: MOCK_METRICS } })
  )
}

test.describe('Layout & navigation admin', () => {
  test('visiteur anonyme sur /admin/dashboard est redirigé vers /login avec redirect', async ({
    page,
  }) => {
    await mockSession(page, null)
    await page.goto('/admin/dashboard')
    await page.waitForURL('**/login**')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    // Le paramètre redirect pointe vers la page admin demandée (encodée).
    expect(decodeURIComponent(page.url())).toContain('redirect=/admin/dashboard')
  })

  test('utilisateur non-admin est redirigé vers /orders', async ({ page }) => {
    await mockSession(page, { user: REGULAR_USER })
    await page.goto('/admin/dashboard')
    await page.waitForURL('**/orders')
    await expect(page).toHaveURL(/\/orders$/)
  })

  test('/admin redirige vers /admin/dashboard', async ({ page }) => {
    await mockSession(page, { user: ADMIN_USER })
    await page.goto('/admin')
    await page.waitForURL('**/admin/dashboard')
    await expect(page).toHaveURL(/\/admin\/dashboard$/)
    await expect(page.getByRole('navigation', { name: 'Navigation admin' })).toBeVisible()
  })

  test('le raccourci « Mes commandes » du header est masqué sous /admin', async ({ page }) => {
    await mockSession(page, { user: ADMIN_USER })
    await page.goto('/admin/dashboard')
    await expect(page.getByRole('navigation', { name: 'Navigation admin' })).toBeVisible()
    // Le lien marketing « Mes commandes » (aria-label) ne doit pas apparaître en admin.
    await expect(page.getByRole('link', { name: 'Mes commandes' })).toHaveCount(0)
  })

  test('admin voit la sidebar avec les 4 sections et Dashboard actif', async ({ page }) => {
    await mockSession(page, { user: ADMIN_USER })
    await page.goto('/admin/dashboard')

    const nav = page.getByRole('navigation', { name: 'Navigation admin' })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Logs' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Commandes' })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Testimonials' })).toBeVisible()

    // Section active = Dashboard (aria-current="page")
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })

  test('cliquer Logs navigue vers le placeholder « bientôt disponible » sans erreur (AC#5)', async ({
    page,
  }) => {
    await mockSession(page, { user: ADMIN_USER })
    await page.goto('/admin/dashboard')

    const nav = page.getByRole('navigation', { name: 'Navigation admin' })
    await nav.getByRole('link', { name: 'Logs' }).click()

    await page.waitForURL('**/admin/logs')
    await expect(page.getByText('Bientôt disponible')).toBeVisible()
    // Logs devient la section active après navigation.
    await expect(nav.getByRole('link', { name: 'Logs' })).toHaveAttribute('aria-current', 'page')
  })

  test('mobile : la sidebar est masquée et le drawer s’ouvre au hamburger (AC#4)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await mockSession(page, { user: ADMIN_USER })
    await page.goto('/admin/dashboard')

    // La sidebar desktop est masquée (< md).
    await expect(page.getByRole('navigation', { name: 'Navigation admin' })).toBeHidden()

    // Ouvrir le drawer via le bouton hamburger.
    const trigger = page.getByRole('button', { name: 'Ouvrir la navigation admin' })
    await expect(trigger).toBeVisible()
    await trigger.click()

    // Le drawer affiche la navigation (libellé distinct du landmark desktop), accessible au clavier.
    const drawerNav = page.getByRole('navigation', { name: 'Navigation admin (mobile)' })
    await expect(drawerNav).toBeVisible()
    await drawerNav.getByRole('link', { name: 'Commandes' }).click()
    await page.waitForURL('**/admin/orders')
    await expect(page.getByText('Bientôt disponible')).toBeVisible()
  })

  test('après login depuis le garde admin, retour à la page admin demandée', async ({ page }) => {
    const context = page.context()
    await context.route('**/auth/login', (route) =>
      route.fulfill({ json: { success: true, data: { user: ADMIN_USER } } })
    )
    await mockSession(page, { user: ADMIN_USER })

    await page.goto('/login?redirect=/admin/dashboard')
    await page.locator('#login-email').fill('aldo@test.com')
    await page.locator('#login-password').fill('secret123')
    await page.getByRole('button', { name: /^se connecter$/i }).click()

    await page.waitForURL('**/admin/dashboard')
    await expect(page.getByRole('navigation', { name: 'Navigation admin' })).toBeVisible()
  })

  test('redirect externe ignoré après login (anti open-redirect)', async ({ page }) => {
    const context = page.context()
    await context.route('**/auth/login', (route) =>
      route.fulfill({ json: { success: true, data: { user: REGULAR_USER } } })
    )
    await context.route('**/auth/me', (route) =>
      route.fulfill({ json: { success: true, data: { user: REGULAR_USER } } })
    )

    await page.goto('/login?redirect=//evil.example.com')
    await page.locator('#login-email').fill('user@test.com')
    await page.locator('#login-password').fill('secret123')
    await page.getByRole('button', { name: /^se connecter$/i }).click()

    // Le chemin externe est rejeté → retour à l'accueil interne, pas vers evil.example.com.
    await page.waitForURL('http://localhost:3000/')
    expect(new URL(page.url()).host).toBe('localhost:3000')
  })

  test('erreur réseau sur le garde admin affiche un bouton Réessayer', async ({ page }) => {
    // Abort de /auth/me → getMe renvoie NETWORK_ERROR → état réessayable (pas de redirect).
    await page.context().route('**/auth/me', (route) => route.abort())

    await page.goto('/admin/dashboard')
    await expect(page.getByRole('heading', { name: 'Connexion impossible' })).toBeVisible()
    await expect(page.getByRole('button', { name: /réessayer/i })).toBeVisible()
    // Pas de redirection vers /login sur une simple panne réseau.
    await expect(page).toHaveURL(/\/admin\/dashboard$/)
  })
})
