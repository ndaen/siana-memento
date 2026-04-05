import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'

// Fixture photo de test (1x1 pixel JPEG minimal)
const TEST_PHOTO = path.resolve(__dirname, 'fixtures/test-photo.jpg')

// IDs et données mockées
const MOCK_DESIGN_ID = 42
const MOCK_SESSION_TOKEN = 'mock-session-token-abc123'
const MOCK_CLOUDINARY_PUBLIC_ID = 'photos/test-photo-1'
const MOCK_CLOUDINARY_URL = 'https://res.cloudinary.com/test/image/upload/v1/photos/test-photo-1.jpg'
const MOCK_PREVIEW_URL = 'https://res.cloudinary.com/test/image/upload/v1/previews/design-42.png'
const MOCK_USER = { id: 1, email: 'aldo@test.com', fullName: 'Aldo Test' }

/**
 * Configure tous les mocks API nécessaires pour le flow complet.
 * Intercepte les appels backend + Cloudinary direct upload.
 */
async function setupApiMocks(page: Page) {
  const context = page.context()

  // Auth — intercepter au niveau context pour les requêtes cross-origin
  await context.route('**/auth/me', (route) =>
    route.fulfill({ json: { success: true, data: { user: MOCK_USER } } })
  )
  await context.route('**/auth/login', (route) =>
    route.fulfill({ json: { success: true, data: { user: MOCK_USER } } })
  )

  // Upload signature
  await context.route('**/api/upload/sign*', (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          signature: 'mock-signature',
          timestamp: Math.floor(Date.now() / 1000),
          cloudName: 'test-cloud',
          apiKey: 'mock-api-key',
          folder: 'photos',
          tags: 'siana-memento',
        },
      },
    })
  )

  // Cloudinary direct upload (XHR)
  await context.route('**/api.cloudinary.com/**', (route) =>
    route.fulfill({
      json: {
        public_id: MOCK_CLOUDINARY_PUBLIC_ID,
        secure_url: MOCK_CLOUDINARY_URL,
        format: 'jpg',
        width: 1000,
        height: 1000,
      },
    })
  )

  // Create design with photos
  await context.route('**/api/designs', (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        json: {
          success: true,
          data: { designId: MOCK_DESIGN_ID, sessionToken: MOCK_SESSION_TOKEN },
        },
      })
    }
    return route.continue()
  })

  // Update template
  await context.route(`**/api/designs/${MOCK_DESIGN_ID}/template`, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { designId: MOCK_DESIGN_ID, template: 'boheme' },
      },
    })
  )

  // Update configure
  await context.route(`**/api/designs/${MOCK_DESIGN_ID}/configure`, (route) =>
    route.fulfill({
      json: { success: true, data: { designId: MOCK_DESIGN_ID } },
    })
  )

  // Trigger generation — réponse rapide (pas d'attente Gemini)
  await context.route(`**/api/designs/${MOCK_DESIGN_ID}/generate`, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          designId: MOCK_DESIGN_ID,
          status: 'completed',
          iterationsUsed: 1,
          previewUrl: MOCK_PREVIEW_URL,
        },
      },
    })
  )

  // Poll status
  await context.route(`**/api/designs/${MOCK_DESIGN_ID}/status*`, (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { status: 'completed', iterationsUsed: 1 },
      },
    })
  )
}

/**
 * Nettoie le localStorage pour un flow propre.
 */
async function clearGenerationStore(page: Page) {
  await page.evaluate(() => localStorage.removeItem('siana-generation-store'))
}

