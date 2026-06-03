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

  test('soumission sans rien sélectionner → erreurs inline et aucun POST', async ({ page }) => {
    await mockGet(page, { success: true, data: { alreadySubmitted: false } })

    let postCount = 0
    await page.context().route(`**/api/survey/${TOKEN}`, (route) => {
      if (route.request().method() === 'POST') {
        postCount += 1
        return route.fulfill({ status: 201, json: { success: true } })
      }
      return route.fulfill({ status: 200, json: { success: true, data: { alreadySubmitted: false } } })
    })

    await page.goto(`/survey/${TOKEN}`)
    await page.getByRole('button', { name: 'Envoyer mon avis' }).click()

    // Validation client : 3 messages inline, et la requête réseau n'est jamais partie.
    await expect(page.getByText('Merci de noter votre satisfaction globale.')).toBeVisible()
    await expect(page.getByText('Merci de noter la qualité de votre design.')).toBeVisible()
    await expect(page.getByText('Merci d’indiquer si vous nous recommanderiez.')).toBeVisible()
    expect(postCount).toBe(0)
  })

  test('recommandation « Non » → POST avec wouldRecommend=false puis remerciement', async ({
    page,
  }) => {
    await mockGet(page, { success: true, data: { alreadySubmitted: false } })
    await page.context().route(`**/api/survey/${TOKEN}`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 201, json: { success: true } })
      }
      return route.fulfill({ status: 200, json: { success: true, data: { alreadySubmitted: false } } })
    })

    await page.goto(`/survey/${TOKEN}`)
    await page.getByRole('radiogroup', { name: /satisfaction globale/i }).getByText('2').click()
    await page.getByRole('radiogroup', { name: /qualité de votre design/i }).getByText('3').click()
    await page.getByRole('radiogroup', { name: /Recommandation/i }).getByText('Non').click()

    const reqPromise = page.waitForRequest(
      (r) => r.url().includes(`/api/survey/${TOKEN}`) && r.method() === 'POST'
    )
    await page.getByRole('button', { name: 'Envoyer mon avis' }).click()
    const req = await reqPromise

    const body = req.postDataJSON()
    expect(body.wouldRecommend).toBe(false)
    expect(body.overallSatisfaction).toBe(2)
    expect(body.designQuality).toBe(3)

    await expect(page.getByText('Merci infiniment !')).toBeVisible()
  })

  test('erreur serveur à la soumission → toast d’échec, pas de remerciement', async ({ page }) => {
    await mockGet(page, { success: true, data: { alreadySubmitted: false } })
    await page.context().route(`**/api/survey/${TOKEN}`, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, json: { success: false } })
      }
      return route.fulfill({ status: 200, json: { success: true, data: { alreadySubmitted: false } } })
    })

    await page.goto(`/survey/${TOKEN}`)
    await page.getByRole('radiogroup', { name: /satisfaction globale/i }).getByText('5').click()
    await page.getByRole('radiogroup', { name: /qualité de votre design/i }).getByText('5').click()
    await page.getByRole('radiogroup', { name: /Recommandation/i }).getByText('Oui').click()
    await page.getByRole('button', { name: 'Envoyer mon avis' }).click()

    await expect(page.getByText(/envoi de votre réponse a échoué/i)).toBeVisible()
    await expect(page.getByText('Merci infiniment !')).toBeHidden()
  })
})
