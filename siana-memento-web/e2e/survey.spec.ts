import { test, expect, type Page } from '@playwright/test'

const TOKEN = 'a'.repeat(64)

async function mockGet(page: Page, body: object, status = 200) {
  await page.context().route(`**/api/survey/${TOKEN}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status, json: body })
    }
    return route.fallback()
  })
}

test.describe('Survey de satisfaction (page publique)', () => {
  test('remplir les 3 questions, soumettre, voir le remerciement (AC#2)', async ({ page }) => {
    await mockGet(page, { success: true, data: { alreadySubmitted: false } })
    await page.context().route(`**/api/survey/${TOKEN}`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, json: { success: true } })
      }
      return route.fulfill({ status: 200, json: { success: true, data: { alreadySubmitted: false } } })
    })

    await page.goto(`/survey/${TOKEN}`)
    await expect(
      page.getByRole('heading', { name: /Comment s’est passée votre expérience/ })
    ).toBeVisible()

    // Satisfaction globale = 5
    await page.getByRole('radiogroup', { name: /satisfaction globale/i }).getByText('5').click()
    // Qualité = 4
    await page.getByRole('radiogroup', { name: /qualité de votre design/i }).getByText('4').click()
    // Recommandation = Oui
    await page.getByRole('radiogroup', { name: /Recommandation/i }).getByText('Oui').click()

    const reqPromise = page.waitForRequest(
      (r) => r.url().includes(`/api/survey/${TOKEN}`) && r.method() === 'POST'
    )
    await page.getByRole('button', { name: 'Envoyer mon avis' }).click()
    await reqPromise

    await expect(page.getByText('Merci infiniment !')).toBeVisible()
  })

  test('token invalide → message d’erreur (AC#2)', async ({ page }) => {
    await mockGet(
      page,
      { success: false, error: { code: 'NOT_FOUND', message: 'Lien invalide' } },
      404
    )

    await page.goto(`/survey/${TOKEN}`)
    await expect(page.getByText('Lien invalide ou expiré')).toBeVisible()
  })

  test('déjà répondu → état « déjà fait »', async ({ page }) => {
    await mockGet(page, { success: true, data: { alreadySubmitted: true } })

    await page.goto(`/survey/${TOKEN}`)
    await expect(page.getByText('Merci, c’est déjà fait !')).toBeVisible()
  })
})