test.describe('Flow de génération complet (upload → result)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page)
    await page.goto('/')
    await clearGenerationStore(page)
  })

  test('flow complet : upload → template → configure → generating → result', async ({ page }) => {
    // --- ÉTAPE 1 : UPLOAD ---
    await page.goto('/generate/upload')
    await expect(page.getByRole('heading', { name: /vos photos/i })).toBeVisible()

    // Upload une photo via l'input file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(TEST_PHOTO)

    // Attendre que la preview apparaisse et que le bouton "Continuer" soit actif
    await expect(page.getByRole('button', { name: /continuer/i })).toBeEnabled({ timeout: 10000 })

    // Cliquer sur Continuer
    await page.getByRole('button', { name: /continuer/i }).click()

    // --- ÉTAPE 2 : TEMPLATE ---
    await page.waitForURL('**/generate/template')
    await expect(page.getByRole('heading', { name: /style/i })).toBeVisible()

    // Sélectionner le template Bohème
    await page.getByRole('button', { name: /bohème/i }).click()

    // Vérifier que le template est sélectionné (aria-pressed)
    await expect(page.getByRole('button', { name: /bohème/i })).toHaveAttribute('aria-pressed', 'true')

    // Cliquer sur Continuer
    await page.getByRole('button', { name: /continuer/i }).click()

    // --- ÉTAPE 3 : CONFIGURE ---
    await page.waitForURL('**/generate/configure')
    await expect(page.getByRole('heading', { name: /votre mariage/i })).toBeVisible()

    // Remplir le formulaire
    await page.locator('#partner1Name').fill('Sophie')
    await page.locator('#partner2Name').fill('Thomas')
    await page.locator('#weddingDate').fill('2026-09-15')
    await page.locator('#weddingLocation').fill('Château de Lastours')

    // Vérifier la preview
    await expect(page.getByText('Sophie & Thomas')).toBeVisible()

    // Soumettre
    await page.getByRole('button', { name: /générer/i }).click()

    // --- ÉTAPE 4 : GENERATING → RESULT ---
    // Le mock génération répond instantanément, la page generating est traversée très vite
    // On attend directement l'arrivée sur result (peut passer par generating entre-temps)
    await page.waitForURL('**/generate/result', { timeout: 15000 })

    // --- ÉTAPE 5 : RESULT ---
    await expect(page.getByRole('heading', { name: /votre save the date est prêt/i })).toBeVisible()

    // Le bouton Commander doit être visible
    await expect(page.getByRole('button', { name: /commander/i })).toBeVisible()

    // Le bouton Ajuster doit être visible
    await expect(page.getByRole('button', { name: /ajuster/i })).toBeVisible()
  })

  test('page upload redirige si pas de photos et on clique continuer', async ({ page }) => {
    await page.goto('/generate/upload')

    // Le bouton Continuer doit être désactivé sans photos
    await expect(page.getByRole('button', { name: /continuer/i })).toBeDisabled()
  })

  test('page template redirige vers upload sans designId', async ({ page }) => {
    await page.goto('/generate/template')

    // Le guard doit rediriger vers upload
    await page.waitForURL('**/generate/upload')
  })

  test('page configure redirige vers template sans template sélectionné', async ({ page }) => {
    // Injecter seulement designId sans template
    await page.evaluate((data) => {
      localStorage.setItem('siana-generation-store', JSON.stringify({
        state: { designId: data.designId, sessionToken: data.token, selectedTemplate: null, _hasHydrated: true },
        version: 0,
      }))
    }, { designId: MOCK_DESIGN_ID, token: MOCK_SESSION_TOKEN })

    await page.goto('/generate/configure')
    await page.waitForURL('**/generate/template')
  })

  test('erreur de génération affiche le bouton réessayer', async ({ page }) => {
    // Override le mock generate pour retourner une erreur (context.route — last wins)
    await page.context().route(`**/api/designs/${MOCK_DESIGN_ID}/generate`, (route) =>
      route.fulfill({
        json: {
          success: false,
          error: { code: 'GENERATION_FAILED', message: 'Le service IA est temporairement indisponible.' },
        },
      })
    )

    // Injecter un état prêt pour la génération
    await page.evaluate((data) => {
      localStorage.setItem('siana-generation-store', JSON.stringify({
        state: {
          designId: data.designId,
          sessionToken: data.token,
          selectedTemplate: 'boheme',
          partner1Name: 'Sophie',
          partner2Name: 'Thomas',
          weddingDate: '2026-09-15',
          weddingLocation: 'Paris',
          currentStep: 'generating',
          iterationsUsed: 0,
          generatedImageUrl: null,
          pendingFeedback: null,
          orderId: null,
          isPaid: false,
          photos: [],
        },
        version: 0,
      }))
    }, { designId: MOCK_DESIGN_ID, token: MOCK_SESSION_TOKEN })

    await page.goto('/generate/generating')

    // Le mock auth passe, GeneratingView se lance et reçoit l'erreur du mock generate
    await expect(page.locator('#retry-generation-btn')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/indisponible/i)).toBeVisible()
  })
})
