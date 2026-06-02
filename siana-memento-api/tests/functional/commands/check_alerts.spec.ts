import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import ace from '@adonisjs/core/services/ace'
import { DateTime } from 'luxon'
import AlertState from '#models/alert_state'
import Order from '#models/order'
import User from '#models/user'
import { randomBytes } from 'node:crypto'
import { createDesign, createGeneration } from '#tests/helpers/factories'

/**
 * Tests fonctionnels de la commande alerts:check (Story 6.5).
 *
 * - Base de dev PARTAGÉE : on raisonne en DELTA. Avant chaque exécution on supprime
 *   l'AlertState du type testé, et on asserte sur sa présence/absence après run
 *   (preuve de déclenchement), pas sur des totaux globaux.
 * - ADMIN_ALERT_EMAIL absent en test → sendAdminAlert court-circuite l'appel Resend
 *   (aucun email réel). Le déclenchement se prouve via l'AlertState créé.
 */
test.group('alerts:check', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function clearAlertState(type: 'error_rate' | 'api_cost' | 'rate_limit') {
    await AlertState.query().where('alertType', type).delete()
  }

  // --- AC#1 : taux d'erreur des générations IA > 5% sur 15 min ---

  test('AC#1 déclenche error_rate quand le taux dépasse 5% avec volume suffisant', async ({
    assert,
  }) => {
    await clearAlertState('error_rate')
    const design = await createDesign({ template: 'boheme' })
    // 10 générations récentes dont 4 failed = 40% > 5%, volume (10) >= min_sample (5).
    for (let i = 0; i < 6; i++) {
      await createGeneration(design.id, { status: 'completed' })
    }
    for (let i = 0; i < 4; i++) {
      await createGeneration(design.id, { status: 'failed', errorMessage: 'Gemini timeout' })
    }

    await ace.exec('alerts:check', [])

    const state = await AlertState.findBy('alertType', 'error_rate')
    assert.isNotNull(state)
  })

  test('AC#1 ne déclenche PAS error_rate en faible volume (1 échec sur 1 = 100%)', async ({
    assert,
  }) => {
    await clearAlertState('error_rate')
    const design = await createDesign({ template: 'boheme' })
    // 1 seule génération failed : 100% mais volume (1) < min_sample (5) → pas d'alerte.
    await createGeneration(design.id, { status: 'failed', errorMessage: 'Gemini error' })

    await ace.exec('alerts:check', [])

    const state = await AlertState.findBy('alertType', 'error_rate')
    assert.isNull(state)
  })

  // --- AC#2 : coût moyen par commande > 0,70€ sur 24h ---

  test('AC#2 déclenche api_cost quand le coût moyen/commande dépasse 0,70€', async ({ assert }) => {
    await clearAlertState('api_cost')
    const user = await User.create({
      email: `alert-cost-${Date.now()}-${randomBytes(4).toString('hex')}@example.com`,
      password: 'motdepasse123',
      provider: 'email',
    })
    const design = await createDesign({ userId: user.id, template: 'boheme' })
    // 1 commande payée + 2 générations (estimation 0,50€ × 2 = 1,00€ / 1 commande = 1,00€ > 0,70€).
    await Order.create({
      userId: user.id,
      designId: design.id,
      amount: 1990,
      status: 'paid',
      paidAt: DateTime.now(),
      stripeSessionId: `cs_test_${Date.now()}_${randomBytes(4).toString('hex')}`,
    })
    await createGeneration(design.id, { status: 'completed' })
    await createGeneration(design.id, { status: 'completed', iterationNumber: 2 })

    await ace.exec('alerts:check', [])

    const state = await AlertState.findBy('alertType', 'api_cost')
    assert.isNotNull(state)
  })

  // --- AC#3 : proxy rate-limit via erreurs 429 / quota sur 24h ---

  test('AC#3 déclenche rate_limit sur erreurs 429 / RESOURCE_EXHAUSTED', async ({ assert }) => {
    await clearAlertState('rate_limit')
    const design = await createDesign({ template: 'boheme' })
    await createGeneration(design.id, {
      status: 'failed',
      errorMessage: 'Gemini API error 429 RESOURCE_EXHAUSTED: quota exceeded',
    })

    await ace.exec('alerts:check', [])

    const state = await AlertState.findBy('alertType', 'rate_limit')
    assert.isNotNull(state)
  })

  test('AC#3 ne déclenche PAS rate_limit sur erreurs non-quota', async ({ assert }) => {
    await clearAlertState('rate_limit')
    const design = await createDesign({ template: 'boheme' })
    // Erreur non liée au quota : ne doit pas matcher le pattern.
    await createGeneration(design.id, {
      status: 'failed',
      errorMessage: 'Impossible de charger la photo (HTTP 404)',
    })

    await ace.exec('alerts:check', [])

    const state = await AlertState.findBy('alertType', 'rate_limit')
    assert.isNull(state)
  })

  // --- D5 : déduplication / cooldown anti-spam ---

  test('D5 ne ré-émet pas dans le cooldown (last_triggered_at inchangé)', async ({ assert }) => {
    await clearAlertState('rate_limit')
    const design = await createDesign({ template: 'boheme' })
    await createGeneration(design.id, {
      status: 'failed',
      errorMessage: '429 RESOURCE_EXHAUSTED quota',
    })

    // 1ère exécution → crée l'AlertState.
    await ace.exec('alerts:check', [])
    const firstState = await AlertState.findBy('alertType', 'rate_limit')
    assert.isNotNull(firstState)
    const firstTriggeredAt = firstState!.lastTriggeredAt.toISO()

    // 2ème exécution immédiate (dans le cooldown par défaut 60 min) → pas de mise à jour.
    await ace.exec('alerts:check', [])
    const secondState = await AlertState.findBy('alertType', 'rate_limit')
    assert.isNotNull(secondState)
    assert.equal(secondState!.lastTriggeredAt.toISO(), firstTriggeredAt)
  })
})
